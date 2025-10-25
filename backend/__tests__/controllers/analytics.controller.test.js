import { jest } from '@jest/globals';

// Mock models
const mockSmartBinModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockCollectionRecordModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn()
};

const mockPickupRequestModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn()
};

const mockTicketModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockPaymentModel = {
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn()
};

const mockRouteModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
}));

jest.unstable_mockModule('../../models/CollectionRecord.model.js', () => ({
  default: mockCollectionRecordModel
}));

jest.unstable_mockModule('../../models/PickupRequest.model.js', () => ({
  default: mockPickupRequestModel
}));

jest.unstable_mockModule('../../models/Ticket.model.js', () => ({
  default: mockTicketModel
}));

jest.unstable_mockModule('../../models/Payment.model.js', () => ({
  default: mockPaymentModel
}));

jest.unstable_mockModule('../../models/Route.model.js', () => ({
  default: mockRouteModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Import functions
const {
  getDashboardStats,
  getWasteStatistics,
  getEfficiencyMetrics,
  getFinancialAnalytics,
  getAreaStatistics,
  getEngagementStatistics,
  exportAnalytics
} = await import('../../controllers/analytics.controller.js');

describe('Analytics Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'admin' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
    };

    // Setup default mock responses
    mockSmartBinModel.countDocuments.mockResolvedValue(10);
    mockCollectionRecordModel.countDocuments.mockResolvedValue(50);
    mockPickupRequestModel.countDocuments.mockResolvedValue(20);
    mockTicketModel.countDocuments.mockResolvedValue(5);
    mockRouteModel.countDocuments.mockResolvedValue(3);
    mockUserModel.countDocuments.mockResolvedValue(100);
    mockPaymentModel.aggregate.mockResolvedValue([{ total: 5000 }]);
    mockUserModel.aggregate.mockResolvedValue([
      { _id: 'admin', count: 5 },
      { _id: 'collector', count: 10 },
      { _id: 'resident', count: 85 }
    ]);
  });

  describe('getDashboardStats', () => {
    test('should get dashboard statistics for admin', async () => {
      await getDashboardStats(mockReq, mockRes);

      expect(mockSmartBinModel.countDocuments).toHaveBeenCalled();
      expect(mockCollectionRecordModel.countDocuments).toHaveBeenCalled();
      expect(mockPickupRequestModel.countDocuments).toHaveBeenCalled();
      expect(mockTicketModel.countDocuments).toHaveBeenCalled();
      expect(mockPaymentModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bins: expect.any(Object),
            collections: expect.any(Object),
            pickups: expect.any(Object),
            tickets: expect.any(Object),
            revenue: expect.any(Object)
          })
        })
      );
    });

    test('should filter statistics for residents', async () => {
      mockReq.user.role = 'resident';

      await getDashboardStats(mockReq, mockRes);

      expect(mockSmartBinModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user123' })
      );
      expect(mockPickupRequestModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ requestedBy: 'user123' })
      );
    });

    test('should handle database errors', async () => {
      mockSmartBinModel.countDocuments.mockRejectedValue(new Error('DB Error'));

      await getDashboardStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWasteStatistics', () => {
    test('should get waste statistics', async () => {
      mockCollectionRecordModel.aggregate.mockResolvedValue([
        { _id: 'recyclable', totalWeight: 500, count: 10 },
        { _id: 'organic', totalWeight: 300, count: 8 }
      ]);

      await getWasteStatistics(mockReq, mockRes);

      expect(mockCollectionRecordModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      mockCollectionRecordModel.aggregate.mockResolvedValue([]);

      await getWasteStatistics(mockReq, mockRes);

      expect(mockCollectionRecordModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            byType: expect.any(Array),
            trends: expect.any(Array)
          })
        })
      );
    });

    test('should group by month', async () => {
      mockReq.query = {
        groupBy: 'month'
      };

      mockCollectionRecordModel.aggregate.mockResolvedValue([]);

      await getWasteStatistics(mockReq, mockRes);

      expect(mockCollectionRecordModel.aggregate).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockCollectionRecordModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getWasteStatistics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEfficiencyMetrics', () => {
    test('should get efficiency metrics', async () => {
      mockRouteModel.aggregate.mockResolvedValue([
        { avgDuration: 45, avgDistance: 15, completionRate: 90 }
      ]);
      
      mockCollectionRecordModel.aggregate.mockResolvedValue([
        { _id: 'collector1', collectionsCompleted: 50, totalWeight: 500, avgWeight: 10 }
      ]);
      
      mockSmartBinModel.aggregate.mockResolvedValue([
        { _id: 'plastic', avgFillLevel: 75, count: 20 }
      ]);

      await getEfficiencyMetrics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            routeEfficiency: expect.any(Object),
            collectorPerformance: expect.any(Array),
            binUtilization: expect.any(Array)
          })
        })
      );
    });

    test('should handle database errors', async () => {
      mockRouteModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getEfficiencyMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getFinancialAnalytics', () => {
    test('should get financial analytics', async () => {
      mockPaymentModel.aggregate.mockResolvedValue([
        { _id: 'completed', totalRevenue: 10000, count: 50 },
        { _id: 'pending', totalRevenue: 2000, count: 10 }
      ]);

      await getFinancialAnalytics(mockReq, mockRes);

      expect(mockPaymentModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should handle database errors', async () => {
      mockPaymentModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getFinancialAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAreaStatistics', () => {
    test('should get area statistics', async () => {
      mockRouteModel.aggregate.mockResolvedValue([
        { _id: 'Colombo', routeCount: 5, totalBins: 50 }
      ]);
      
      mockSmartBinModel.aggregate.mockResolvedValue([
        { _id: '123 Main St', binCount: 10, avgFillLevel: 75 }
      ]);

      await getAreaStatistics(mockReq, mockRes);

      expect(mockRouteModel.aggregate).toHaveBeenCalled();
      expect(mockSmartBinModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            routesByArea: expect.any(Array),
            binsByLocation: expect.any(Array)
          })
        })
      );
    });

    test('should handle database errors', async () => {
      mockRouteModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getAreaStatistics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEngagementStatistics', () => {
    test('should get engagement statistics', async () => {
      mockUserModel.aggregate.mockResolvedValue([
        { _id: 'admin', count: 5 },
        { _id: 'resident', count: 95 }
      ]);
      mockPickupRequestModel.aggregate.mockResolvedValue([
        { totalRequests: 100 }
      ]);
      mockTicketModel.aggregate.mockResolvedValue([
        { totalTickets: 50 }
      ]);

      await getEngagementStatistics(mockReq, mockRes);

      expect(mockUserModel.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should handle database errors', async () => {
      mockUserModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getEngagementStatistics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportAnalytics', () => {
    test('should export collections data', async () => {
      mockReq.query = { type: 'collections' };

      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { bin: 'bin1', collector: 'collector1', resident: 'resident1', route: 'route1' }
        ])
      });

      await exportAnalytics(mockReq, mockRes);

      expect(mockCollectionRecordModel.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    test('should export pickups data', async () => {
      mockReq.query = { type: 'pickups' };

      mockPickupRequestModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { resident: 'resident1', collector: 'collector1' }
        ])
      });

      await exportAnalytics(mockReq, mockRes);

      expect(mockPickupRequestModel.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    test('should export payments data', async () => {
      mockReq.query = { type: 'payments' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { user: 'user1', amount: 100 }
        ])
      });

      await exportAnalytics(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    test('should filter by date range', async () => {
      mockReq.query = {
        type: 'collections',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      await exportAnalytics(mockReq, mockRes);

      expect(mockCollectionRecordModel.find).toHaveBeenCalled();
    });

    test('should return 400 for invalid export type', async () => {
      mockReq.query = { type: 'invalid' };

      await exportAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid export type'
      });
    });

    test('should return 400 when no type specified', async () => {
      mockReq.query = {};

      await exportAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid export type'
      });
    });

    test('should handle database errors', async () => {
      mockReq.query = { type: 'collections' };
      
      mockCollectionRecordModel.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB Error'))
      });

      await exportAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
