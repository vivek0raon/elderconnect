# ElderConnect — Elder Care Booking Platform

A full-stack MERN platform for discovering, booking, and reviewing professional caretakers for elderly family members. Customers browse verified caretaker profiles, schedule visits, pay securely, and chat in real time. Caretakers manage their profiles, availability, and bookings. Admins oversee the marketplace.

## Features

1. **Role-based authentication** — JWT login/register for Customer, Elder, Caretaker, and Admin roles.
2. **Caretaker discovery and search** — Filter caretakers by city, service type, price, and rating.
3. **Verified caretaker profiles** — Bios, certifications, hourly rate, languages, and weekly availability.
4. **Interactive Leaflet map view** — Browse caretakers geographically across multiple cities.
5. **Booking workflow** — Customers create bookings; caretakers accept/complete them with status transitions.
6. **Calendar and availability checks** — Server-side validation against the caretaker's weekly schedule.
7. **Stripe checkout** — Secure test-mode card payments with a dedicated Stripe payment page.
8. **Reviews and ratings** — Customers leave 1–5 star reviews after a completed booking.
9. **Real-time chat (Socket.io)** — Per-booking rooms with live message delivery and history.
10. **Customer dashboard** — Track bookings, payments, and outstanding reviews at a glance.
11. **Caretaker dashboard** — Manage incoming requests, schedule, and earnings.
12. **Admin dashboard** — User management, role assignment, and platform oversight.
13. **Responsive UI** — Tailwind CSS, accessible components, mobile-first layouts.

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, Stripe.js, Leaflet, Socket.io Client
- **Backend:** Node.js, Express 5, Mongoose 9, Socket.io 4, JWT, bcryptjs, Stripe SDK
- **Database:** MongoDB (local or MongoDB Atlas)
- **Tooling:** ESLint, Nodemon, MongoMemoryServer (seed)

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- MongoDB v6+ running locally, or a MongoDB Atlas connection string
- A Stripe account (test keys) for the payment flow
- Map views are powered by Leaflet & CartoDB tiles (no map api keys or accounts required)

## Installation

```bash
git clone <your-repo-url> elderconnect
cd elderconnect

# Backend
cd server
npm install
npm run seed

# Frontend
cd ../client
npm install
```

The seed script populates a rich set of demo users, caretaker profiles, bookings, and reviews using an in-memory MongoDB or your configured `MONGODB_URI`.

## Environment Variables

Copy the example files and fill in your own secrets.

### `server/.env.example`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/elderconnect
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```

### `client/.env.example`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `PORT` | server | Express listen port |
| `MONGODB_URI` | server | Mongo connection string |
| `JWT_SECRET` | server | Signs and verifies auth tokens |
| `STRIPE_SECRET_KEY` | server | Server-side Stripe calls |
| `CLIENT_URL` | server | Allowed CORS origin for the deployed frontend |
| `VITE_API_URL` | client | Base URL for REST calls |
| `VITE_SOCKET_URL` | client | Socket.io server URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | client | Stripe.js publishable key |

## Running Locally

In two terminals:

```bash
# Terminal 1 — backend (port 5000)
cd server
npm run dev

# Terminal 2 — frontend (port 5173)
cd client
npm run dev
```

Open `http://localhost:5173` and sign in with one of the demo accounts below.

## Production Build

```bash
cd client
npm run build
```

This produces a static bundle in `client/dist` ready to deploy to any static host. The backend ships as plain Node ESM and is started with `node server.js` (see `npm start` in `server/package.json`).

## Deployment Guide

### Frontend — Vercel

1. Push the repository to GitHub.
2. In Vercel, **Import Project** and select the repo.
3. Set **Root Directory** to `client`.
4. Vercel auto-detects Vite. Override if needed:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add the four `VITE_*` environment variables from `client/.env.example` in **Settings → Environment Variables**.
6. The included `client/vercel.json` rewrites all routes to `index.html` so React Router works on hard refresh.

### Backend — Railway or Render

**Railway**

1. **New Project → Deploy from GitHub repo.**
2. Set **Root Directory** to `server`.
3. Railway auto-detects Node. Confirm the start command is `npm start` (which runs `node server.js`).
4. Add the five server environment variables from `server/.env.example`.
5. Note the public URL (e.g. `https://elderconnect-api.up.railway.app`) and use it for the client's `VITE_API_URL` and `VITE_SOCKET_URL`.

**Render**

1. **New → Web Service**, connect the repo.
2. **Root Directory:** `server`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
5. Add the same five server env vars.
6. Use a paid plan or set `Auto-Deploy` carefully — free web services spin down on idle.

### Database — MongoDB Atlas

1. Create a free Atlas cluster.
2. Add a database user and whitelist `0.0.0.0/0` (or the platform's outbound IPs).
3. Copy the connection string into `MONGODB_URI` for the backend service.
4. Re-run `npm run seed` against Atlas to populate demo data, or seed locally first and import.

### Connecting the Pieces

After deploying both halves:

1. Set the backend's `CLIENT_URL` to your deployed frontend origin (e.g. `https://elderconnect.vercel.app`).
2. Set the frontend's `VITE_API_URL` to `https://<your-backend>/api` and `VITE_SOCKET_URL` to `https://<your-backend>`.
3. Redeploy both services.

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create a new account |
| POST | `/auth/login` | public | Sign in, returns JWT |
| GET | `/auth/me` | bearer | Current user profile |

### Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users/me` | bearer | Get current user |
| PUT | `/users/me` | bearer | Update current user |
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Admin | Get user by id |
| DELETE | `/users/:id` | Admin | Delete user |

### Caretakers

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/caretakers` | public | List/search caretakers |
| GET | `/caretakers/:id` | public | Caretaker detail |
| POST | `/caretakers/profile` | Caretaker | Create profile |
| PUT | `/caretakers/profile` | Caretaker | Update profile |
| GET | `/caretakers/:userId/profile` | public | Public profile by user id |

### Bookings

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/bookings` | Customer/Admin | Create a booking |
| GET | `/bookings/my-bookings` | bearer | Current user's bookings |
| GET | `/bookings/availability/:caretakerId` | bearer | Slots for a date |
| GET | `/bookings/:id` | bearer | Booking detail |
| PUT | `/bookings/:id/status` | bearer | Accept/complete/cancel |
| DELETE | `/bookings/:id` | bearer | Cancel booking |

### Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/reviews` | Customer/Admin | Leave a review |
| GET | `/reviews/caretaker/:caretakerId` | bearer | Reviews for caretaker |
| GET | `/reviews/booking/:bookingId` | bearer | Review for a booking |

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Service heartbeat |


## Project Structure

```
elderconnect/
├── client/                  # Vite + React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI (Navbar, CaretakerCard, StarRating, ui/)
│   │   ├── pages/           # Route-level screens
│   │   ├── contexts/        # Auth and chat providers
│   │   ├── services/        # Axios API client
│   │   ├── lib/             # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   └── .env.example
└── server/                  # Express + Mongoose API
    ├── config/              # DB connection
    ├── controllers/         # Route handlers
    ├── middleware/          # Auth and authorization
    ├── models/              # Mongoose schemas
    ├── routes/              # Express routers
    ├── socket/              # Socket.io chat server
    ├── seed.js              # Demo data seeder
    ├── server.js            # App entry point
    └── .env.example
```

## Screenshots

_Add screenshots of the landing page, search page, caretaker profile, and dashboards here._

## License

MIT
