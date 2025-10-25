import { jest } from '@jest/globals';

// Mock models
const mockPickupRequestModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
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

const mockSmartBinModel = {
  findById: jest.fn()
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

jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
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
        description: 'Paper waste',
        quantity: '50kg',
        preferredDate: '2024-12-01',
        timeSlot: 'morning',
        pickupLocation: { address: '123 Main St' },
        contactPerson: { name: 'John' }
      };

      mockPickupRequestModel.findOne.mockResolvedValue(null);
      
      const pickup = {
        _id: 'pickup123',
        requestedBy: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '1234567890'
        },
        wasteType: 'recyclable',
        preferredDate: '2024-12-01',
        timeSlot: 'morning',
        populate: jest.fn().mockResolvedValue({
          _id: 'pickup123',
          requestedBy: {
            firstName: 'John',
            lastName: 'Doe'
          }
        })
      };

      mockPickupRequestModel.create.mockResolvedValue(pickup);
      mockUserModel.find.mockResolvedValue([
        { _id: 'op1', role: 'operator' },
        { _id: 'op2', role: 'admin' }
      ]);
      mockNotificationModel.create.mockResolvedValue({});

      await createPickupRequest(mockReq, mockRes);

      expect(mockPickupRequestModel.findOne).toHaveBeenCalled();
      expect(mockPickupRequestModel.create).toHaveBeenCalled();
      expect(mockNotificationModel.create).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 400 if pickup already scheduled for date', async () => {
      mockReq.body = {
        wasteType: 'recyclable',
        preferredDate: '2024-12-01',
        timeSlot: 'morning'
      };

      const existingPickup = {
        _id: 'existing123',
        preferredDate: '2024-12-01',
        status: 'pending',
        timeSlot: 'morning'
      };

      mockPickupRequestModel.findOne.mockResolvedValue(existingPickup);

      await createPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already scheduled')
        })
      );
    });

    test('should handle errors gracefully', async () => {
      mockReq.body = {
        wasteType: 'recyclable',
        preferredDate: '2024-12-01'
      };

      mockPickupRequestModel.findOne.mockRejectedValue(new Error('DB Error'));

      await createPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPickupRequests', () => {
    test('should get all pickups for admin', async () => {
      mockReq.user.role = 'admin';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { _id: 'p1' },
                { _id: 'p2' }
              ])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(2);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter pickups for residents', async () => {
      mockReq.user.role = 'resident';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ requestedBy: 'user123' })
      );
    });

    test('should filter by status', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.status = 'pending';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('should filter by waste type', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.wasteType = 'recyclable';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ wasteType: 'recyclable' })
      );
    });

    test('should filter by collector', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.assignedTo = 'collector123';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: 'collector123' })
      );
    });

    test('should filter by priority', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.priority = 'high';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });

    test('should filter by date range', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-12-31';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      const filterArg = mockPickupRequestModel.find.mock.calls[0][0];
      expect(filterArg.preferredDate).toBeDefined();
      expect(filterArg.preferredDate.$gte).toBeDefined();
      expect(filterArg.preferredDate.$lte).toBeDefined();
    });

    test('should search by text', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.search = 'recyclable';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      const filterArg = mockPickupRequestModel.find.mock.calls[0][0];
      expect(filterArg.$or).toBeDefined();
    });

    test('should get pickups for collector role', async () => {
      mockReq.user.role = 'collector';
      mockReq.user._id = 'collector123';

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      mockPickupRequestModel.countDocuments.mockResolvedValue(0);

      await getPickupRequests(mockReq, mockRes);

      const filterArg = mockPickupRequestModel.find.mock.calls[0][0];
      expect(filterArg.$or).toBeDefined();
      expect(filterArg.$or.length).toBe(2);
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
    test('should get pickup by ID with proper populate chain', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.user.role = 'admin';

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'user123', firstName: 'John', lastName: 'Doe' }
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(pickup)
          })
        })
      });

      await getPickupRequest(mockReq, mockRes);

      expect(mockPickupRequestModel.findById).toHaveBeenCalledWith('pickup123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should get pickup by ID', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.user.role = 'admin';

      const pickup = {
        _id: 'pickup123',
        requestedBy: 'user123'
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
        requestedBy: { _id: 'different-user' }
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
    test('should update pickup successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { notes: 'Updated notes' };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'user123' },
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await updatePickupRequest(mockReq, mockRes);

      expect(pickup.notes).toBe('Updated notes');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should prevent resident from updating non-pending request', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { notes: 'Test' };
      mockReq.user.role = 'resident';

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'user123' },
        status: 'in-progress'
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Can only update pending requests'
        })
      );
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { notes: 'Test' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if pickup already completed', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { notes: 'Test' };

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
      mockReq.body = { notes: 'Test' };

      mockPickupRequestModel.findById.mockRejectedValue(new Error('DB Error'));

      await updatePickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePickupStatus', () => {
    test('should update status to approved', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'approved' };
      mockReq.user.role = 'operator';

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' },
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);
      mockNotificationModel.create.mockResolvedValue({});

      await updatePickupStatus(mockReq, mockRes);

      expect(pickup.status).toBe('approved');
      expect(pickup.statusHistory.length).toBe(1);
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should set completed date when status is completed', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'completed', notes: 'All done' };
      mockReq.user.role = 'collector';

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' },
        status: 'in-progress',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);
      mockNotificationModel.create.mockResolvedValue({});

      await updatePickupStatus(mockReq, mockRes);

      expect(pickup.status).toBe('completed');
      expect(pickup.completedDate).toBeDefined();
      expect(pickup.statusHistory[0].notes).toBe('All done');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should update status to rejected with reason', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'rejected', rejectionReason: 'Out of service area' };
      mockReq.user.role = 'operator';

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' },
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);
      mockNotificationModel.create.mockResolvedValue({});

      await updatePickupStatus(mockReq, mockRes);

      expect(pickup.status).toBe('rejected');
      expect(pickup.rejectionReason).toBe('Out of service area');
      expect(mockNotificationModel.create).toHaveBeenCalled();
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'approved' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await updatePickupStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { status: 'approved' };

      mockPickupRequestModel.findById.mockRejectedValue(new Error('DB Error'));

      await updatePickupStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('assignCollector', () => {
    test('should assign collector successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'collector123', scheduledDate: '2024-12-15' };

      const collector = {
        _id: 'collector123',
        firstName: 'Jane',
        lastName: 'Collector',
        role: 'collector'
      };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { 
          _id: 'resident123',
          firstName: 'John',
          lastName: 'Resident'
        },
        wasteType: 'recyclable',
        pickupLocation: { address: '123 Main St' },
        status: 'approved',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockUserModel.findById.mockResolvedValue(collector);
      mockNotificationModel.create.mockResolvedValue({});

      await assignCollector(mockReq, mockRes);

      expect(pickup.assignedCollector).toBe('collector123');
      expect(pickup.status).toBe('scheduled');
      expect(pickup.scheduledDate).toBe('2024-12-15');
      expect(pickup.statusHistory.length).toBe(1);
      expect(mockNotificationModel.create).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if pickup has no associated resident', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'collector123' };

      const pickup = {
        _id: 'pickup123',
        requestedBy: null
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Pickup request has no associated resident'
        })
      );
    });

    test('should return 404 if collector not found', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'nonexistent' };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' }
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockUserModel.findById.mockResolvedValue(null);

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Collector not found'
        })
      );
    });

    test('should return 400 if user is not a collector', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'user123' };

      const user = {
        _id: 'user123',
        role: 'resident'
      };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' }
      };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(pickup)
      });
      mockUserModel.findById.mockResolvedValue(user);

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Selected user is not a collector'
        })
      );
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { collectorId: 'collector123' };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { collectorId: 'collector123' };

      mockPickupRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB Error'))
      });

      await assignCollector(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancelPickupRequest', () => {
    test('should cancel pickup successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Changed plans' };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'user123' },
        assignedCollector: { _id: 'collector123' },
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);
      mockNotificationModel.create.mockResolvedValue({});

      await cancelPickupRequest(mockReq, mockRes);

      expect(pickup.status).toBe('cancelled');
      expect(pickup.cancellationReason).toBe('Changed plans');
      expect(pickup.statusHistory.length).toBe(1);
      expect(pickup.statusHistory[0].notes).toBe('Changed plans');
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should prevent cancelling completed pickup', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Test' };

      const pickup = {
        _id: 'pickup123',
        status: 'completed'
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await cancelPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot cancel this pickup request'
        })
      );
    });

    test('should cancel without notifying collector if not assigned', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Test' };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'user123' },
        assignedCollector: null,
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await cancelPickupRequest(mockReq, mockRes);

      expect(pickup.status).toBe('cancelled');
      expect(mockNotificationModel.create).not.toHaveBeenCalled();
    });

    test('should return 404 if pickup not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { reason: 'Test' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await cancelPickupRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if already cancelled', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { reason: 'Test' };

      const pickup = {
        _id: 'pickup123',
        status: 'cancelled'
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

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPickupStats', () => {
    test('should get pickup statistics', async () => {
      mockPickupRequestModel.countDocuments.mockResolvedValue(100);
      mockPickupRequestModel.aggregate.mockResolvedValue([
        { _id: 'recyclable', count: 50 },
        { _id: 'organic', count: 30 }
      ]);

      await getPickupStats(mockReq, mockRes);

      expect(mockPickupRequestModel.countDocuments).toHaveBeenCalled();
      expect(mockPickupRequestModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockPickupRequestModel.countDocuments.mockRejectedValue(new Error('DB Error'));

      await getPickupStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('completePickup', () => {
    test('should complete pickup successfully', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = {
        actualPickupDate: '2024-12-01',
        collectedQuantity: '45kg',
        notes: 'Completed successfully'
      };

      const pickup = {
        _id: 'pickup123',
        requestedBy: { _id: 'resident123' },
        assignedTo: { _id: 'collector123' },
        wasteType: 'recyclable',
        status: 'in-progress',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pickup123' })
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);
      mockCollectionRecordModel.create.mockResolvedValue({ _id: 'record123' });
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
      mockReq.body = { actualPickupDate: '2024-12-01' };

      mockPickupRequestModel.findById.mockResolvedValue(null);

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if not in valid status', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { actualPickupDate: '2024-12-01' };

      const pickup = {
        _id: 'pickup123',
        status: 'pending'
      };

      mockPickupRequestModel.findById.mockResolvedValue(pickup);

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pickup123';
      mockReq.body = { actualPickupDate: '2024-12-01' };

      mockPickupRequestModel.findById.mockRejectedValue(new Error('DB Error'));

      await completePickup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
