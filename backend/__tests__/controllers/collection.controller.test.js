import { jest } from '@jest/globals';

// Mock models
const mockCollectionRecordModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockSmartBinModel = {
  findById: jest.fn(),
  find: jest.fn()
};

const mockUserModel = {
  findById: jest.fn(),
  find: jest.fn()
};

const mockRouteModel = {
  find: jest.fn(),
  create: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/CollectionRecord.model.js', () => ({
  default: mockCollectionRecordModel
}));

jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Route.model.js', () => ({
  default: mockRouteModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const {
  getCollectionRecords,
  getCollectionRecord,
  createCollectionRecord,
  updateCollectionRecord,
  deleteCollectionRecord,
  getCollectionStats,
  getCollectionSchedule,
  getRoutes,
  createRoute
} = await import('../../controllers/collection.controller.js');

describe('Collection Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

  const mockCollection = {
    _id: 'col123',
    bin: 'bin123',
    collector: 'collector123',
    wasteType: 'general',
    weightKg: 25,
    status: 'completed'
  };

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

  describe('getCollectionRecords', () => {
    test('should get all collection records for admin', async () => {
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([mockCollection])
                  })
                })
              })
            })
          })
        })
      });
      mockCollectionRecordModel.countDocuments.mockResolvedValue(1);

      await getCollectionRecords(mockReq, mockRes);

      expect(mockCollectionRecordModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter records by collector role', async () => {
      mockReq.user.role = 'collector';
      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([mockCollection])
                  })
                })
              })
            })
          })
        })
      });
      mockCollectionRecordModel.countDocuments.mockResolvedValue(1);

      await getCollectionRecords(mockReq, mockRes);

      const callArg = mockCollectionRecordModel.find.mock.calls[0][0];
      expect(callArg.collector).toBe('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.query.status = 'completed';
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([mockCollection])
                  })
                })
              })
            })
          })
        })
      });
      mockCollectionRecordModel.countDocuments.mockResolvedValue(1);

      await getCollectionRecords(mockReq, mockRes);

      const callArg = mockCollectionRecordModel.find.mock.calls[0][0];
      expect(callArg.status).toBe('completed');
    });

    test('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([mockCollection])
                  })
                })
              })
            })
          })
        })
      });
      mockCollectionRecordModel.countDocuments.mockResolvedValue(1);

      await getCollectionRecords(mockReq, mockRes);

      const callArg = mockCollectionRecordModel.find.mock.calls[0][0];
      expect(callArg.collectionDate).toBeDefined();
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getCollectionRecords(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCollectionRecord', () => {
    test('should get collection record by ID', async () => {
      mockReq.params.id = 'col123';
      mockCollectionRecordModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue(mockCollection)
            })
          })
        })
      });

      await getCollectionRecord(mockReq, mockRes);

      expect(mockCollectionRecordModel.findById).toHaveBeenCalledWith('col123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent record', async () => {
      mockReq.params.id = 'nonexistent';
      mockCollectionRecordModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue(null)
            })
          })
        })
      });

      await getCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'col123';
      mockCollectionRecordModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createCollectionRecord', () => {
    test('should create collection record successfully', async () => {
      mockReq.body = {
        bin: 'bin123',
        wasteType: 'general',
        weightKg: 25
      };

      const bin = {
        _id: 'bin123',
        location: { address: '123 Test St' },
        currentLevel: 80,
        binType: 'general',
        save: jest.fn().mockResolvedValue(true)
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);
      mockCollectionRecordModel.create.mockResolvedValue(mockCollection);
      mockNotificationModel.create.mockResolvedValue({});

      await createCollectionRecord(mockReq, mockRes);

      expect(mockCollectionRecordModel.create).toHaveBeenCalled();
      expect(bin.currentLevel).toBe(0);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 404 if bin not found', async () => {
      mockReq.body = {
        bin: 'nonexistent',
        wasteType: 'general',
        weightKg: 25
      };

      mockSmartBinModel.findById.mockResolvedValue(null);

      await createCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 for missing required fields', async () => {
      mockReq.body = {
        bin: 'bin123'
        // missing wasteType and weightKg
      };

      const bin = {
        _id: 'bin123',
        location: { address: '123 Test St' }
      };

      mockSmartBinModel.findById.mockResolvedValue(bin);

      await createCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.body = {
        bin: 'bin123',
        wasteType: 'general',
        weightKg: 25
      };

      mockSmartBinModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await createCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateCollectionRecord', () => {
    test('should update collection record successfully', async () => {
      mockReq.params.id = 'col123';
      mockReq.body = { status: 'completed', notes: 'Updated' };

      const record = {
        ...mockCollection,
        save: jest.fn().mockResolvedValue(true)
      };

      mockCollectionRecordModel.findById.mockResolvedValue(record);
      mockNotificationModel.create.mockResolvedValue({});

      await updateCollectionRecord(mockReq, mockRes);

      expect(record.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent record', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'completed' };
      mockCollectionRecordModel.findById.mockResolvedValue(null);

      await updateCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'col123';
      mockReq.body = { status: 'completed' };
      mockCollectionRecordModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await updateCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteCollectionRecord', () => {
    test('should delete collection record successfully', async () => {
      mockReq.params.id = 'col123';
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.findById.mockResolvedValue(mockCollection);
      mockCollectionRecordModel.findByIdAndDelete.mockResolvedValue(mockCollection);

      await deleteCollectionRecord(mockReq, mockRes);

      expect(mockCollectionRecordModel.findByIdAndDelete).toHaveBeenCalledWith('col123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent record', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.findById.mockResolvedValue(null);

      await deleteCollectionRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getCollectionStats', () => {
    test('should get collection statistics', async () => {
      mockReq.user.role = 'admin';
      const stats = [
        { _id: 'completed', count: 50, totalWeight: 1250 },
        { _id: 'pending', count: 10, totalWeight: 250 }
      ];
      mockCollectionRecordModel.aggregate.mockResolvedValue(stats);
      mockCollectionRecordModel.countDocuments.mockResolvedValue(60);

      await getCollectionStats(mockReq, mockRes);

      expect(mockCollectionRecordModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter stats by date range', async () => {
      mockReq.user.role = 'admin';
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
      mockCollectionRecordModel.aggregate.mockResolvedValue([]);
      mockCollectionRecordModel.countDocuments.mockResolvedValue(0);

      await getCollectionStats(mockReq, mockRes);

      expect(mockCollectionRecordModel.aggregate).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';
      mockCollectionRecordModel.aggregate.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getCollectionStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCollectionSchedule', () => {
    test('should get collection schedule', async () => {
      mockReq.user.role = 'collector';
      mockRouteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'route1', name: 'Route A' }
          ])
        })
      });

      await getCollectionSchedule(mockReq, mockRes);

      expect(mockRouteModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'collector';
      mockRouteModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getCollectionSchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRoutes', () => {
    test('should get all routes', async () => {
      mockReq.user.role = 'admin';
      mockRouteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'route1', name: 'Route A' }
          ])
        })
      });

      await getRoutes(mockReq, mockRes);

      expect(mockRouteModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';
      mockRouteModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getRoutes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createRoute', () => {
    test('should create route successfully', async () => {
      mockReq.body = {
        name: 'Route A',
        bins: ['bin1', 'bin2'],
        collector: 'collector123'
      };
      mockReq.user.role = 'operator';

      mockRouteModel.create.mockResolvedValue({
        _id: 'route1',
        name: 'Route A',
        bins: ['bin1', 'bin2']
      });
      mockNotificationModel.create.mockResolvedValue({});

      await createRoute(mockReq, mockRes);

      expect(mockRouteModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle database errors', async () => {
      mockReq.body = {
        name: 'Route A',
        bins: ['bin1', 'bin2']
      };
      mockReq.user.role = 'operator';
      mockRouteModel.create.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await createRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
