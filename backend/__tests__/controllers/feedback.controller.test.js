import { jest } from '@jest/globals';

// Mock models
const mockFeedbackModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  find: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Feedback.model.js', () => ({
  default: mockFeedbackModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const { 
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback
} = await import('../../controllers/feedback.controller.js');

describe('Feedback Controller Tests', () => {
  let mockReq, mockRes;

  const mockFeedback = {
    _id: 'feedback123',
    user: 'user123',
    subject: 'Test Feedback',
    message: 'This is a test feedback message',
    category: 'service',
    status: 'pending',
    priority: 'medium',
    rating: 4
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', role: 'resident' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getFeedback', () => {
    test('should get all feedback', async () => {
      mockFeedbackModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockFeedback])
        })
      });

      await getFeedback(mockReq, mockRes);

      expect(mockFeedbackModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.query = { status: 'pending' };
      mockFeedbackModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockFeedback])
        })
      });

      await getFeedback(mockReq, mockRes);

      expect(mockFeedbackModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('should filter by category', async () => {
      mockReq.query = { category: 'service' };
      mockFeedbackModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockFeedback])
        })
      });

      await getFeedback(mockReq, mockRes);

      expect(mockFeedbackModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'service' })
      );
    });
  });

  describe('getFeedbackById', () => {
    test('should get feedback by ID', async () => {
      mockReq.params.id = 'feedback123';
      mockFeedbackModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFeedback)
      });

      await getFeedbackById(mockReq, mockRes);

      expect(mockFeedbackModel.findById).toHaveBeenCalledWith('feedback123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent feedback', async () => {
      mockReq.params.id = 'nonexistent';
      mockFeedbackModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getFeedbackById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createFeedback', () => {
    test('should create feedback successfully', async () => {
      mockReq.body = {
        subject: 'Test Feedback',
        message: 'Test message',
        category: 'service',
        rating: 4
      };

      mockFeedbackModel.create.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFeedback)
      });
      mockUserModel.find.mockResolvedValue([]);

      await createFeedback(mockReq, mockRes);

      expect(mockFeedbackModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should validate required fields', async () => {
      mockReq.body = {};

      const error = new Error('Validation failed');
      mockFeedbackModel.create.mockRejectedValue(error);

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateFeedback', () => {
    test('should update feedback status', async () => {
      mockReq.params.id = 'feedback123';
      mockReq.body = { status: 'resolved' };

      mockFeedbackModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockFeedback, status: 'resolved' })
      });

      await updateFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent feedback', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'resolved' };

      mockFeedbackModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await updateFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteFeedback', () => {
    test('should delete feedback successfully', async () => {
      mockReq.params.id = 'feedback123';
      mockFeedbackModel.findByIdAndDelete.mockResolvedValue(mockFeedback);

      await deleteFeedback(mockReq, mockRes);

      expect(mockFeedbackModel.findByIdAndDelete).toHaveBeenCalledWith('feedback123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent feedback', async () => {
      mockReq.params.id = 'nonexistent';
      mockFeedbackModel.findByIdAndDelete.mockResolvedValue(null);

      await deleteFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('respondToFeedback', () => {
    test('should add response to feedback', async () => {
      mockReq.params.id = 'feedback123';
      mockReq.body = { response: 'Thank you for your feedback' };

      const feedbackWithResponse = {
        ...mockFeedback,
        response: 'Thank you for your feedback',
        respondedAt: new Date(),
        respondedBy: 'user123',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockFeedbackModel.findById.mockResolvedValue(feedbackWithResponse);

      await respondToFeedback(mockReq, mockRes);

      expect(feedbackWithResponse.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent feedback', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { response: 'Test response' };

      mockFeedbackModel.findById.mockResolvedValue(null);

      await respondToFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
