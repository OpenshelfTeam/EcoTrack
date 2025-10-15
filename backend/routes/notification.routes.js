import express from 'express';
import {
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendBulkNotification,
  getNotificationStats
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Stats and bulk operations (must be before /:id)
router.get('/stats', authorize('authority', 'admin'), getNotificationStats);
router.post('/bulk', authorize('authority', 'admin'), sendBulkNotification);

// Preferences routes
router.route('/preferences')
  .get(getNotificationPreferences)
  .put(updateNotificationPreferences);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Delete read notifications
router.delete('/read', deleteReadNotifications);

// Main routes
router.route('/')
  .get(getNotifications)
  .post(authorize('admin'), createNotification);

router.route('/:id')
  .get(getNotification)
  .put(authorize('admin'), updateNotification)
  .delete(deleteNotification);

// Mark as read
router.patch('/:id/read', markAsRead);

export default router;
