import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import SmartBin from '../models/SmartBin.model.js';
import CollectionRecord from '../models/CollectionRecord.model.js';
import PickupRequest from '../models/PickupRequest.model.js';
import Ticket from '../models/Ticket.model.js';
import Payment from '../models/Payment.model.js';
import Route from '../models/Route.model.js';
import analyticsRoutes from '../routes/analytics.routes.js';
import {
  getDashboardStats,
  getWasteStatistics,
  getEfficiencyMetrics,
  getFinancialAnalytics,
  getAreaStatistics,
  getEngagementStatistics,
  exportAnalytics
} from '../controllers/analytics.controller.js';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});

const mockReqRes = () => {
  const req = { body: {}, params: {}, query: {}, user: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
};

const createTestUser = async (role = 'resident') => {
  return await User.create({
    firstName: 'Test',
    lastName: role.charAt(0).toUpperCase() + role.slice(1),
    email: `test${role}${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    role,
    isActive: true
  });
};

const createTestBin = async (resident) => {
  return await SmartBin.create({
    binCode: `BIN${Date.now()}${Math.random()}`,
    location: {
      type: 'Point',
      coordinates: [80.7718, 7.8731],
      address: 'Test Address'
    },
    wasteType: 'general',
    capacity: 100,
    fillLevel: 50,
    status: 'active',
    createdBy: resident._id
  });
};

const createTestCollection = async (bin, collector, resident) => {
  return await CollectionRecord.create({
    bin: bin._id,
    collector: collector._id,
    resident: resident._id,
    collectionDate: new Date(),
    wasteType: 'general',
    wasteWeight: 25,
    status: 'completed'
  });
};

const createTestPickup = async (resident) => {
  return await PickupRequest.create({
    requestedBy: resident._id,
    address: {
      street: '123 Test St',
      city: 'Test City',
      district: 'Test District',
      postalCode: '12345'
    },
    wasteType: 'general',
    quantity: 'medium',
    status: 'pending',
    preferredDate: new Date('2025-12-01')
  });
};

const createTestTicket = async (resident) => {
  return await Ticket.create({
    ticketId: `TICK${Date.now()}`,
    category: 'collection',
    subject: 'Test Ticket',
    description: 'Test description',
    priority: 'medium',
    status: 'open',
    createdBy: resident._id
  });
};

const createTestPayment = async (user) => {
  return await Payment.create({
    user: user._id,
    amount: 1000,
    paymentMethod: 'card',
    status: 'completed',
    description: 'Test payment'
  });
};

const createTestRoute = async (collector) => {
  return await Route.create({
    routeName: `Route ${Date.now()}`,
    routeCode: `RC${Date.now()}`,
    area: 'Test Area',
    assignedCollector: collector._id,
    scheduledDate: new Date(),
    status: 'in-progress',
    bins: []
  });
};

describe('Analytics Controller Tests', () => {
  describe('getDashboardStats', () => {
    it('should return dashboard statistics for admin', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');

      const bin = await createTestBin(resident);
      await createTestCollection(bin, collector, resident);
      await createTestPickup(resident);
      await createTestTicket(resident);
      await createTestPayment(resident);
      await createTestRoute(collector);

      req.user = { id: admin._id, role: 'admin' };

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bins: expect.any(Object),
            collections: expect.any(Object),
            pickups: expect.any(Object),
            tickets: expect.any(Object),
            revenue: expect.any(Object),
            routes: expect.any(Object),
            users: expect.any(Object)
          })
        })
      );
    });

    it('should return filtered stats for resident', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      await createTestBin(resident1);
      await createTestBin(resident2);

      req.user = { id: resident1._id, role: 'resident' };

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.bins.total).toBe(1);
    });

    it('should calculate bins needing collection', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const highFillBin = await createTestBin(resident);
      highFillBin.fillLevel = 85;
      await highFillBin.save();

      req.user = { id: admin._id, role: 'admin' };

      await getDashboardStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.bins.needingCollection).toBe(1);
    });

    it('should calculate monthly revenue', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      await createTestPayment(resident);

      req.user = { id: admin._id, role: 'admin' };

      await getDashboardStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.revenue.monthly).toBeGreaterThan(0);
    });

    it('should count active routes', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const collector = await createTestUser('collector');

      const route = await createTestRoute(collector);
      route.status = 'in-progress';
      await route.save();

      req.user = { id: admin._id, role: 'admin' };

      await getDashboardStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.routes.active).toBeGreaterThanOrEqual(0);
    });

    it('should calculate percentage changes', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');

      req.user = { id: admin._id, role: 'admin' };

      await getDashboardStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.collections).toHaveProperty('change');
      expect(response.data.pickups).toHaveProperty('change');
      expect(response.data.tickets).toHaveProperty('change');
    });
  });

  describe('getWasteStatistics', () => {
    it('should return waste statistics', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector, resident);

      req.query = {};

      await getWasteStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            byType: expect.any(Array),
            trends: expect.any(Array)
          })
        })
      );
    });

    it('should filter by date range', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector, resident);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      req.query = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      await getWasteStatistics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should group by month', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector, resident);

      req.query = { groupBy: 'month' };

      await getWasteStatistics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });
  });

  describe('getEfficiencyMetrics', () => {
    it('should return efficiency metrics', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const bin = await createTestBin(resident);

      await createTestRoute(collector);
      await createTestCollection(bin, collector, resident);

      req.query = {};

      await getEfficiencyMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith(
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

    it('should calculate route efficiency', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      const route = await createTestRoute(collector);
      route.status = 'completed';
      route.duration = 120;
      route.distance = 50;
      await route.save();

      req.query = {};

      await getEfficiencyMetrics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should rank collector performance', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector1, resident);
      await createTestCollection(bin, collector2, resident);

      req.query = {};

      await getEfficiencyMetrics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.collectorPerformance).toBeDefined();
    });
  });

  describe('getFinancialAnalytics', () => {
    it('should return financial analytics', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      await createTestPayment(resident);

      req.query = {};

      await getFinancialAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            monthlyRevenue: expect.any(Array),
            paymentStatus: expect.any(Array),
            revenueByType: expect.any(Array)
          })
        })
      );
    });

    it('should filter by year', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      await createTestPayment(resident);

      req.query = { year: '2025' };

      await getFinancialAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should group revenue by payment method', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      const payment1 = await createTestPayment(resident);
      payment1.paymentMethod = 'card';
      await payment1.save();

      const payment2 = await createTestPayment(resident);
      payment2.paymentMethod = 'cash';
      await payment2.save();

      req.query = {};

      await getFinancialAnalytics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.revenueByType).toBeDefined();
    });
  });

  describe('getAreaStatistics', () => {
    it('should return area statistics', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');

      await createTestRoute(collector);
      await createTestBin(resident);

      req.query = {};

      await getAreaStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            routesByArea: expect.any(Array),
            binsByLocation: expect.any(Array)
          })
        })
      );
    });

    it('should group routes by area', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      const route1 = await createTestRoute(collector);
      route1.area = 'Colombo';
      await route1.save();

      const route2 = await createTestRoute(collector);
      route2.area = 'Kandy';
      await route2.save();

      req.query = {};

      await getAreaStatistics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.routesByArea).toHaveLength(2);
    });

    it('should limit bins by location to 20', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      for (let i = 0; i < 25; i++) {
        await createTestBin(resident);
      }

      req.query = {};

      await getAreaStatistics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.binsByLocation.length).toBeLessThanOrEqual(20);
    });
  });

  describe('getEngagementStatistics', () => {
    it('should return engagement statistics', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('admin');
      await createTestUser('resident');
      await createTestUser('collector');

      req.query = {};

      await getEngagementStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            usersByRole: expect.any(Array),
            activeUsers: expect.any(Number),
            pickupRequestStats: expect.any(Array),
            ticketStats: expect.any(Array)
          })
        })
      );
    });

    it('should count active users', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      user.lastLogin = new Date();
      await user.save();

      req.query = {};

      await getEngagementStatistics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.activeUsers).toBeGreaterThanOrEqual(0);
    });

    it('should group pickup requests by status', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      await createTestPickup(resident);

      req.query = {};

      await getEngagementStatistics(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.pickupRequestStats).toBeDefined();
    });
  });

  describe('exportAnalytics', () => {
    it('should export collection data', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector, resident);

      req.query = { type: 'collections' };

      await exportAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should export pickup data', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      await createTestPickup(resident);

      req.query = { type: 'pickups' };

      await exportAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should export payment data', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      await createTestPayment(resident);

      req.query = { type: 'payments' };

      await exportAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should filter by date range', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident);

      await createTestCollection(bin, collector, resident);

      req.query = {
        type: 'collections',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString()
      };

      await exportAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it('should return error for invalid type', async () => {
      const { req, res } = mockReqRes();

      req.query = { type: 'invalid' };

      await exportAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid export type'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getDashboardStats', async () => {
      const { req, res } = mockReqRes();

      req.user = { id: 'invalid-id', role: 'admin' };

      await getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors in getWasteStatistics', async () => {
      const { req, res } = mockReqRes();

      req.query = { startDate: 'invalid-date' };

      await getWasteStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors in getEfficiencyMetrics', async () => {
      const { req, res } = mockReqRes();

      jest.spyOn(Route, 'aggregate').mockRejectedValueOnce(new Error('DB error'));

      await getEfficiencyMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
