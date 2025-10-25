import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import Route from '../models/Route.model.js';
import SmartBin from '../models/SmartBin.model.js';
import routeRoutes from '../routes/route.routes.js';
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  updateRouteStatus,
  startRoute,
  completeRoute,
  optimizeRoute,
  getRouteStats
} from '../controllers/route.controller.js';
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

let routeCounter = 0;

const mockReqRes = () => {
  const req = { body: {}, params: {}, query: {}, user: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
};

const createTestUser = async (role = 'collector') => {
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

const createTestRoute = async (collector, status = 'pending') => {
  routeCounter++;
  return await Route.create({
    routeName: `Route ${Date.now()}-${routeCounter}`,
    routeCode: `RC${Date.now()}-${routeCounter}`,
    area: 'Test Area',
    assignedCollector: collector._id,
    scheduledDate: new Date('2025-12-01'),
    status,
    priority: 'medium',
    estimatedDuration: 120,
    bins: []
  });
};

describe('Route Controller Tests', () => {
  describe('createRoute', () => {
    it('should create route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      req.body = {
        routeName: 'Morning Route 1',
        area: 'Colombo District',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01'),
        priority: 'high',
        estimatedDuration: 180
      };

      await createRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            routeName: 'Morning Route 1',
            priority: 'high'
          })
        })
      );
    });

    it('should auto-generate route code', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      req.body = {
        routeName: 'Test Route',
        area: 'Test Area',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01')
      };

      await createRoute(req, res);

      const route = await Route.findOne({ routeName: 'Test Route' });
      expect(route.routeCode).toBeDefined();
    });
  });

  describe('getRoutes', () => {
    it('should get all routes for admin', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      await createTestRoute(collector1);
      await createTestRoute(collector2);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getRoutes(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(2);
    });

    it('should get only own routes for collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      
      await createTestRoute(collector1);
      await createTestRoute(collector2);

      req.user = { _id: collector1._id, role: 'collector' };
      req.query = {};

      await getRoutes(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
    });

    it('should filter routes by status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      await createTestRoute(collector, 'pending');
      await createTestRoute(collector, 'in-progress');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { status: 'pending' };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
      expect(response.data.routes[0].status).toBe('pending');
    });

    it('should filter routes by area', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      const route1 = await createTestRoute(collector);
      route1.area = 'Colombo';
      await route1.save();
      
      const route2 = await createTestRoute(collector);
      route2.area = 'Kandy';
      await route2.save();

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { area: 'Colombo' };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      for (let i = 0; i < 15; i++) {
        const route = new Route({
          routeName: `Route ${i}`,
          routeCode: `RC${Date.now()}-${i}`,
          area: 'Test Area',
          assignedCollector: collector._id,
          scheduledDate: new Date(),
          bins: []
        });
        await route.save();
      }

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { page: '1', limit: '10' };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(10);
      expect(response.data.pagination.totalItems).toBe(15);
    });

    it('should filter by priority', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      const route1 = await createTestRoute(collector);
      route1.priority = 'high';
      await route1.save();
      
      const route2 = await createTestRoute(collector);
      route2.priority = 'low';
      await route2.save();

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { priority: 'high' };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
      expect(response.data.routes[0].priority).toBe('high');
    });

    it('should filter by date range', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      const route1 = await createTestRoute(collector);
      route1.scheduledDate = new Date('2025-01-15');
      await route1.save();
      
      const route2 = await createTestRoute(collector);
      route2.scheduledDate = new Date('2025-02-15');
      await route2.save();

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { 
        startDate: '2025-02-01',
        endDate: '2025-02-28'
      };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
    });

    it('should search routes by name or code', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      const route1 = await Route.create({
        routeName: 'Morning Collection Route',
        routeCode: 'MCR001',
        area: 'Test',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01'),
        bins: []
      });
      
      const route2 = await createTestRoute(collector);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { search: 'Morning' };

      await getRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes.length).toBe(1);
      expect(response.data.routes[0].routeName).toContain('Morning');
    });
  });

  describe('getRoute', () => {
    it('should get single route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };
      req.user = { _id: collector._id, role: 'collector' };

      await getRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: collector._id };

      await getRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateRoute', () => {
    it('should update route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };
      req.body = {
        routeName: 'Updated Route Name',
        priority: 'high',
        status: 'in-progress'
      };

      await updateRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      
      const updatedRoute = await Route.findById(route._id);
      expect(updatedRoute.routeName).toBe('Updated Route Name');
      expect(updatedRoute.priority).toBe('high');
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { routeName: 'Updated' };

      await updateRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteRoute', () => {
    it('should delete route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };

      await deleteRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const deletedRoute = await Route.findById(route._id);
      expect(deletedRoute).toBeNull();
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };

      await deleteRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should not delete in-progress route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector, 'in-progress');

      req.params = { id: route._id.toString() };

      await deleteRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      
      const existingRoute = await Route.findById(route._id);
      expect(existingRoute).not.toBeNull();
    });

    it('should not delete completed route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector, 'completed');

      req.params = { id: route._id.toString() };

      await deleteRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      
      const existingRoute = await Route.findById(route._id);
      expect(existingRoute).not.toBeNull();
    });
  });

  describe('updateRouteStatus', () => {
    it('should update route status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };
      req.body = { status: 'in-progress' };

      await updateRouteStatus(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const updatedRoute = await Route.findById(route._id);
      expect(updatedRoute.status).toBe('in-progress');
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { status: 'completed' };

      await updateRouteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject invalid status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };
      req.body = { status: 'invalid-status' };
      req.user = { _id: collector._id, role: 'collector' };

      await updateRouteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const route = await createTestRoute(collector1);

      req.params = { id: route._id.toString() };
      req.body = { status: 'in-progress' };
      req.user = { _id: collector2._id, role: 'collector' };

      await updateRouteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('startRoute', () => {
    it('should start route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };
      req.user = { _id: collector._id, role: 'collector' };

      await startRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      const updatedRoute = await Route.findById(route._id);
      expect(updatedRoute.status).toBe('in-progress');
    });

    it('should reject unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const route = await createTestRoute(collector1);

      req.params = { id: route._id.toString() };
      req.user = { _id: collector2._id, role: 'collector' };

      await startRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject starting completed route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector, 'completed');

      req.params = { id: route._id.toString() };
      req.user = { _id: collector._id, role: 'collector' };

      await startRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: collector._id, role: 'collector' };

      await startRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('completeRoute', () => {
    it('should complete route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector, 'in-progress');

      req.params = { id: route._id.toString() };
      req.user = { _id: collector._id, role: 'collector' };
      req.body = { distance: 10, collectedBins: 5 };

      await completeRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      const updatedRoute = await Route.findById(route._id);
      expect(updatedRoute.status).toBe('completed');
    });

    it('should reject unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const route = await createTestRoute(collector1, 'in-progress');

      req.params = { id: route._id.toString() };
      req.user = { _id: collector2._id, role: 'collector' };
      req.body = { distance: 10, collectedBins: 5 };

      await completeRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject completing pending route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector, 'pending');

      req.params = { id: route._id.toString() };
      req.user = { _id: collector._id, role: 'collector' };
      req.body = { distance: 10, collectedBins: 5 };

      await completeRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: collector._id, role: 'collector' };
      req.body = { distance: 10, collectedBins: 5 };

      await completeRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('optimizeRoute', () => {
    it('should optimize route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };

      await optimizeRoute(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getRouteStats', () => {
    it('should return route statistics', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      
      await createTestRoute(collector, 'pending');
      await createTestRoute(collector, 'in-progress');
      await createTestRoute(collector, 'completed');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getRouteStats(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('Route Model Tests', () => {
    it('should create route with required fields', async () => {
      const collector = await createTestUser('collector');
      const route = await Route.create({
        routeName: 'Model Test Route',
        routeCode: 'MRT001',
        area: 'Test Area',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01'),
        status: 'pending',
        priority: 'medium',
        estimatedDuration: 120
      });

      expect(route.routeName).toBe('Model Test Route');
      expect(route.status).toBe('pending');
      expect(route.priority).toBe('medium');
    });

    it('should have default status as pending', async () => {
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);
      expect(route.status).toBe('pending');
    });

    it('should store bins array', async () => {
      const collector = await createTestUser('collector');
      const admin = await createTestUser('admin');
      const bin = await SmartBin.create({
        binId: `BIN-${Date.now()}`,
        location: {
          type: 'Point',
          coordinates: [80.7718, 7.8731]
        },
        address: 'Test Address',
        capacity: 100,
        currentLevel: 80,
        type: 'general',
        status: 'active',
        createdBy: admin._id
      });

      const route = await Route.create({
        routeName: 'Bins Test',
        routeCode: `BNT-${Date.now()}`,
        area: 'Test',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01'),
        bins: [bin._id]
      });

      expect(Array.isArray(route.bins)).toBe(true);
      expect(route.bins.length).toBe(1);
    });
  });
});
