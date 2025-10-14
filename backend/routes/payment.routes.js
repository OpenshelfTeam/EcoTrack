import express from 'express';
import { getPayments, createPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

export default router;
