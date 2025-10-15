import express from 'express';
import {
  getAllFeedback,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback,
  updateFeedbackStatus,
  getFeedbackStats
} from '../controllers/feedback.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Stats route (must be before /:id)
router.get('/stats', authorize('authority', 'admin'), getFeedbackStats);

// Main routes
router.route('/')
  .get(getAllFeedback)
  .post(createFeedback);

router.route('/:id')
  .get(getFeedback)
  .put(updateFeedback)
  .delete(deleteFeedback);

// Response and status routes
router.post('/:id/respond', authorize('authority', 'admin'), respondToFeedback);
router.patch('/:id/status', authorize('authority', 'admin'), updateFeedbackStatus);

export default router;
