import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createReview,
  getReviewsByCaretaker,
  getReviewByBooking,
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', authenticate, authorize('Customer', 'Admin'), createReview);
router.get('/caretaker/:caretakerId', authenticate, getReviewsByCaretaker);
router.get('/booking/:bookingId', authenticate, getReviewByBooking);

export default router;
