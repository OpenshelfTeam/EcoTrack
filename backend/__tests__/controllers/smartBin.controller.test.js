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
  create: jest.fn(),
  insertMany: jest.fn()
};

const mockPaymentModel = {
  findOne: jest.fn()
};

const mockDeliveryModel = {
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

jest.unstable_mockModule('../../models/Payment.model.js', () => ({ 
  default: mockPaymentModel 
}));

jest.unstable_mockModule('../../models/Delivery.model.js', () => ({ 
  default: mockDeliveryModel 
}));

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

      const creator = { _id: 'admin123', firstName: 'Admin', lastName: 'User' };
      const collectors = [{ _id: 'collector1' }, { _id: 'collector2' }];
      const admins = [{ _id: 'admin1' }];

      mockSmartBinModel.create.mockResolvedValue(mockBin);
      mockUserModel.findById.mockResolvedValue(creator);
      mockUserModel.find
        .mockResolvedValueOnce(collectors)
        .mockResolvedValueOnce(admins);
      mockNotificationModel.create.mockResolvedValue({});

      await createSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binNumber: 'BIN-001',
          createdBy: 'user123'
        })
      );
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle notification failures gracefully', async () => {
      mockReq.body = {
        binNumber: 'BIN-002',
        binType: 'organic',
        capacity: 80
      };

      const creator = { _id: 'admin123', firstName: 'Admin' };

      mockSmartBinModel.create.mockResolvedValue(mockBin);
      mockUserModel.findById.mockResolvedValue(creator);
      mockUserModel.find.mockResolvedValue([{ _id: 'collector1' }]);
      mockNotificationModel.create.mockRejectedValue(new Error('Notification failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await createSmartBin(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);

      consoleErrorSpy.mockRestore();
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

    test('should filter bins for resident role', async () => {
      mockReq.user.role = 'resident';
      mockReq.user.id = 'resident123';

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
      expect(filterArg.assignedTo).toBe('resident123');
    });

    test('should filter by multiple statuses', async () => {
      mockReq.query = { status: 'active,full' };

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
      expect(filterArg.status.$in).toEqual(['active', 'full']);
    });

    test('should filter by multiple bin types', async () => {
      mockReq.query = { binType: 'recyclable,organic' };

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
      expect(filterArg.binType.$in).toEqual(['recyclable', 'organic']);
    });

    test('should search bins by text', async () => {
      mockReq.query = { search: 'BIN-001' };

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
      expect(filterArg.$or).toBeDefined();
    });

    test('should return map view', async () => {
      mockReq.query = { view: 'map' };

      mockSmartBinModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockBin])
            })
          })
        })
      });

      await getSmartBins(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1
        })
      );
    });

    test('should filter by assignedTo', async () => {
      mockReq.query = { assignedTo: 'resident123' };

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
      expect(filterArg.assignedTo).toBe('resident123');
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

      const bin = {
        ...mockBin,
        save: jest.fn().mockResolvedValue(true)
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);

      await updateSmartBin(mockReq, mockRes);

      expect(bin.save).toHaveBeenCalled();
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
      mockSmartBinModel.findByIdAndDelete.mockResolvedValue(mockBin);

      await deleteSmartBin(mockReq, mockRes);

      expect(mockSmartBinModel.findByIdAndDelete).toHaveBeenCalledWith('bin123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent bin', async () => {
      mockReq.params.id = 'nonexistent';
      mockSmartBinModel.findByIdAndDelete.mockResolvedValue(null);

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
        currentLevel: 45,
        capacity: 100,
        levelHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.find.mockResolvedValue([]);
      mockNotificationModel.insertMany.mockResolvedValue([]);

      await updateBinLevel(mockReq, mockRes);

      expect(bin.currentLevel).toBe(75);
      expect(bin.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should send notification when bin is full', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { currentLevel: 85 };

      const bin = {
        ...mockBin,
        currentLevel: 45,
        capacity: 100,
        assignedTo: { _id: 'resident123' },
        levelHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      const collectors = [{ _id: 'collector1' }, { _id: 'collector2' }];

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.find.mockResolvedValue(collectors);
      mockNotificationModel.insertMany.mockResolvedValue([]);

      await updateBinLevel(mockReq, mockRes);

      expect(mockNotificationModel.insertMany).toHaveBeenCalled();
      const notifications = mockNotificationModel.insertMany.mock.calls[0][0];
      expect(notifications.length).toBeGreaterThan(0);
    });

    test('should reject level exceeding capacity', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { currentLevel: 150 };

      const bin = {
        ...mockBin,
        capacity: 100
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);

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

    test('should return 404 if bin not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { currentLevel: 50 };

      mockSmartBinModel.findById.mockResolvedValue(null);

      await updateBinLevel(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('assignBin', () => {
    test('should assign bin to resident', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { userId: 'resident123', deliveryDate: '2024-12-01' };

      const bin = {
        ...mockBin,
        assignedTo: null,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      const resident = { _id: 'resident123', role: 'resident' };
      const payment = { _id: 'payment123', status: 'completed' };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockUserModel.findById.mockResolvedValue(resident);
      mockPaymentModel.findOne.mockResolvedValue(payment);
      mockDeliveryModel.create.mockResolvedValue({ _id: 'delivery123' });

      await assignBin(mockReq, mockRes);

      expect(bin.assignedTo).toBe('resident123');
      expect(bin.status).toBe('assigned');
      expect(bin.save).toHaveBeenCalled();
      expect(mockDeliveryModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if bin not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { userId: 'resident123' };

      mockSmartBinModel.findById.mockResolvedValue(null);

      await assignBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 404 if user not found', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { userId: 'nonexistent' };

      mockSmartBinModel.findById.mockResolvedValue(mockBin);
      mockUserModel.findById.mockResolvedValue(null);

      await assignBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if payment not verified', async () => {
      mockReq.params.id = 'bin123';
      mockReq.body = { userId: 'resident123' };

      const resident = { _id: 'resident123', role: 'resident' };

      mockSmartBinModel.findById.mockResolvedValue(mockBin);
      mockUserModel.findById.mockResolvedValue(resident);
      mockPaymentModel.findOne.mockResolvedValue(null);

      await assignBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('payment not verified')
        })
      );
    });
  });

  describe('emptyBin', () => {
    test('should empty bin successfully', async () => {
      mockReq.params.id = 'bin123';

      const updatedBin = {
        ...mockBin,
        currentLevel: 0,
        lastEmptied: new Date()
      };

      mockSmartBinModel.findByIdAndUpdate.mockResolvedValue(updatedBin);

      await emptyBin(mockReq, mockRes);

      expect(mockSmartBinModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'bin123',
        expect.objectContaining({
          currentLevel: 0,
          lastEmptied: expect.any(Date)
        }),
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if bin not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockSmartBinModel.findByIdAndUpdate.mockResolvedValue(null);

      await emptyBin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getBinStats', () => {
    test('should calculate bin statistics', async () => {
      mockReq.user.role = 'admin';

      const stats = [{
        statusCounts: [{ _id: 'active', count: 10 }],
        typeCounts: [{ _id: 'recyclable', count: 5 }],
        total: [{ count: 15 }],
        avgLevel: [{ average: 55 }],
        needsCollection: [{ count: 3 }],
        lowBattery: [{ count: 1 }]
      }];

      mockSmartBinModel.aggregate = jest.fn().mockResolvedValue(stats);

      await getBinStats(mockReq, mockRes);

      expect(mockSmartBinModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: stats[0]
        })
      );
    });
  });
});
