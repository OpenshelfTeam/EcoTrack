import { jest } from '@jest/globals';

// Mock models
const mockDeliveryModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn()
};

const mockSmartBinModel = {
  findById: jest.fn(),
  create: jest.fn()
};

const mockUserModel = {
  findById: jest.fn()
};

const mockBinRequestModel = {
  findOne: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Delivery.model.js', () => ({
  default: mockDeliveryModel
}));

jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/BinRequest.model.js', () => ({
  default: mockBinRequestModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const {
  createDelivery,
  updateDeliveryStatus,
  confirmReceipt,
  getDeliveries
} = await import('../../controllers/delivery.controller.js');

describe('Delivery Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'collector' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createDelivery', () => {
    test('should create delivery successfully', async () => {
      mockReq.body = {
        binId: 'bin123',
        residentId: 'resident123',
        scheduledDate: '2024-02-01'
      };

      const bin = {
        _id: 'bin123',
        status: 'available',
        save: jest.fn().mockResolvedValue(true)
      };

      const resident = {
        _id: 'resident123',
        name: 'Test Resident'
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.findById.mockResolvedValue(resident);
      mockDeliveryModel.create.mockResolvedValue({
        _id: 'del123',
        bin: 'bin123',
        resident: 'resident123',
        scheduledDate: '2024-02-01'
      });

      await createDelivery(mockReq, mockRes);

      expect(mockDeliveryModel.create).toHaveBeenCalled();
      expect(bin.status).toBe('in-transit');
      expect(bin.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 404 if bin not found', async () => {
      mockReq.body = {
        binId: 'nonexistent',
        residentId: 'resident123'
      };

      mockSmartBinModel.findById.mockResolvedValue(null);

      await createDelivery(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Bin not found' })
      );
    });

    test('should return 404 if resident not found', async () => {
      mockReq.body = {
        binId: 'bin123',
        residentId: 'nonexistent'
      };

      const bin = { _id: 'bin123' };
      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.findById.mockResolvedValue(null);

      await createDelivery(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Resident not found' })
      );
    });

    test('should use default scheduledDate if not provided', async () => {
      mockReq.body = {
        binId: 'bin123',
        residentId: 'resident123'
      };

      const bin = {
        _id: 'bin123',
        save: jest.fn().mockResolvedValue(true)
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.findById.mockResolvedValue({ _id: 'resident123' });
      mockDeliveryModel.create.mockResolvedValue({ _id: 'del123' });

      await createDelivery(mockReq, mockRes);

      expect(mockDeliveryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledDate: expect.any(Date)
        })
      );
    });

    test('should handle database errors', async () => {
      mockReq.body = {
        binId: 'bin123',
        residentId: 'resident123'
      };

      mockSmartBinModel.findById.mockRejectedValue(new Error('DB Error'));

      await createDelivery(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateDeliveryStatus', () => {
    test('should update delivery status to pending', async () => {
      mockReq.params.id = 'del123';
      mockReq.body = { status: 'pending', note: 'Test note' };

      const delivery = {
        _id: 'del123',
        resident: { _id: 'resident123' },
        status: 'scheduled',
        attempts: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });

      await updateDeliveryStatus(mockReq, mockRes);

      expect(delivery.status).toBe('pending');
      expect(delivery.attempts.length).toBe(1);
      expect(delivery.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should create bin when status is delivered', async () => {
      mockReq.params.id = 'del123';
      mockReq.body = { status: 'delivered' };

      const delivery = {
        _id: 'del123',
        resident: { _id: 'resident123' },
        status: 'pending',
        attempts: [],
        scheduledDate: new Date('2024-01-01'),
        save: jest.fn().mockResolvedValue(true)
      };

      const binRequest = {
        _id: 'req123',
        resident: 'resident123',
        requestedBinType: 'recyclable',
        coordinates: { lat: 6.9271, lng: 79.8612 },
        address: '123 Test St',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });
      mockBinRequestModel.findOne.mockResolvedValue(binRequest);
      mockSmartBinModel.create.mockResolvedValue({
        _id: 'bin123',
        binType: 'recyclable'
      });
      mockNotificationModel.create.mockResolvedValue({});

      await updateDeliveryStatus(mockReq, mockRes);

      expect(delivery.status).toBe('delivered');
      expect(delivery.confirmedAt).toBeDefined();
      expect(mockSmartBinModel.create).toHaveBeenCalled();
      expect(binRequest.status).toBe('delivered');
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle delivered status without binRequest', async () => {
      mockReq.params.id = 'del123';
      mockReq.body = { status: 'delivered' };

      const delivery = {
        _id: 'del123',
        resident: { _id: 'resident123' },
        status: 'pending',
        attempts: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });
      mockBinRequestModel.findOne.mockResolvedValue(null);

      await updateDeliveryStatus(mockReq, mockRes);

      expect(delivery.status).toBe('delivered');
      expect(mockSmartBinModel.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should use default coordinates if invalid', async () => {
      mockReq.params.id = 'del123';
      mockReq.body = { status: 'delivered' };

      const delivery = {
        _id: 'del123',
        resident: { _id: 'resident123' },
        status: 'pending',
        attempts: [],
        scheduledDate: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      const binRequest = {
        _id: 'req123',
        resident: 'resident123',
        requestedBinType: 'general',
        coordinates: { lat: 'invalid', lng: 'invalid' },
        address: '123 Test St',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });
      mockBinRequestModel.findOne.mockResolvedValue(binRequest);
      mockSmartBinModel.create.mockResolvedValue({ _id: 'bin123' });
      mockNotificationModel.create.mockResolvedValue({});

      await updateDeliveryStatus(mockReq, mockRes);

      const createCall = mockSmartBinModel.create.mock.calls[0][0];
      expect(createCall.location.coordinates).toEqual([0, 0]);
    });

    test('should return 404 if delivery not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'delivered' };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await updateDeliveryStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'del123';
      mockReq.body = { status: 'delivered' };

      mockDeliveryModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await updateDeliveryStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('confirmReceipt', () => {
    test('should confirm receipt successfully with bin', async () => {
      mockReq.params.id = 'del123';

      const bin = {
        _id: 'bin123',
        status: 'in-transit',
        save: jest.fn().mockResolvedValue(true)
      };

      const delivery = {
        _id: 'del123',
        bin: 'bin123',
        resident: { _id: 'resident123' },
        status: 'in-transit',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });
      mockSmartBinModel.findById.mockResolvedValue(bin);

      await confirmReceipt(mockReq, mockRes);

      expect(delivery.status).toBe('delivered');
      expect(delivery.confirmedAt).toBeDefined();
      expect(bin.status).toBe('active');
      expect(bin.activationDate).toBeDefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should confirm receipt without bin', async () => {
      mockReq.params.id = 'del123';

      const delivery = {
        _id: 'del123',
        bin: null,
        resident: { _id: 'resident123' },
        status: 'in-transit',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });

      await confirmReceipt(mockReq, mockRes);

      expect(delivery.status).toBe('delivered');
      expect(mockSmartBinModel.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle bin not found gracefully', async () => {
      mockReq.params.id = 'del123';

      const delivery = {
        _id: 'del123',
        bin: 'bin123',
        resident: { _id: 'resident123' },
        status: 'in-transit',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(delivery)
      });
      mockSmartBinModel.findById.mockResolvedValue(null);

      await confirmReceipt(mockReq, mockRes);

      expect(delivery.status).toBe('delivered');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if delivery not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockDeliveryModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await confirmReceipt(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'del123';

      mockDeliveryModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await confirmReceipt(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDeliveries', () => {
    test('should get all deliveries for admin', async () => {
      mockReq.user.role = 'admin';

      mockDeliveryModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'del1' },
            { _id: 'del2' }
          ])
        })
      });

      await getDeliveries(mockReq, mockRes);

      expect(mockDeliveryModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter deliveries for residents', async () => {
      mockReq.user.role = 'resident';

      mockDeliveryModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'del1', resident: 'user123' }
          ])
        })
      });

      await getDeliveries(mockReq, mockRes);

      expect(mockDeliveryModel.find).toHaveBeenCalledWith({ resident: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle empty results', async () => {
      mockReq.user.role = 'admin';

      mockDeliveryModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getDeliveries(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 0, data: [] })
      );
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';

      mockDeliveryModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getDeliveries(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
