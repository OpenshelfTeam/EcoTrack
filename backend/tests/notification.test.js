import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import notificationRoutes from '../routes/notification.routes.js';
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
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});

const mockReqRes = () => {
  const req = { body: {}, params: {}, query: {}, user: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
};

const createTestUser = async (role = 'resident') => {
  return await User.create({
    firstName: 'Test',
    lastName: role.charAt(0).toUpperCase() + role.slice(1),
    email: `test${role}${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    role,
    isActive: true
  });
};

const createTestNotification = async (recipient, status = 'sent') => {
  return await Notification.create({
    recipient: recipient._id,
    type: 'general',
    title: 'Test Notification',
    message: 'This is a test notification',
    priority: 'medium',
    channel: ['in-app'],
    status
  });
};

describe('Notification Controller Tests', () => {
  describe('getNotifications', () => {
    it('should get all notifications for user', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);
      await createTestNotification(user);

      req.user = { _id: user._id };
      req.query = {};

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should filter notifications by status', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user, 'sent');
      await createTestNotification(user, 'pending');

      req.user = { _id: user._id };
      req.query = { status: 'sent' };

      await getNotifications(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should filter unread notifications only', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);
      const readNotif = await createTestNotification(user);
      readNotif.readAt = new Date();
      readNotif.status = 'read';
      await readNotif.save();

      req.user = { _id: user._id };
      req.query = { unreadOnly: 'true' };

      await getNotifications(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      for (let i = 0; i < 25; i++) {
        await createTestNotification(user);
      }

      req.user = { _id: user._id };
      req.query = { page: '1', limit: '10' };

      await getNotifications(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(10);
      expect(response.total).toBe(25);
    });

    it('should return unread count', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);
      await createTestNotification(user);

      req.user = { _id: user._id };
      req.query = {};

      await getNotifications(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.unreadCount).toBe(2);
    });
  });

  describe('getNotification', () => {
    it('should get single notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user._id };

      await getNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            title: 'Test Notification'
          })
        })
      );
    });

    it('should return 404 for non-existent notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id };

      await getNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should deny access to other user notification', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const notification = await createTestNotification(user1);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user2._id, role: 'resident' };

      await getNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow admin to view any notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.user = { _id: admin._id, role: 'admin' };

      await getNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.body = {
        recipient: user._id,
        type: 'general',
        title: 'New Notification',
        message: 'Test message',
        priority: 'high'
      };

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            title: 'New Notification'
          })
        })
      );
    });

    it('should validate required fields', async () => {
      const { req, res } = mockReqRes();

      req.body = {
        title: 'Missing recipient'
      };

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateNotification', () => {
    it('should update notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.body = {
        title: 'Updated Title',
        priority: 'high'
      };

      await updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await Notification.findById(notification._id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
    });

    it('should return 404 for non-existent notification', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { title: 'Updated' };

      await updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteNotification', () => {
    it('should delete own notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user._id, role: 'resident' };

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    it('should deny deletion of other user notification', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const notification = await createTestNotification(user1);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user2._id, role: 'resident' };

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow admin to delete any notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.user = { _id: admin._id, role: 'admin' };

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const notification = await createTestNotification(user);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user._id };

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await Notification.findById(notification._id);
      expect(updated.readAt).toBeDefined();
      expect(updated.status).toBe('read');
    });

    it('should deny marking other user notification', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const notification = await createTestNotification(user1);

      req.params = { id: notification._id.toString() };
      req.user = { _id: user2._id };

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 for non-existent notification', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id };

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);
      await createTestNotification(user);

      req.user = { _id: user._id };

      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const unread = await Notification.countDocuments({
        recipient: user._id,
        readAt: { $exists: false }
      });
      expect(unread).toBe(0);
    });

    it('should return count of marked notifications', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);
      await createTestNotification(user);

      req.user = { _id: user._id };

      await markAllAsRead(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('2 notifications marked as read');
    });
  });

  describe('deleteReadNotifications', () => {
    it('should delete all read notifications', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      const notif1 = await createTestNotification(user);
      notif1.readAt = new Date();
      await notif1.save();

      const notif2 = await createTestNotification(user);
      notif2.readAt = new Date();
      await notif2.save();

      await createTestNotification(user); // Unread notification

      req.user = { _id: user._id };

      await deleteReadNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const remaining = await Notification.countDocuments({ recipient: user._id });
      expect(remaining).toBe(1);
    });

    it('should return count of deleted notifications', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      const notif = await createTestNotification(user);
      notif.readAt = new Date();
      await notif.save();

      req.user = { _id: user._id };

      await deleteReadNotifications(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('1 notifications deleted');
    });
  });

  describe('getNotificationPreferences', () => {
    it('should get user notification preferences', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };

      await getNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should return default preferences if none set', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };

      await getNotificationPreferences(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data).toHaveProperty('email');
      expect(response.data).toHaveProperty('push');
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        email: false,
        sms: true,
        push: true
      };

      await updateNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await User.findById(user._id);
      expect(updated.notificationPreferences.email).toBe(false);
    });
  });

  describe('sendBulkNotification', () => {
    it('should send bulk notifications to specific users', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      req.body = {
        recipients: [user1._id, user2._id],
        type: 'general',
        title: 'Bulk Notification',
        message: 'Test bulk message',
        priority: 'high'
      };

      await sendBulkNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const notifications = await Notification.find({ title: 'Bulk Notification' });
      expect(notifications).toHaveLength(2);
    });

    it('should send to all users when recipients is "all"', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('resident');
      await createTestUser('collector');

      req.body = {
        recipients: 'all',
        type: 'system-alert',
        title: 'System Announcement',
        message: 'Test announcement'
      };

      await sendBulkNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(3);
    });

    it('should set default priority if not provided', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.body = {
        recipients: [user._id],
        type: 'general',
        title: 'Test',
        message: 'Test message'
      };

      await sendBulkNotification(req, res);

      const notification = await Notification.findOne({ title: 'Test' });
      expect(notification.priority).toBe('medium');
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user, 'sent');
      await createTestNotification(user, 'pending');
      const readNotif = await createTestNotification(user, 'sent');
      readNotif.readAt = new Date();
      await readNotif.save();

      req.query = {};

      await getNotificationStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: expect.any(Number),
            sent: expect.any(Number),
            read: expect.any(Number),
            pending: expect.any(Number)
          })
        })
      );
    });

    it('should group by type', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);

      req.query = {};

      await getNotificationStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.byType).toBeDefined();
      expect(Array.isArray(response.data.byType)).toBe(true);
    });

    it('should group by priority', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);

      req.query = {};

      await getNotificationStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.byPriority).toBeDefined();
    });

    it('should include recent notifications', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestNotification(user);

      req.query = {};

      await getNotificationStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.recentNotifications).toBeDefined();
      expect(Array.isArray(response.data.recentNotifications)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in getNotifications', async () => {
      const { req, res } = mockReqRes();

      req.user = { _id: 'invalid-id' };
      req.query = {};

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors in createNotification', async () => {
      const { req, res } = mockReqRes();

      req.body = { invalid: 'data' };

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors in sendBulkNotification', async () => {
      const { req, res } = mockReqRes();

      req.body = { recipients: [], type: 'invalid' };

      await sendBulkNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
