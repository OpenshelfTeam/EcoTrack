import { getAllFeedback, createFeedback, updateFeedback } from '../controllers/feedback.controller.js';
import Feedback from '../models/Feedback.model.js';
import { startTestDB, stopTestDB } from './testUtils.js';
import { cleanupTestData, createTestUser } from './fixtures.js';

// Helper to create mock res object
const mockResponse = () => {
  const res = {};
  res.status = function(code) { res.statusCode = code; return res; };
  res.json = function(data) { res.data = data; return res; };
  return res;
};

describe('Feedback Controller - Unit Tests', () => {
  beforeAll(async () => {
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('getAllFeedback', () => {
    test('should return all feedback for admin', async () => {
      const admin = await createTestUser('admin');

      await Feedback.create({
        user: admin.user._id,
        category: 'collection-service',
        subject: 'Great service',
        message: 'Very satisfied',
        rating: 5
      });

      const req = {
        query: {},
        user: admin.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    test('should filter by category', async () => {
      const admin = await createTestUser('admin');

      await Feedback.create({
        user: admin.user._id,
        category: 'service',
        subject: 'Service feedback',
        message: 'Test',
        rating: 5
      });

      await Feedback.create({
        user: admin.user._id,
        category: 'billing',
        subject: 'Billing feedback',
        message: 'Test',
        rating: 3
      });

      const req = {
        query: { category: 'service' },
        user: admin.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.every(f => f.category === 'service')).toBe(true);
    });

    test('should return only own feedback for residents', async () => {
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      await Feedback.create({
        user: resident1.user._id,
        category: 'service',
        subject: 'User1 feedback',
        message: 'Test',
        rating: 5
      });

      await Feedback.create({
        user: resident2.user._id,
        category: 'service',
        subject: 'User2 feedback',
        message: 'Test',
        rating: 4
      });

      const req = {
        query: {},
        user: resident1.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.length).toBe(1);
      expect(res.data.data[0].subject).toBe('User1 feedback');
    });

    test('should handle pagination', async () => {
      const admin = await createTestUser('admin');

      for (let i = 0; i < 15; i++) {
        await Feedback.create({
          user: admin.user._id,
          category: 'service',
          subject: `Feedback ${i}`,
          message: 'Test',
          rating: 5
        });
      }

      const req = {
        query: { page: '1', limit: '10' },
        user: admin.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(10);
      expect(res.data.total).toBe(15);
      expect(res.data.pages).toBe(2);
    });

    test('should filter by rating', async () => {
      const admin = await createTestUser('admin');

      await Feedback.create({
        user: admin.user._id,
        category: 'service',
        subject: 'High rating',
        message: 'Great',
        rating: 5
      });

      await Feedback.create({
        user: admin.user._id,
        category: 'service',
        subject: 'Low rating',
        message: 'Poor',
        rating: 2
      });

      const req = {
        query: { rating: '5' },
        user: admin.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.every(f => f.rating === 5)).toBe(true);
    });

    test('should search by subject', async () => {
      const admin = await createTestUser('admin');

      await Feedback.create({
        user: admin.user._id,
        category: 'service',
        subject: 'Excellent waste collection',
        message: 'Very happy',
        rating: 5
      });

      await Feedback.create({
        user: admin.user._id,
        category: 'service',
        subject: 'Poor service',
        message: 'Not satisfied',
        rating: 2
      });

      const req = {
        query: { search: 'excellent' },
        user: admin.user
      };

      const res = mockResponse();
      await getAllFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.length).toBe(1);
    });
  });

  describe('createFeedback', () => {
    test('should create feedback successfully', async () => {
      const resident = await createTestUser('resident');

      const req = {
        body: {
          category: 'service',
          subject: 'Great service',
          message: 'Very satisfied with the waste collection',
          rating: 5
        },
        user: resident.user
      };

      const res = mockResponse();
      await createFeedback(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.category).toBe('service');
      expect(res.data.data.subject).toBe('Great service');
      expect(res.data.data.rating).toBe(5);
    });

    test('should validate required fields', async () => {
      const resident = await createTestUser('resident');

      const req = {
        body: {},
        user: resident.user
      };

      const res = mockResponse();
      await createFeedback(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
    });
  });

  describe('updateFeedback', () => {
    test('should update feedback successfully', async () => {
      const resident = await createTestUser('resident');

      const feedback = await Feedback.create({
        user: resident.user._id,
        category: 'service',
        subject: 'Original subject',
        message: 'Original message',
        rating: 3
      });

      const req = {
        params: { id: feedback._id.toString() },
        body: {
          subject: 'Updated subject',
          message: 'Updated message',
          rating: 5
        },
        user: resident.user
      };

      const res = mockResponse();
      await updateFeedback(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.subject).toBe('Updated subject');
      expect(res.data.data.rating).toBe(5);
    });

    test('should handle non-existent feedback', async () => {
      const resident = await createTestUser('resident');
      const fakeId = '507f1f77bcf86cd799439011';

      const req = {
        params: { id: fakeId },
        body: { subject: 'Updated' },
        user: resident.user
      };

      const res = mockResponse();
      await updateFeedback(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.data.success).toBe(false);
    });
  });
});
