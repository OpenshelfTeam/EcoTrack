import { jest } from '@jest/globals';

// Mock models
const mockBinRequestModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
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

// Setup mocks
jest.unstable_mockModule('../../models/BinRequest.model.js', () => ({
  default: mockBinRequestModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const {
  createBinRequest,
  approveAndAssignRequest,
  getRequests,
  cancelBinRequest,
  confirmBinReceipt
} = await import('../../controllers/binRequest.controller.js');

describe('BinRequest Controller Tests', () => {
  let mockReq, mockRes;

  const mockBinRequest = {
    _id: 'req123',
    requester: 'user123',
    binType: 'recyclable',
    quantity: 2,
    location: {
      address: '123 Test St',
      coordinates: { lat: 6.9271, lng: 79.8612 }
    },
    status: 'pending'
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

  describe('createBinRequest', () => {
    test('should create bin request successfully', async () => {
      mockReq.body = {
        requestedBinType: 'recyclable',
        preferredDeliveryDate: '2024-02-01',
        address: '123 Test St',
        city: 'Colombo',
        coordinates: { lat: 6.9271, lng: 79.8612 }
      };

      mockUserModel.findById.mockResolvedValue({ _id: 'user123', name: 'Test User' });
      mockBinRequestModel.create.mockResolvedValue(mockBinRequest);
      mockUserModel.find.mockResolvedValue([{ _id: 'op123' }]);
      mockNotificationModel.create.mockResolvedValue({});

      await createBinRequest(mockReq, mockRes);

      expect(mockBinRequestModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 404 for non-existent resident', async () => {
      mockReq.body = {
        requestedBinType: 'recyclable',
        preferredDeliveryDate: '2024-02-01'
      };

      mockUserModel.findById.mockResolvedValue(null);

      await createBinRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getRequests', () => {
    test('should get bin requests', async () => {
      mockBinRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockBinRequest])
            })
          })
        })
      });
      mockBinRequestModel.countDocuments.mockResolvedValue(1);

      await getRequests(mockReq, mockRes);

      expect(mockBinRequestModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('approveAndAssignRequest', () => {
    test('should approve and assign request', async () => {
      mockReq.params.id = 'req123';
      mockReq.body = { deliveryAgent: 'agent123' };

      const binRequest = {
        ...mockBinRequest,
        resident: { _id: 'user123' },
        save: jest.fn().mockResolvedValue(true)
      };

      mockBinRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(binRequest)
      });
      mockUserModel.findById.mockResolvedValue({ _id: 'agent123', role: 'collector' });
      mockNotificationModel.create.mockResolvedValue({});

      await approveAndAssignRequest(mockReq, mockRes);

      expect(binRequest.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent request', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { deliveryAgent: 'agent123' };
      mockBinRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await approveAndAssignRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('cancelBinRequest', () => {
    test('should cancel bin request', async () => {
      mockReq.params.id = 'req123';

      const binRequest = {
        ...mockBinRequest,
        resident: { _id: 'user123' },
        save: jest.fn().mockResolvedValue(true)
      };

      mockBinRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(binRequest)
      });
      mockNotificationModel.create.mockResolvedValue({});

      await cancelBinRequest(mockReq, mockRes);

      expect(binRequest.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('confirmBinReceipt', () => {
    test('should confirm bin receipt', async () => {
      mockReq.params.id = 'req123';

      const binRequest = {
        ...mockBinRequest,
        save: jest.fn().mockResolvedValue(true)
      };

      mockBinRequestModel.findById.mockResolvedValue(binRequest);
      mockNotificationModel.create.mockResolvedValue({});

      await confirmBinReceipt(mockReq, mockRes);

      expect(binRequest.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
