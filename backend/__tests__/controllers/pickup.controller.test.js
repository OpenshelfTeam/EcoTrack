import { jest } from '@jest/globals';

// Mock models
const mockPickupRequestModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  findById: jest.fn(),
  find: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

const mockCollectionRecordModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/PickupRequest.model.js', () => ({
  default: mockPickupRequestModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

jest.unstable_mockModule('../../models/CollectionRecord.model.js', () => ({
  default: mockCollectionRecordModel
}));

// Import functions
const {
  createPickupRequest,
  getPickupRequests,
  getPickupRequest,
  updatePickupRequest,
  updatePickupStatus,
  assignCollector,
  cancelPickupRequest,
  getPickupStats,
  completePickup
} = await import('../../controllers/pickup.controller.js');

describe('Pickup Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

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

  describe('createPickupRequest', () => {
    test('should create pickup request successfully', async () => {
      mockReq.body = {
        wasteType: 'recyclable',
        pickupDate: '2024-02-01',
        description: 'Test pickup'
      };

      const pickup = {
        _id: 'pickup123',
        wasteType: 'recyclable',
        populate: jest.fn().mockResolvedValue({
          _id: 'pickup123',
          wasteType: 'recyclable'
        })
      };

      mockPickupRequestModel.create.mockResolvedValue(pickup);

      await createPickupRequest(mockReq, mockRes);

      expect(mockPickupRequestModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resident: 'user123',
          wasteType: 'recyclable'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle database errors', async () => {
      mockReq.body = { wasteType: 'recyclable' };

      mockPickupRequestModel.create.mockRejectedValue(new Error('DB Error'));

      await createPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPickupRequests', () => {
    test('should get all pickup requests for admin', async () => {
      mockReq.user.role = 'admin';
      mockReq.query = { page: '1', limit: '10' };

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: 'pickup1' },
          { _id: 'pickup2' }
        ])
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(2);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter pickups for residents', async () => {
      mockReq.user.role = 'resident';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ resident: 'user123' })
      );
    });

    test('should filter by status', async () => {
      mockReq.user.role = 'admin';
      mockReq.query = { status: 'pending' };

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('should filter by wasteType', async () => {
      mockReq.user.role = 'admin';
      mockReq.query = { wasteType: 'recyclable' };

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ wasteType: 'recyclable' })
      );
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';

      mockPickupRequestModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getPickupRequests(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPickupRequest', () => {
    test('should get pickup request by ID', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.user.role = 'admin';

      const pickup = {
        _id: 'pickup123',
        wasteType: 'recyclable',
        resident: { _id: 'user123' }
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });

      await getPickupRequest(mockReq, mockRes);

      expect(mockPickupRequestModel.findById).toHaveBeenCalledWith('pickup123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized resident', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.user.role = 'resident';

      const pickup = {
        _id: 'pickup123',
        resident: { _id: 'different-user' }
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });

      await getPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';

      mockPickupRequestModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePickupRequest', () => {
    test('should update pickup request successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { description: 'Updated description' };

      const pickup = {
        _id: 'pickup123',
        resident: 'user123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await updatePickupRequest(mockReq, mockRes);

      expect(pickup.description).toBe('Updated description');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { description: 'Test' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if pickup already completed', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { description: 'Test' };

      const pickup = {
        _id: 'pickup123',
        status: 'completed'
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { description: 'Test' };

      mockPickupRequestModel.findById.mockRejectedValue(new Error('DB Error'));

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePickupStatus', () => {
    test('should update pickup status successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'collected' };

      const pickup = {
        _id: 'pickup123',
        resident: { _id: 'resident123' },
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockNotificationModel.create.mockResolvedValue({});

      await updatePickupStatus(mockReq, mockRes);

      expect(pickup.status).toBe('collected');
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'collected' };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await updatePickupStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'collected' };

      mockPickupRequestModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await updatePickupStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('assignCollector', () => {
    test('should assign collector successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'collector123' };

      const collector = {
        _id: 'collector123',
        role: 'collector'
      };

      const pickup = {
        _id: 'pickup123',
        resident: { _id: 'resident123' },
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockUserModel.findById.mockResolvedValue(collector);
      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockNotificationModel.create.mockResolvedValue({});

      await assignCollector(mockReq, mockRes);

      expect(pickup.assignedCollector).toBe('collector123');
      expect(pickup.status).toBe('assigned');
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if collector not found', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'nonexistent' };

      mockUserModel.findById.mockResolvedValue(null);

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if user is not collector', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'user123' };

      const user = {
        _id: 'user123',
        role: 'resident'
      };

      mockUserModel.findById.mockResolvedValue(user);

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { collectorId: 'collector123' };

      mockUserModel.findById.mockResolvedValue({ role: 'collector' });
      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'collector123' };

      mockUserModel.findById.mockRejectedValue(new Error('DB Error'));

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancelPickupRequest', () => {
    test('should cancel pickup request successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Changed plans' };

      const pickup = {
        _id: 'pickup123',
        resident: 'user123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await cancelPickupRequest(mockReq, mockRes);

      expect(pickup.status).toBe('cancelled');
      expect(pickup.cancellationReason).toBe('Changed plans');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { reason: 'Test' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await cancelPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if pickup already completed', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Test' };

      const pickup = {
        _id: 'pickup123',
        status: 'completed'
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await cancelPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Test' };

      mockPickupRequestModel.findById.mockRejectedValue(new Error('DB Error'));

      await cancelPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPickupStats', () => {
    test('should return pickup statistics', async () => {
      mockPickupRequestModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalPickups: 100,
          completedPickups: 80,
          pendingPickups: 20
        }
      ]);

      await getPickupStats(mockReq, mockRes);

      expect(mockPickupRequestModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockPickupRequestModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getPickupStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('completePickup', () => {
    test('should complete pickup successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = {
        weightCollected: 10,
        notes: 'Completed successfully'
      };

      const pickup = {
        _id: 'pickup123',
        resident: { _id: 'resident123' },
        wasteType: 'recyclable',
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockCollectionRecordModel.create.mockResolvedValue({});
      mockNotificationModel.create.mockResolvedValue({});

      await completePickup(mockReq, mockRes);

      expect(pickup.status).toBe('completed');
      expect(pickup.completedAt).toBeDefined();
      expect(mockCollectionRecordModel.create).toHaveBeenCalled();
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { weightCollected: 10 };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if pickup not in progress', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { weightCollected: 10 };

      const pickup = {
        _id: 'pickup123',
        status: 'pending'
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { weightCollected: 10 };

      mockPickupRequestModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
