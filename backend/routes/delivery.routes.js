import express from 'express';
import { createDelivery, updateDeliveryStatus, confirmReceipt, getDeliveries } from '../controllers/delivery.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('operator', 'admin'), createDelivery);
router.get('/', getDeliveries);
router.patch('/:id/status', authorize('operator', 'collector', 'admin'), updateDeliveryStatus);
router.post('/:id/confirm', authorize('resident', 'operator', 'admin'), confirmReceipt);

export default router;
