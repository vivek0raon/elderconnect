import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import User from './models/User.js';
import CaretakerProfile from './models/CaretakerProfile.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';
import Message from './models/Message.js';

dotenv.config();

async function seed() {
  let mongod = null;

  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('Using in-memory MongoDB:', mongoUri);
    } else {
      console.log('Using MongoDB URI from env');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await CaretakerProfile.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@elderconnect.com',
      password: 'admin123',
      role: 'Admin',
      phone: '+1-555-0100',
      isActive: true
    });

    // Create customers
    const customers = await User.create([
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'Customer',
        phone: '+1-555-0101',
        address: { city: 'New York', state: 'NY', coordinates: { lat: 40.7128, lng: -74.006 } },
        isActive: true
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael@example.com',
        password: 'password123',
        role: 'Customer',
        phone: '+1-555-0102',
        address: { city: 'Los Angeles', state: 'CA', coordinates: { lat: 34.0522, lng: -118.2437 } },
        isActive: true
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily@example.com',
        password: 'password123',
        role: 'Customer',
        phone: '+1-555-0103',
        address: { city: 'Chicago', state: 'IL', coordinates: { lat: 41.8781, lng: -87.6298 } },
        isActive: true
      }
    ]);

    // Create elders
    const elders = await User.create([
      {
        firstName: 'Margaret',
        lastName: 'Johnson',
        email: 'margaret@example.com',
        password: 'password123',
        role: 'Elder',
        phone: '+1-555-0201',
        address: { city: 'New York', state: 'NY', coordinates: { lat: 40.7128, lng: -74.006 } },
        isActive: true
      },
      {
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert@example.com',
        password: 'password123',
        role: 'Elder',
        phone: '+1-555-0202',
        address: { city: 'Los Angeles', state: 'CA', coordinates: { lat: 34.0522, lng: -118.2437 } },
        isActive: true
      },
      {
        firstName: 'Dorothy',
        lastName: 'Williams',
        email: 'dorothy@example.com',
        password: 'password123',
        role: 'Elder',
        phone: '+1-555-0203',
        address: { city: 'Chicago', state: 'IL', coordinates: { lat: 41.8781, lng: -87.6298 } },
        isActive: true
      }
    ]);

    // Create caretakers
    const caretakersData = [
      {
        firstName: 'Alice',
        lastName: 'Thompson',
        email: 'alice@eldercare.com',
        password: 'password123',
        role: 'Caretaker',
        phone: '+1-555-0301',
        address: { city: 'New York', state: 'NY', coordinates: { lat: 40.7128, lng: -74.006 } },
        isActive: true
      },
      {
        firstName: 'James',
        lastName: 'Martinez',
        email: 'james@eldercare.com',
        password: 'password123',
        role: 'Caretaker',
        phone: '+1-555-0302',
        address: { city: 'Los Angeles', state: 'CA', coordinates: { lat: 34.0522, lng: -118.2437 } },
        isActive: true
      },
      {
        firstName: 'Patricia',
        lastName: 'Davis',
        email: 'patricia@eldercare.com',
        password: 'password123',
        role: 'Caretaker',
        phone: '+1-555-0303',
        address: { city: 'Chicago', state: 'IL', coordinates: { lat: 41.8781, lng: -87.6298 } },
        isActive: true
      },
      {
        firstName: 'William',
        lastName: 'Anderson',
        email: 'william@eldercare.com',
        password: 'password123',
        role: 'Caretaker',
        phone: '+1-555-0304',
        address: { city: 'New York', state: 'NY', coordinates: { lat: 40.7128, lng: -74.006 } },
        isActive: true
      },
      {
        firstName: 'Linda',
        lastName: 'Wilson',
        email: 'linda@eldercare.com',
        password: 'password123',
        role: 'Caretaker',
        phone: '+1-555-0305',
        address: { city: 'Los Angeles', state: 'CA', coordinates: { lat: 34.0522, lng: -118.2437 } },
        isActive: true
      }
    ];

    const caretakers = await User.create(caretakersData);

    // Create caretaker profiles
    const profiles = await CaretakerProfile.create([
      {
        user: caretakers[0]._id,
        bio: 'Experienced registered nurse with 10+ years in elder care.',
        services: ['Health Check-up', 'Medication Management', 'Mobility Assistance'],
        hourlyRate: 35,
        certifications: ['Registered Nurse (RN)', 'CPR Certified', 'Dementia Care Specialist'],
        experience: 10,
        availability: {
          monday: { available: true, start: '08:00', end: '18:00' },
          tuesday: { available: true, start: '08:00', end: '18:00' },
          wednesday: { available: true, start: '08:00', end: '18:00' },
          thursday: { available: true, start: '08:00', end: '18:00' },
          friday: { available: true, start: '08:00', end: '18:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        cities: ['New York'],
        languages: ['English', 'Spanish'],
        isVerified: true
      },
      {
        user: caretakers[1]._id,
        bio: 'Compassionate caregiver specializing in companionship and meal preparation.',
        services: ['Companionship', 'Meal Preparation', 'Errands'],
        hourlyRate: 25,
        certifications: ['Certified Nursing Assistant', 'First Aid Certified'],
        experience: 5,
        availability: {
          monday: { available: true, start: '09:00', end: '17:00' },
          tuesday: { available: true, start: '09:00', end: '17:00' },
          wednesday: { available: true, start: '09:00', end: '17:00' },
          thursday: { available: true, start: '09:00', end: '17:00' },
          friday: { available: true, start: '09:00', end: '17:00' },
          saturday: { available: true, start: '10:00', end: '16:00' },
          sunday: { available: true, start: '10:00', end: '16:00' }
        },
        cities: ['Los Angeles', 'San Diego'],
        languages: ['English', 'Spanish'],
        isVerified: true
      },
      {
        user: caretakers[2]._id,
        bio: 'Physical therapist turned elder care specialist.',
        services: ['Mobility Assistance', 'Health Check-up', 'Companionship'],
        hourlyRate: 40,
        certifications: ['Physical Therapist', 'Geriatric Care Specialist'],
        experience: 8,
        availability: {
          monday: { available: true, start: '07:00', end: '15:00' },
          tuesday: { available: true, start: '07:00', end: '15:00' },
          wednesday: { available: true, start: '07:00', end: '15:00' },
          thursday: { available: true, start: '07:00', end: '15:00' },
          friday: { available: true, start: '07:00', end: '15:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        cities: ['Chicago'],
        languages: ['English', 'Polish'],
        isVerified: true
      },
      {
        user: caretakers[3]._id,
        bio: 'Retired teacher with a passion for senior care and companionship.',
        services: ['Companionship', 'Errands', 'Meal Preparation'],
        hourlyRate: 22,
        certifications: ['Companion Care Certificate'],
        experience: 3,
        availability: {
          monday: { available: true, start: '10:00', end: '20:00' },
          tuesday: { available: true, start: '10:00', end: '20:00' },
          wednesday: { available: true, start: '10:00', end: '20:00' },
          thursday: { available: true, start: '10:00', end: '20:00' },
          friday: { available: true, start: '10:00', end: '20:00' },
          saturday: { available: true, start: '10:00', end: '20:00' },
          sunday: { available: true, start: '10:00', end: '20:00' }
        },
        cities: ['New York', 'Boston'],
        languages: ['English', 'French'],
        isVerified: true
      },
      {
        user: caretakers[4]._id,
        bio: 'Experienced caregiver with a background in pharmacy.',
        services: ['Medication Management', 'Health Check-up', 'Mobility Assistance'],
        hourlyRate: 32,
        certifications: ['Certified Medication Aide', 'CPR Certified'],
        experience: 6,
        availability: {
          monday: { available: true, start: '06:00', end: '14:00' },
          tuesday: { available: true, start: '06:00', end: '14:00' },
          wednesday: { available: true, start: '06:00', end: '14:00' },
          thursday: { available: true, start: '06:00', end: '14:00' },
          friday: { available: true, start: '06:00', end: '14:00' },
          saturday: { available: true, start: '06:00', end: '14:00' },
          sunday: { available: false }
        },
        cities: ['Los Angeles'],
        languages: ['English', 'Korean'],
        isVerified: true
      }
    ]);

    // Create a sample completed booking with review
    const booking1 = await Booking.create({
      customer: customers[0]._id,
      elder: elders[0]._id,
      caretaker: caretakers[0]._id,
      serviceType: 'Health Check-up',
      status: 'Completed',
      scheduledDate: new Date('2024-11-15'),
      startTime: '09:00',
      endTime: '11:00',
      address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', coordinates: { lat: 40.7128, lng: -74.006 } },
      notes: 'Check blood pressure and medication.',
      totalAmount: 70,
      paymentStatus: 'Paid',
      completedAt: new Date('2024-11-15T11:00:00Z')
    });

    // Create sample pending booking
    const booking2 = await Booking.create({
      customer: customers[1]._id,
      elder: elders[1]._id,
      caretaker: caretakers[1]._id,
      serviceType: 'Companionship',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 86400000),
      startTime: '14:00',
      endTime: '16:00',
      address: { street: '456 Sunset Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90028', coordinates: { lat: 34.0522, lng: -118.2437 } },
      notes: 'Weekly companionship visit.',
      totalAmount: 50,
      paymentStatus: 'Pending'
    });

    // Create sample accepted booking
    const booking3 = await Booking.create({
      customer: customers[2]._id,
      elder: elders[2]._id,
      caretaker: caretakers[2]._id,
      serviceType: 'Mobility Assistance',
      status: 'Accepted',
      scheduledDate: new Date(Date.now() + 172800000),
      startTime: '10:00',
      endTime: '12:00',
      address: { street: '789 Michigan Ave', city: 'Chicago', state: 'IL', zipCode: '60611', coordinates: { lat: 41.8781, lng: -87.6298 } },
      notes: 'Help with morning exercises.',
      totalAmount: 80,
      paymentStatus: 'Pending'
    });

    // Create a review for the completed booking
    await Review.create({
      booking: booking1._id,
      customer: customers[0]._id,
      caretaker: caretakers[0]._id,
      rating: 5,
      comment: 'Alice was wonderful with my mother. Very professional and caring.',
      isVisible: true
    });

    // Create sample messages
    await Message.create([
      {
        sender: customers[0]._id,
        receiver: caretakers[0]._id,
        booking: booking1._id,
        content: 'Hi Alice, thank you for taking care of my mother yesterday!',
        isRead: true
      },
      {
        sender: caretakers[0]._id,
        receiver: customers[0]._id,
        booking: booking1._id,
        content: "You're very welcome! Margaret is such a lovely person.",
        isRead: false
      },
      {
        sender: customers[1]._id,
        receiver: caretakers[1]._id,
        booking: booking2._id,
        content: 'Hi James, just confirming our appointment for tomorrow.',
        isRead: false
      }
    ]);

    // Update caretaker rating
    await CaretakerProfile.updateOne(
      { user: caretakers[0]._id },
      { rating: 5, totalReviews: 1 }
    );

    console.log('\nSeed data created successfully!');
    console.log(`Admin: ${admin.email}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Elders: ${elders.length}`);
    console.log(`Caretakers: ${caretakers.length}`);
    console.log(`Bookings: 3`);
    console.log(`Reviews: 1`);
    console.log(`Messages: 3`);

    await mongoose.disconnect();
    if (mongod) await mongod.stop();

  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

seed();
