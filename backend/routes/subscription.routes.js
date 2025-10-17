import express from 'express';
import {
  getMySubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  processSubscriptionPayment,
  getAllSubscriptions,
  getDueSubscriptions,
  reactivateSubscription
} from '../controllers/subscription.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Resident routes
router.get('/my-subscription', protect, authorize('resident'), getMySubscription);
router.post('/', protect, authorize('resident'), createSubscription);
router.put('/:id', protect, authorize('resident'), updateSubscription);
router.delete('/:id', protect, authorize('resident'), cancelSubscription);
router.post('/:id/process-payment', protect, authorize('resident'), processSubscriptionPayment);
router.post('/:id/reactivate', protect, authorize('resident'), reactivateSubscription);

// Admin routes
router.get('/', protect, authorize('admin', 'authority'), getAllSubscriptions);
router.get('/due-billing', protect, authorize('admin', 'authority'), getDueSubscriptions);

export default router;
