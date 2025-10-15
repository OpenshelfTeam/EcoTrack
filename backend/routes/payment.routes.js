import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  processPayment,
  updatePaymentStatus,
  refundPayment,
  generateInvoice,
  getPaymentStats,
  getUserPaymentHistory,
  getOverduePayments
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Stats and special routes (before /:id)
router.get('/stats', authorize('operator', 'admin', 'authority'), getPaymentStats);
router.get('/overdue', authorize('operator', 'admin', 'authority'), getOverduePayments);
router.get('/user/:userId/history', getUserPaymentHistory);
router.post('/generate-invoice', authorize('operator', 'admin'), generateInvoice);

// Main CRUD routes
router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(getPayment);

// Action routes
router.patch('/:id/process', processPayment);
router.patch('/:id/status', authorize('operator', 'admin'), updatePaymentStatus);
router.patch('/:id/refund', authorize('operator', 'admin'), refundPayment);

export default router;
