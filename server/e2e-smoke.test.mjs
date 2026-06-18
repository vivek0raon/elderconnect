import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import bcryptjs from 'bcryptjs';

// We need to load all models before routes
import User from './models/User.js';
import CaretakerProfile from './models/CaretakerProfile.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';

// Setup minimal Express app with the routes we need
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import caretakerRoutes from './routes/caretakerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/caretakers', caretakerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('DB connected');

  // 1. Register customer
  const cust = await request(app).post('/api/auth/register').send({
    firstName: 'Alice', lastName: 'Customer', email: 'alice@test.com', password: 'password123', phone: '555-0001', role: 'Customer'
  });
  console.log('Register customer:', cust.status, cust.body.message || 'OK');

  // 2. Register caretaker
  const care = await request(app).post('/api/auth/register').send({
    firstName: 'Bob', lastName: 'Care', email: 'bob@test.com', password: 'password123', phone: '555-0002', role: 'Caretaker'
  });
  console.log('Register caretaker:', care.status, care.body.message || 'OK');

  // 3. Create caretaker profile
  const profile = await request(app).put('/api/caretakers/profile').set('Authorization', `Bearer ${care.body.token}`).send({
    bio: 'Experienced', services: ['Companionship'], hourlyRate: 25,
    availability: { monday: true, startTime: '09:00', endTime: '17:00' },
    city: 'Seattle', certifications: ['CPR'], experienceYears: 5
  });
  console.log('Create profile:', profile.status);

  // 4. Create booking
  const booking = await request(app).post('/api/bookings').set('Authorization', `Bearer ${cust.body.token}`).send({
    caretaker: care.body.user._id || care.body.user.id, serviceType: 'Companionship',
    scheduledDate: '2026-07-01', startTime: '09:00', endTime: '11:00',
    address: { street: '123 Main St', city: 'Seattle' }
  });
  console.log('Create booking:', booking.status, booking.body.message || 'OK');
  const bookingId = booking.body._id || booking.body.booking?._id;

  // 5. Accept booking
  const accept = await request(app).put(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${care.body.token}`).send({ status: 'Accepted' });
  console.log('Accept:', accept.status);

  // 6. Mark in progress, then complete
  const inProgress = await request(app).put(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${care.body.token}`).send({ status: 'In Progress' });
  console.log('In Progress:', inProgress.status);
  const complete = await request(app).put(`/api/bookings/${bookingId}/status`).set('Authorization', `Bearer ${care.body.token}`).send({ status: 'Completed' });
  console.log('Complete:', complete.status);

  // 7. Review
  const review = await request(app).post('/api/reviews').set('Authorization', `Bearer ${cust.body.token}`).send({
    bookingId: bookingId, caretaker: care.body.user._id || care.body.user.id,
    rating: 5, comment: 'Great service!'
  });
  console.log('Review:', review.status, review.body.message || 'OK');

  // 8. Check caretaker has review
  const careProfile = await request(app).get(`/api/caretakers/${care.body.user._id || care.body.user.id}/profile`);
  console.log('Profile rating:', careProfile.body.rating, 'totalReviews:', careProfile.body.totalReviews);

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('E2E PASS');
}

run().catch(e => { console.error('E2E FAIL:', e.message); process.exit(1); });
