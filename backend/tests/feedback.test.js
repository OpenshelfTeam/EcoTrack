import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import Feedback from '../models/Feedback.model.js';
import feedbackRoutes from '../routes/feedback.routes.js';
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
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

// Setup and teardown
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

// Helper functions
const mockReqRes = () => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: {}
  };
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

const createTestFeedback = async (user, category = 'collection-service', rating = 5) => {
  return await Feedback.create({
    user: user._id,
    category,
    subject: `Test Feedback - ${category}`,
    message: 'This is a test feedback message',
    rating,
    status: 'submitted'
  });
};

describe('Feedback Controller Tests', () => {

  describe('createFeedback - Positive Cases', () => {
    it('should create feedback successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        category: 'collection-service',
        subject: 'Great service',
        message: 'The waste collection service is excellent!',
        rating: 5
      };

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            subject: 'Great service',
            rating: 5
          })
        })
      );
    });

    it('should create feedback with all categories', async () => {
      const categories = ['collection-service', 'bin-quality', 'collector-behavior', 'payment-system', 'app-experience'];
      
      for (const category of categories) {
        const { req, res } = mockReqRes();
        const user = await createTestUser('resident');

        req.user = { _id: user._id };
        req.body = {
          category,
          subject: `Feedback about ${category}`,
          message: 'Test message',
          rating: 4
        };

        await createFeedback(req, res);

        const feedback = await Feedback.findOne({ category });
        expect(feedback).toBeTruthy();
        expect(feedback.category).toBe(category);
      }
    });

    it('should create feedback with all rating values', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const { req, res } = mockReqRes();
        const user = await createTestUser('resident');

        req.user = { _id: user._id };
        req.body = {
          category: 'collection-service',
          subject: `Rating ${rating} feedback`,
          message: 'Test message',
          rating
        };

        await createFeedback(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('createFeedback - Negative & Edge Cases', () => {
    it('should require all mandatory fields', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        category: 'collection-service'
        // missing subject, message, rating
      };

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllFeedback - Filtering & Pagination', () => {
    it('should get all feedback for admin', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const admin = await createTestUser('admin');
      await createTestFeedback(user1);
      await createTestFeedback(user2);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getAllFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should get only own feedback for resident', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      await createTestFeedback(user1);
      await createTestFeedback(user2);

      req.user = { _id: user1._id, role: 'resident' };
      req.query = {};

      await getAllFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should filter feedback by category', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      await createTestFeedback(user, 'service');
      await createTestFeedback(user, 'billing');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { category: 'collection-service' };

      await getAllFeedback(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].category).toBe('service');
    });

    it('should filter feedback by rating', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      await createTestFeedback(user, 'general', 5);
      await createTestFeedback(user, 'general', 3);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { rating: '5' };

      await getAllFeedback(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].rating).toBe(5);
    });

    it('should filter feedback by status', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      const feedback1 = await createTestFeedback(user);
      const feedback2 = await createTestFeedback(user);
      feedback2.status = 'resolved';
      await feedback2.save();

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { status: 'submitted' };

      await getAllFeedback(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].status).toBe('pending');
    });

    it('should search feedback by subject or message', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      await Feedback.create({
        user: user._id,
        category: 'collection-service',
        subject: 'Excellent service quality',
        message: 'Very satisfied',
        rating: 5,
        status: 'submitted'
      });
      await createTestFeedback(user);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { search: 'Excellent' };

      await getAllFeedback(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      
      // Create 15 feedback items
      for (let i = 0; i < 15; i++) {
        await createTestFeedback(user);
      }

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { page: '1', limit: '10' };

      await getAllFeedback(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(10);
      expect(response.total).toBe(15);
      expect(response.pages).toBe(2);
    });
  });

  describe('getFeedback - Single Retrieval', () => {
    it('should get single feedback successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const feedback = await createTestFeedback(user);

      req.params = { id: feedback._id.toString() };
      req.user = { _id: user._id };

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            subject: feedback.subject
          })
        })
      );
    });

    it('should return 404 for non-existent feedback', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id };

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateFeedback', () => {
    it('should update feedback successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const feedback = await createTestFeedback(user);

      req.params = { id: feedback._id.toString() };
      req.user = { _id: user._id };
      req.body = {
        subject: 'Updated subject',
        rating: 4
      };

      await updateFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedFeedback = await Feedback.findById(feedback._id);
      expect(updatedFeedback.subject).toBe('Updated subject');
      expect(updatedFeedback.rating).toBe(4);
    });

    it('should return 404 when updating non-existent feedback', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id };
      req.body = { subject: 'Updated' };

      await updateFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteFeedback', () => {
    it('should delete feedback successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const feedback = await createTestFeedback(user);

      req.params = { id: feedback._id.toString() };
      req.user = { _id: user._id };

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const deletedFeedback = await Feedback.findById(feedback._id);
      expect(deletedFeedback).toBeNull();
    });

    it('should return 404 when deleting non-existent feedback', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id };

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('respondToFeedback', () => {
    it('should respond to feedback successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      const feedback = await createTestFeedback(user);

      req.params = { id: feedback._id.toString() };
      req.user = { _id: admin._id };
      req.body = {
        responseMessage: 'Thank you for your feedback. We will look into this.',
        status: 'in-progress'
      };

      await respondToFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const respondedFeedback = await Feedback.findById(feedback._id);
      expect(respondedFeedback.response.message).toBeDefined();
      expect(respondedFeedback.status).toBe('in-progress');
    });

    it('should return 404 for non-existent feedback', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: admin._id };
      req.body = {
        responseMessage: 'Response',
        status: 'resolved'
      };

      await respondToFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getFeedbackStats', () => {
    it('should return feedback statistics', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      
      await createTestFeedback(user, 'service', 5);
      await createTestFeedback(user, 'billing', 4);
      await createTestFeedback(user, 'service', 3);

      req.user = { _id: admin._id, role: 'admin' };

      await getFeedbackStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: expect.any(Number),
            averageRating: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Feedback Model Tests', () => {
    it('should create feedback with required fields', async () => {
      const user = await createTestUser('resident');
      const feedback = await Feedback.create({
        user: user._id,
        category: 'collection-service',
        subject: 'Test Feedback',
        message: 'Test message',
        rating: 5,
        status: 'submitted'
      });

      expect(feedback.category).toBe('service');
      expect(feedback.rating).toBe(5);
      expect(feedback.status).toBe('pending');
    });

    it('should have default status as pending', async () => {
      const user = await createTestUser('resident');
      const feedback = await createTestFeedback(user);
      expect(feedback.status).toBe('pending');
    });

    it('should validate rating between 1-5', async () => {
      const user = await createTestUser('resident');
      
      await expect(
        Feedback.create({
          user: user._id,
          category: 'collection-service',
          subject: 'Test',
          message: 'Test',
          rating: 6
        })
      ).rejects.toThrow();
    });

    it('should store response details', async () => {
      const user = await createTestUser('resident');
      const admin = await createTestUser('admin');
      const feedback = await Feedback.create({
        user: user._id,
        category: 'collection-service',
        subject: 'Test',
        message: 'Test message',
        rating: 5,
        response: {
          message: 'Thank you for your feedback',
          respondedBy: admin._id,
          respondedAt: new Date()
        }
      });

      expect(feedback.response.message).toBe('Thank you for your feedback');
      expect(feedback.response.respondedBy).toEqual(admin._id);
    });
  });
});
