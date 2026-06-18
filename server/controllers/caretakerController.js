import mongoose from 'mongoose';
import CaretakerProfile from '../models/CaretakerProfile.js';
import Review from '../models/Review.js';

// GET /api/caretakers — list all with filters
export const getCaretakers = async (req, res) => {
  try {
    const { city, service, minRate, maxRate, minRating, language, isVerified } = req.query;

    let query = {};

    if (city) {
      query.cities = { $in: [new RegExp(city, 'i')] };
    }
    if (service) {
      query.services = { $in: [new RegExp(service, 'i')] };
    }
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    if (language) {
      query.languages = { $in: [new RegExp(language, 'i')] };
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const profiles = await CaretakerProfile.find(query)
      .populate('user', 'firstName lastName email phone avatar address isActive')
      .sort({ rating: -1, createdAt: -1 });

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/caretakers/:id — single caretaker with full details
export const getCaretakerById = async (req, res) => {
  try {
    const profile = await CaretakerProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar address isActive');
    if (!profile) return res.status(404).json({ message: 'Caretaker not found' });

    // Get reviews for this caretaker
    const reviews = await Review.find({ caretaker: profile.user._id })
      .populate('customer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ profile, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/caretakers/profile — create or update own profile (caretaker only)
export const createOrUpdateProfile = async (req, res) => {
  try {
    const updateData = req.body;
    updateData.user = req.user.id;

    const profile = await CaretakerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/caretakers/:userId/profile — get by user ID
export const getProfileByUserId = async (req, res) => {
  try {
    const profile = await CaretakerProfile.findOne({ user: req.params.userId })
      .populate('user', 'firstName lastName email phone avatar address isActive');
    if (!profile) return res.status(404).json({ message: 'Caretaker profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
