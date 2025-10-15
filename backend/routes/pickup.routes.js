import express from 'express';
import {
  createPickupRequest,
  getPickupRequests,
  getPickupRequest,
  updatePickupRequest,
  updatePickupStatus,
  assignCollector,
  cancelPickupRequest,
  getPickupStats
} from '../controllers/pickup.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Stats route (must be before /:id)
router.get('/stats', authorize('collector', 'operator', 'admin'), getPickupStats);

// Main CRUD routes
router
  .route('/')
  .get(getPickupRequests)
  .post(authorize('resident'), createPickupRequest);

router
  .route('/:id')
  .get(getPickupRequest)
  .put(updatePickupRequest)
  .delete(cancelPickupRequest);

// Status and assignment routes
router.patch('/:id/status', authorize('collector', 'operator', 'admin'), updatePickupStatus);
router.patch('/:id/assign', authorize('operator', 'admin'), assignCollector);

export default router;
