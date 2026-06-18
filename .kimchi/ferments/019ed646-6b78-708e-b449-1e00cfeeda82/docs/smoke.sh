#!/usr/bin/env bash
# ElderConnect end-to-end booking flow smoke test.
# Starts the server, seeds data, hits the booking endpoints, and reports PASS/FAIL.

set -u

BASE="http://localhost:5000/api"
SERVER_DIR="/mnt/d/elderconnect-redesigned/server"
NODE_BIN="/mnt/c/Program Files/nodejs"

# Export PATH so node/npm resolve on Windows-mounted host binaries.
export PATH="$NODE_BIN:$PATH"

FAILED_ENDPOINTS=()
PASS_COUNT=0
LIMITED_MODE=0
SERVER_PID=""

# --- Helpers ---------------------------------------------------------------
log()   { printf "[smoke] %s\n" "$*"; }
fail()  { printf "[FAIL] %s\n" "$*"; FAILED_ENDPOINTS+=("$*"); }
ok()    { printf "[OK]   %s\n" "$*"; PASS_COUNT=$((PASS_COUNT+1)); }

# Run a curl request, echo the status code on stdout, body to a temp file.
# Args: METHOD PATH [data] [auth_token]
http_call() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local body_file status
  body_file=$(mktemp)
  local args=(-s -o "$body_file" -w "%{http_code}" -X "$method" "$BASE$path"
              -H "Content-Type: application/json")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [ -n "$data" ]; then
    args+=(-d "$data")
  fi
  status=$(curl "${args[@]}")
  echo "$status"
  cat "$body_file"
  rm -f "$body_file"
}

# Extract a JSON field with python (no jq available). Usage: json_get <body> <key>
json_get() {
  local body="$1" key="$2"
  printf '%s' "$body" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(0)
def get(o,k):
    if isinstance(o,dict):
        return o.get(k)
    if isinstance(o,list) and o and isinstance(o[0],dict):
        return o[0].get(k)
    return None
v=get(d,'$key')
print(v if v is not None else '')
"
}

# Check status code is in the 2xx range.
expect_2xx() {
  local label="$1" status="$2"
  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    ok "$label ($status)"
    return 0
  else
    fail "$label (status=$status)"
    return 1
  fi
}

# --- Cleanup ---------------------------------------------------------------
cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    log "Stopping server (PID $SERVER_PID)"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# --- Step 1: Start server --------------------------------------------------
log "Starting server..."
( cd "$SERVER_DIR" && node server.js > /tmp/elderconnect_server.log 2>&1 ) &
SERVER_PID=$!
log "Server PID: $SERVER_PID"

# --- Step 2: Wait for boot -------------------------------------------------
sleep 5

# --- Step 3: Health check --------------------------------------------------
log "Health check"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/health")
HEALTH_STATUS=$(printf '%s' "$RESP" | tail -n1)
HEALTH_BODY=$(printf '%s' "$RESP" | sed '$d')
log "health body: $HEALTH_BODY"
if [ "$HEALTH_STATUS" -ge 200 ] && [ "$HEALTH_STATUS" -lt 300 ] \
   && printf '%s' "$HEALTH_BODY" | grep -q '"status":"ok"'; then
  ok "GET /api/health"
else
  fail "GET /api/health (status=$HEALTH_STATUS body=$HEALTH_BODY)"
  log "Server did not come up healthy. Dumping server log:"
  cat /tmp/elderconnect_server.log 2>/dev/null || true
  # Per spec: if MongoDB is unreachable, fall back to limited smoke test.
  if grep -qiE 'mongodb|mongoose' /tmp/elderconnect_server.log 2>/dev/null \
     || [ "$HEALTH_STATUS" = "000" ]; then
    printf "LIMITED SMOKE TEST: GET /api/health unreachable (likely no MongoDB on localhost:27017).\n"
    exit 2
  fi
  printf "FAIL\n"
  exit 1
fi

