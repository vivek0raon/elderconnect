import express from 'express';
import { getMe, updateMe, getAllUsers, getUserById, deleteUser, getMyElders, addElder, updateElder, deleteElder } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

// Elder management routes
router.get('/me/elders', authenticate, getMyElders);
router.post('/me/elders', authenticate, addElder);
router.put('/me/elders/:elderId', authenticate, updateElder);
router.delete('/me/elders/:elderId', authenticate, deleteElder);

router.get('/', authenticate, authorize('Admin'), getAllUsers);
router.get('/:id', authenticate, authorize('Admin'), getUserById);
router.delete('/:id', authenticate, authorize('Admin'), deleteUser);

export default router;

