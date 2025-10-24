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
  return await Route.create({
    routeName: `Route ${Date.now()}`,
    routeCode: `RC${Date.now()}`,
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
  });

  describe('startRoute', () => {
    it('should start route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };

      await startRoute(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('completeRoute', () => {
    it('should complete route successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);

      req.params = { id: route._id.toString() };

      await completeRoute(req, res);

      expect(res.json).toHaveBeenCalled();
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

    it('should store waypoints', async () => {
      const collector = await createTestUser('collector');
      const route = await Route.create({
        routeName: 'Waypoint Test',
        routeCode: 'WPT001',
        area: 'Test',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01'),
        waypoints: [
          {
            location: { type: 'Point', coordinates: [80.7718, 7.8731] },
            order: 1,
            estimatedArrival: new Date(),
            action: 'collect'
          }
        ]
      });

      expect(route.waypoints).toHaveLength(1);
      expect(route.waypoints[0].order).toBe(1);
    });
  });
});
