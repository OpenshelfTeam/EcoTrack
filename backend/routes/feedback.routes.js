import express from 'express';
import { getFeedback, createFeedback } from '../controllers/feedback.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFeedback)
  .post(createFeedback);

export default router;
