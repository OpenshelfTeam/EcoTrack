import { jest } from '@jest/globals';

// Mock models
const mockSmartBinModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn()
};

const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

jest.unstable_mockModule('../../models/Payment.model.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Delivery.model.js', () => ({ default: {} }));

// Import functions
const { 
  getSmartBins, 
  getSmartBin, 
  createSmartBin, 
  updateSmartBin,
  deleteSmartBin,
  updateBinLevel,
  assignBin,
  emptyBin,
  getBinStats
} = await import('../../controllers/smartBin.controller.js');

describe('SmartBin Controller Tests', () => {
  let mockReq, mockRes;

  const mockBin = {
    _id: 'bin123',
    binNumber: 'BIN-001',
    binType: 'recyclable',
    capacity: 100,
    currentLevel: 45,
    status: 'active',
    location: {
      address: '123 Main St',
      coordinates: { latitude: 6.9271, longitude: 79.8612 }
    },
    assignedTo: null,
    createdBy: 'admin123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', _id: 'user123', role: 'admin' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createSmartBin', () => {
    test('should create bin successfully', async () => {
      mockReq.body = {
        binNumber: 'BIN-001',
        binType: 'recyclable',
        capacity: 100,
        location: { address: '123 Main St', coordinates: { latitude: 6.9271, longitude: 79.8612 } }
      };

      mockSmartBinModel.findOne.mockResolvedValue(null);
      mockSmartBinModel.create.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBin)
        })
      });

      await createSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should reject duplicate bin number', async () => {
      mockReq.body = { binNumber: 'BIN-001' };
      mockSmartBinModel.findOne.mockResolvedValue(mockBin);

      await createSmartBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle validation errors', async () => {
      mockReq.body = { binNumber: 'BIN-001' };
      mockSmartBinModel.findOne.mockResolvedValue(null);
      mockSmartBinModel.create.mockRejectedValue(new Error('Validation failed'));

      await createSmartBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSmartBins', () => {
    test('should get all bins', async () => {
      mockSmartBinModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([mockBin])
                })
              })
            })
          })
        })
      });
      mockSmartBinModel.countDocuments.mockResolvedValue(1);

      await getSmartBins(mockReq, mockRes);

      expect(mockSmartBinModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.query = { status: 'active' };
      mockSmartBinModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([mockBin])
                })
              })
            })
          })
        })
      });
      mockSmartBinModel.countDocuments.mockResolvedValue(1);

      await getSmartBins(mockReq, mockRes);

      const filterArg = mockSmartBinModel.find.mock.calls[0][0];
      expect(filterArg.status).toBe('active');
    });

    test('should filter by bin type', async () => {
      mockReq.query = { binType: 'organic' };
      mockSmartBinModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([mockBin])
                })
              })
            })
          })
        })
      });
      mockSmartBinModel.countDocuments.mockResolvedValue(1);

      await getSmartBins(mockReq, mockRes);

      const filterArg = mockSmartBinModel.find.mock.calls[0][0];
      expect(filterArg.binType).toBe('organic');
    });

    test('should filter by level range', async () => {
      mockReq.query = { minLevel: 50, maxLevel: 80 };
      mockSmartBinModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([mockBin])
                })
              })
            })
          })
        })
      });
      mockSmartBinModel.countDocuments.mockResolvedValue(1);

      await getSmartBins(mockReq, mockRes);

      const filterArg = mockSmartBinModel.find.mock.calls[0][0];
      expect(filterArg.currentLevel).toHaveProperty('$gte', 50);
      expect(filterArg.currentLevel).toHaveProperty('$lte', 80);
    });
  });

  describe('getSmartBin', () => {
    test('should get bin by ID', async () => {
      mockReq.params.id = 'bin123';
      mockSmartBinModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBin)
          })
        })
      });

      await getSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.findById).toHaveBeenCalledWith('bin123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent bin', async () => {
      mockReq.params.id = 'nonexistent';
      mockSmartBinModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await getSmartBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateSmartBin', () => {
    test('should update bin successfully', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { status: 'maintenance' };

      mockSmartBinModel.findById.mockResolvedValue(mockBin);
      mockSmartBinModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({ ...mockBin, status: 'maintenance' })
          })
        })
      });

      await updateSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent bin', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'maintenance' };

      mockSmartBinModel.findById.mockResolvedValue(null);

      await updateSmartBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSmartBin', () => {
    test('should delete bin successfully', async () => {
      mockReq.params.id = 'bin123';
      mockSmartBinModel.findById.mockResolvedValue(mockBin);
      mockSmartBinModel.findByIdAndDelete.mockResolvedValue(mockBin);

      await deleteSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.findByIdAndDelete).toHaveBeenCalledWith('bin123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent bin', async () => {
      mockReq.params.id = 'nonexistent';
      mockSmartBinModel.findById.mockResolvedValue(null);

      await deleteSmartBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateBinLevel', () => {
    test('should update bin level successfully', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { currentLevel: 75 };

      const bin = {
        ...mockBin,
        levelHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.find.mockResolvedValue([]);

      await updateBinLevel(mockReq, mockRes);

      expect(bin.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should reject level exceeding capacity', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { currentLevel: 150 };

      mockSmartBinModel.findById.mockResolvedValue(mockBin);

      await updateBinLevel(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should reject negative level', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { currentLevel: -10 };

      mockSmartBinModel.findById.mockResolvedValue(mockBin);

      await updateBinLevel(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('assignBin', () => {
    test('should assign bin to resident', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { residentId: 'resident123' };

      const bin = {
        ...mockBin,
        assignedTo: null,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      const resident = { _id: 'resident123', role: 'resident' };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.findById.mockResolvedValue(resident);
      mockNotificationModel.create.mockResolvedValue({});

      await assignBin(mockReq, mockRes);

      expect(bin.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('emptyBin', () => {
    test('should empty bin successfully', async () => {
      mockReq.params.id = 'bin123';

      const bin = {
        ...mockBin,
        currentLevel: 80,
        emptyingHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);

      await emptyBin(mockReq, mockRes);

      expect(bin.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getBinStats', () => {
    test('should calculate bin statistics', async () => {
      mockReq.user.role = 'admin';

      const bins = [mockBin, { ...mockBin, _id: 'bin456', status: 'full' }];
      mockSmartBinModel.find.mockResolvedValue(bins);

      await getBinStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
