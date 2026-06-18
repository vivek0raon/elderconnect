import express from 'express';
import { getCaretakers, getCaretakerById, createOrUpdateProfile, getProfileByUserId } from '../controllers/caretakerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCaretakers);
router.post('/profile', authenticate, authorize('Caretaker'), createOrUpdateProfile);
router.put('/profile', authenticate, authorize('Caretaker'), createOrUpdateProfile);
router.get('/:userId/profile', getProfileByUserId);
router.get('/:id', getCaretakerById);

export default router;
