import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData } from './fixtures.js';
import Notification from '../models/Notification.model.js';

let app;

describe('Notification Controller', () => {
  beforeAll(async () => {
    await startTestDB();
    app = getTestApp();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('GET /api/notifications', () => {
    test('Get user notifications', async () => {
      const resident = await createTestUser('resident');
      
      await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test',
        priority: 'medium'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('unreadCount');
    });

    test('Filter by status', async () => {
      const resident = await createTestUser('resident');
      
      await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test',
        priority: 'medium',
        status: 'sent'
      });

      const response = await request(app)
        .get('/api/notifications?status=sent')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(n => n.status === 'sent')).toBe(true);
    });

    test('Filter unread only', async () => {
      const resident = await createTestUser('resident');
      
      await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Unread',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(n => !n.readAt)).toBe(true);
    });

    test('Pagination works', async () => {
      const resident = await createTestUser('resident');
      
      for (let i = 0; i < 25; i++) {
        await Notification.create({
          recipient: resident.user._id,
          type: 'info',
          title: `Notification ${i}`,
          message: 'Test',
          priority: 'medium'
        });
      }

      const response = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pages).toBe(3);
    });
  });

  describe('GET /api/notifications/:id', () => {
    test('Get single notification', async () => {
      const resident = await createTestUser('resident');
      
      const notification = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test message',
        priority: 'high'
      });

      const response = await request(app)
        .get(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(notification._id.toString());
    });

    test('Cannot view other user notification', async () => {
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      const notification = await Notification.create({
        recipient: resident2.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .get(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${resident1.token}`);

      expect(response.status).toBe(403);
    });

    test('Admin can view any notification', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      const notification = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .get(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
    });

    test('Return 404 for non-existent notification', async () => {
      const resident = await createTestUser('resident');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/notifications', () => {
    test('Admin can create notification', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          recipient: resident.user._id,
          type: 'info',
          title: 'New Notification',
          message: 'Test message',
          priority: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Notification');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    test('Mark notification as read', async () => {
      const resident = await createTestUser('resident');
      
      const notification = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.readAt).toBeDefined();
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    test('Mark all notifications as read', async () => {
      const resident = await createTestUser('resident');
      
      await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test 1',
        message: 'Test',
        priority: 'medium'
      });
      
      await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test 2',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.modifiedCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('User can delete own notification', async () => {
      const resident = await createTestUser('resident');
      
      const notification = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Test',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      
      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });
  });

  describe('DELETE /api/notifications/read', () => {
    test('Delete all read notifications', async () => {
      const resident = await createTestUser('resident');
      
      const readNotif = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Read',
        message: 'Test',
        priority: 'medium',
        readAt: new Date()
      });
      
      const unreadNotif = await Notification.create({
        recipient: resident.user._id,
        type: 'info',
        title: 'Unread',
        message: 'Test',
        priority: 'medium'
      });

      const response = await request(app)
        .delete('/api/notifications/read')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      
      const deleted = await Notification.findById(readNotif._id);
      const stillExists = await Notification.findById(unreadNotif._id);
      expect(deleted).toBeNull();
      expect(stillExists).not.toBeNull();
    });
  });

  describe('GET /api/notifications/preferences', () => {
    test('Get notification preferences', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    test('Update notification preferences', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${resident.token}`)
        .send({
          emailNotifications: true,
          pushNotifications: false
        });

      expect(response.status).toBe(200);
    });
  });
});
