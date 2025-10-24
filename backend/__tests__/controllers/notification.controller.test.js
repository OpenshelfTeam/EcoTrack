import { jest } from '@jest/globals';

// Mock models
const mockNotificationModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn()
};

const mockUserModel = {
  find: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Import functions
const { 
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = await import('../../controllers/notification.controller.js');

describe('Notification Controller Tests', () => {
  let mockReq, mockRes;

  const mockNotification = {
    _id: 'notif123',
    recipient: 'user123',
    type: 'pickup-scheduled',
    title: 'Pickup Scheduled',
    message: 'Your pickup has been scheduled',
    priority: 'high',
    readAt: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'resident' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getNotifications', () => {
    test('should get user notifications', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNotification])
          })
        })
      });
      mockNotificationModel.countDocuments
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await getNotifications(mockReq, mockRes);

      expect(mockNotificationModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by unread only', async () => {
      mockReq.query = { unreadOnly: 'true' };
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNotification])
          })
        })
      });
      mockNotificationModel.countDocuments
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await getNotifications(mockReq, mockRes);

      const filterArg = mockNotificationModel.find.mock.calls[0][0];
      expect(filterArg.readAt).toEqual({ $exists: false });
    });
  });

  describe('getNotification', () => {
    test('should get notification by ID', async () => {
      mockReq.params.id = 'notif123';
      mockNotificationModel.findById.mockResolvedValue(mockNotification);

      await getNotification(mockReq, mockRes);

      expect(mockNotificationModel.findById).toHaveBeenCalledWith('notif123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent notification', async () => {
      mockReq.params.id = 'nonexistent';
      mockNotificationModel.findById.mockResolvedValue(null);

      await getNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createNotification', () => {
    test('should create notification successfully', async () => {
      mockReq.body = {
        recipient: 'user123',
        type: 'system',
        title: 'Test Notification',
        message: 'Test message'
      };

      mockNotificationModel.create.mockResolvedValue(mockNotification);

      await createNotification(mockReq, mockRes);

      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      mockReq.params.id = 'notif123';

      const notification = {
        ...mockNotification,
        readAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockNotificationModel.findById.mockResolvedValue(notification);

      await markAsRead(mockReq, mockRes);

      expect(notification.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

      await markAllAsRead(mockReq, mockRes);

      expect(mockNotificationModel.updateMany).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteNotification', () => {
    test('should delete notification successfully', async () => {
      mockReq.params.id = 'notif123';
      const notification = {
        ...mockNotification,
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      mockNotificationModel.findById.mockResolvedValue(notification);

      await deleteNotification(mockReq, mockRes);

      expect(notification.deleteOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
