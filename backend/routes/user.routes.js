import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  activateUser,
  deactivateUser,
  getUserStats,
  getUserActivity
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Stats route (must be before /:id)
router.get('/stats', authorize('admin', 'authority'), getUserStats);

// Main routes
router.get('/', authorize('admin', 'authority', 'operator'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Admin management routes
router.patch('/:id/role', authorize('admin'), updateUserRole);
router.patch('/:id/activate', authorize('admin'), activateUser);
router.patch('/:id/deactivate', authorize('admin'), deactivateUser);

// Activity route
router.get('/:id/activity', getUserActivity);

export default router;