# --- Step 4: Seed data -----------------------------------------------------
log "Seeding database..."
if ! ( cd "$SERVER_DIR" && node seed.js > /tmp/elderconnect_seed.log 2>&1 ); then
  log "Seed script failed (likely no MongoDB). Falling back to limited smoke test."
  cat /tmp/elderconnect_seed.log 2>/dev/null | tail -20
  LIMITED_MODE=1
fi

if [ "$LIMITED_MODE" -eq 1 ]; then
  log "LIMITED MODE: skipping booking flow endpoints"
  printf "FAIL\n"
  printf "Failing endpoints: %s\n" "${FAILED_ENDPOINTS[*]:-GET /api/health}"
  exit 1
fi

# --- Step 5: Auth flow -----------------------------------------------------
TS=$(date +%s)
CUST_EMAIL="customer_${TS}@example.com"
CUST_PASS="Password123!"
CARE_EMAIL="alice@eldercare.com"
CARE_PASS="password123"

log "Register customer ($CUST_EMAIL)"
RESP=$(http_call POST /auth/register \
  "{\"firstName\":\"Smoke\",\"lastName\":\"Tester\",\"email\":\"$CUST_EMAIL\",\"password\":\"$CUST_PASS\",\"role\":\"Customer\",\"phone\":\"+1-555-9999\",\"address\":{\"city\":\"New York\"}}")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "register body: $BODY"
expect_2xx "POST /api/auth/register" "$STATUS" || true
CUST_TOKEN=$(json_get "$BODY" "token")

log "Login customer"
RESP=$(http_call POST /auth/login \
  "{\"email\":\"$CUST_EMAIL\",\"password\":\"$CUST_PASS\"}")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
expect_2xx "POST /api/auth/login" "$STATUS" || true
CUST_TOKEN=$(json_get "$BODY" "token")
[ -z "$CUST_TOKEN" ] && CUST_TOKEN=$(printf '%s' "$BODY" | python3 -c "import json,sys;print(json.load(sys.stdin).get('token',''))")

if [ -z "$CUST_TOKEN" ]; then
  fail "Could not obtain customer token"
  printf "FAIL\n"
  printf "Failing endpoints: %s\n" "${FAILED_ENDPOINTS[*]}"
  exit 1
fi

log "GET /api/auth/me"
RESP=$(http_call GET /auth/me "" "$CUST_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
expect_2xx "GET /api/auth/me" "$STATUS" || true

# --- Step 6: Caretakers ----------------------------------------------------
log "List caretakers"
RESP=$(http_call GET /caretakers)
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
expect_2xx "GET /api/caretakers" "$STATUS" || true

# Extract a caretaker's user _id from the list (the populated `user` field).
CARE_USER_ID=$(printf '%s' "$BODY" | python3 -c "
import json,sys
try:
    arr=json.load(sys.stdin)
except Exception:
    print(''); sys.exit(0)
if isinstance(arr,list) and arr:
    u=arr[0].get('user') or {}
    if isinstance(u,dict):
        print(u.get('_id',''))
    else:
        print(u)
else:
    print('')
")
if [ -z "$CARE_USER_ID" ]; then
  fail "Could not extract caretaker user id from /api/caretakers"
  printf "FAIL\n"
  printf "Failing endpoints: %s\n" "${FAILED_ENDPOINTS[*]}"
  exit 1
fi
log "Selected caretaker user id: $CARE_USER_ID"

log "GET caretaker profile by user id"
RESP=$(http_call GET "/caretakers/$CARE_USER_ID/profile")
STATUS=$(printf '%s' "$RESP" | tail -n1)
expect_2xx "GET /api/caretakers/:id/profile" "$STATUS" || true

# --- Step 7: Booking -------------------------------------------------------
log "Login caretaker (alice) to drive status transitions"
RESP=$(http_call POST /auth/login \
  "{\"email\":\"$CARE_EMAIL\",\"password\":\"$CARE_PASS\"}")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
if [ "$STATUS" -lt 200 ] || [ "$STATUS" -ge 300 ]; then
  log "Caretaker login failed (status=$STATUS body=$BODY) -- using customer token for status updates"
  CARE_TOKEN="$CUST_TOKEN"
else
  CARE_TOKEN=$(printf '%s' "$BODY" | python3 -c "import json,sys;print(json.load(sys.stdin).get('token',''))")
fi

# Schedule the booking on a future weekday within caretaker availability.
FUTURE_DATE=$(python3 -c "
from datetime import date, timedelta
d = date.today() + timedelta(days=3)
# Skip to next Monday to be safe
while d.weekday() >= 5:  # 5=Sat,6=Sun
    d += timedelta(days=1)
print(d.isoformat())
")

log "Create booking (date=$FUTURE_DATE)"
BOOKING_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
  'caretaker': '$CARE_USER_ID',
  'serviceType': 'Health Check-up',
  'scheduledDate': '$FUTURE_DATE',
  'startTime': '10:00',
  'endTime': '12:00',
  'address': {'street': '742 Evergreen Terrace', 'city': 'New York', 'state': 'NY', 'zipCode': '10001'},
  'notes': 'Smoke test booking',
  'isUrgent': False
}))
")
RESP=$(http_call POST /bookings "$BOOKING_PAYLOAD" "$CUST_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "create booking body: $BODY"
expect_2xx "POST /api/bookings" "$STATUS" || true
BOOKING_ID=$(printf '%s' "$BODY" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    print(''); sys.exit(0)
print(d.get('_id') or d.get('id') or '')
")
if [ -z "$BOOKING_ID" ]; then
  fail "Could not extract booking id"
  printf "FAIL\n"
  printf "Failing endpoints: %s\n" "${FAILED_ENDPOINTS[*]}"
  exit 1
fi
log "Booking id: $BOOKING_ID"

log "Update booking status: Pending -> Accepted (as caretaker)"
RESP=$(http_call PUT "/bookings/$BOOKING_ID/status" '{"status":"Accepted"}' "$CARE_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "accept body: $BODY"
expect_2xx "PUT /api/bookings/:id/status (Accepted)" "$STATUS" || true

log "Update booking status: Accepted -> In Progress (as caretaker)"
RESP=$(http_call PUT "/bookings/$BOOKING_ID/status" '{"status":"In Progress"}' "$CARE_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "in-progress body: $BODY"
expect_2xx "PUT /api/bookings/:id/status (In Progress)" "$STATUS" || true

log "Update booking status: In Progress -> Completed (as caretaker)"
RESP=$(http_call PUT "/bookings/$BOOKING_ID/status" '{"status":"Completed"}' "$CARE_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "completed body: $BODY"
expect_2xx "PUT /api/bookings/:id/status (Completed)" "$STATUS" || true

# --- Step 8: Review --------------------------------------------------------
log "Create review for completed booking"
REVIEW_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
  'bookingId': '$BOOKING_ID',
  'rating': 5,
  'comment': 'Excellent care during the smoke test.'
}))
")
RESP=$(http_call POST /reviews "$REVIEW_PAYLOAD" "$CUST_TOKEN")
STATUS=$(printf '%s' "$RESP" | tail -n1)
BODY=$(printf '%s' "$RESP" | sed '$d')
log "review body: $BODY"
expect_2xx "POST /api/reviews" "$STATUS" || true

# --- Step 9: Report --------------------------------------------------------
echo
echo "============================================="
echo "Smoke test summary: $PASS_COUNT endpoints OK"
if [ "${#FAILED_ENDPOINTS[@]}" -eq 0 ]; then
  echo "PASS"
  exit 0
else
  echo "Failing endpoints:"
  for e in "${FAILED_ENDPOINTS[@]}"; do
    echo "  - $e"
  done
  echo "FAIL"
  exit 1
fi
