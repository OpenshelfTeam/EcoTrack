import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import PickupRequest from '../models/PickupRequest.model.js';
import User from '../models/User.model.js';
import SmartBin from '../models/SmartBin.model.js';
import Notification from '../models/Notification.model.js';
import pickupRoutes from '../routes/pickup.routes.js';
import {
  createPickupRequest,
  getPickupRequests,
  getPickupRequest,
  updatePickupRequest,
  updatePickupStatus,
  assignCollector,
  cancelPickupRequest,
  getPickupStats,
  completePickup
} from '../controllers/pickup.controller.js';

// Setup and teardown
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

// Helper functions
const mockReqRes = () => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: {}
  };
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

const createTestBin = async (resident, operator) => {
  return await SmartBin.create({
    binType: 'general',
    capacity: 100,
    currentLevel: 75,
    status: 'active',
    assignedTo: resident._id,
    createdBy: operator._id,
    location: {
      type: 'Point',
      coordinates: [80.7718, 7.8731],
      address: '123 Test Street'
    }
  });
};

describe('Pickup Controller Tests', () => {
  
  describe('createPickupRequest - Positive Cases', () => {
    it('should create pickup request successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'bulk',
        description: 'Old furniture to dispose',
        quantity: {
          value: 5,
          unit: 'items'
        },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test Street'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        contactPerson: {
          name: 'John Doe',
          phone: '0771234567'
        }
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            wasteType: 'bulk',
            status: 'pending'
          })
        })
      );

      // Verify pickup was created
      const pickups = await PickupRequest.find();
      expect(pickups).toHaveLength(1);
      expect(pickups[0].requestId).toMatch(/^PKP/);
      
      // Verify notifications were created
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should create pickup with all waste types', async () => {
      const resident = await createTestUser('resident');
      const wasteTypes = ['bulk', 'hazardous', 'electronic', 'construction', 'organic', 'recyclable', 'other'];
      
      for (const wasteType of wasteTypes) {
        const { req, res } = mockReqRes();
        req.user = { _id: resident._id };
        req.body = {
          wasteType,
          description: `${wasteType} waste`,
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: {
            coordinates: [80.7718, 7.8731],
            address: '123 Test St'
          },
          preferredDate: new Date(2025, 11, wasteTypes.indexOf(wasteType) + 1),
          timeSlot: 'afternoon'
        };

        await createPickupRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
      }
      
      const pickups = await PickupRequest.find();
      expect(pickups).toHaveLength(wasteTypes.length);
    });

    it('should create pickup with all time slots', async () => {
      const resident = await createTestUser('resident');
      const timeSlots = ['morning', 'afternoon', 'evening'];
      
      for (const timeSlot of timeSlots) {
        const { req, res } = mockReqRes();
        req.user = { _id: resident._id };
        req.body = {
          wasteType: 'bulk',
          description: 'Test waste',
          quantity: { value: 5, unit: 'items' },
          pickupLocation: {
            coordinates: [80.7718, 7.8731],
            address: '123 Test St'
          },
          preferredDate: new Date(2025, 11, timeSlots.indexOf(timeSlot) + 1),
          timeSlot
        };

        await createPickupRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('createPickupRequest - Negative & Edge Cases', () => {
    it('should prevent duplicate pickup on same date', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const preferredDate = new Date('2025-12-01');
      
      // Create first pickup
      await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'First pickup',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate,
        timeSlot: 'morning',
        status: 'pending'
      });

      // Try to create second pickup
      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'bulk',
        description: 'Second pickup',
        quantity: { value: 3, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate,
        timeSlot: 'afternoon'
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already scheduled')
        })
      );
    });

    it('should handle missing required fields', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.body = {
        // Missing required fields
        wasteType: 'bulk'
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPickupRequests - Filtering & Pagination', () => {
    it('should get all pickups for admin', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      await PickupRequest.create({
        requestedBy: resident1._id,
        wasteType: 'bulk',
        description: 'Pickup 1',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });
      
      await PickupRequest.create({
        requestedBy: resident2._id,
        wasteType: 'hazardous',
        description: 'Pickup 2',
        quantity: { value: 2, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '456 Test Ave'
        },
        preferredDate: new Date('2025-12-02'),
        timeSlot: 'afternoon'
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should get only own pickups for resident', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      await PickupRequest.create({
        requestedBy: resident1._id,
        wasteType: 'bulk',
        description: 'Pickup 1',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });
      
      await PickupRequest.create({
        requestedBy: resident2._id,
        wasteType: 'bulk',
        description: 'Pickup 2',
        quantity: { value: 3, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '456 Test Ave'
        },
        preferredDate: new Date('2025-12-02'),
        timeSlot: 'afternoon'
      });

      req.user = { _id: resident1._id, role: 'resident' };
      req.query = {};

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should filter by status', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Pending pickup',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'pending'
      });
      
      await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Completed pickup',
        quantity: { value: 3, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-11-15'),
        timeSlot: 'afternoon',
        status: 'completed'
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { status: 'pending' };

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].status).toBe('pending');
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      // Create 15 pickups
      for (let i = 0; i < 15; i++) {
        await PickupRequest.create({
          requestedBy: resident._id,
          wasteType: 'bulk',
          description: `Pickup ${i}`,
          quantity: { value: 5, unit: 'items' },
          pickupLocation: {
            coordinates: [80.7718, 7.8731],
            address: '123 Test St'
          },
          preferredDate: new Date(2025, 11, i + 1),
          timeSlot: 'morning'
        });
      }

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { page: 1, limit: 10 };

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(10);
      expect(response.total).toBe(15);
      expect(response.pages).toBe(2);
    });
  });

  describe('getPickupRequest - Single Pickup', () => {
    it('should get single pickup successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'electronic',
        description: 'Old laptop',
        quantity: { value: 1, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: pickup._id.toString() };

      await getPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            wasteType: 'electronic'
          })
        })
      );
    });

    it('should return 404 for non-existent pickup', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await getPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for unauthorized access', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident1._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      req.user = { _id: resident2._id, role: 'resident' };
      req.params = { id: pickup._id.toString() };

      await getPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('assignCollector', () => {
    it('should assign collector successfully', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Old furniture',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'pending'
      });

      req.user = { _id: operator._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        collectorId: collector._id.toString(),
        scheduledDate: new Date('2025-12-01')
      };

      await assignCollector(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedPickup = await PickupRequest.findById(pickup._id);
      expect(updatedPickup.assignedCollector.toString()).toBe(collector._id.toString());
      expect(updatedPickup.status).toBe('scheduled');
      
      // Verify notifications were sent
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent collector', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      req.user = { _id: operator._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        collectorId: new mongoose.Types.ObjectId().toString(),
        scheduledDate: new Date('2025-12-01')
      };

      await assignCollector(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Collector not found'
        })
      );
    });

    it('should return 400 when assigning non-collector user', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      const anotherResident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      req.user = { _id: operator._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        collectorId: anotherResident._id.toString(),
        scheduledDate: new Date('2025-12-01')
      };

      await assignCollector(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not a collector')
        })
      );
    });
  });

  describe('completePickup', () => {
    it('should complete pickup with collected status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Old furniture',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'scheduled',
        assignedCollector: collector._id,
        scheduledDate: new Date('2025-12-01')
      });

      req.user = { _id: collector._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        binStatus: 'collected',
        collectorNotes: 'Collection successful'
      };

      await completePickup(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedPickup = await PickupRequest.findById(pickup._id);
      expect(updatedPickup.status).toBe('completed');
      expect(updatedPickup.binStatus).toBe('collected');
      expect(updatedPickup.completedDate).toBeTruthy();
      
      // Verify bin was updated
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.currentLevel).toBe(0);
      expect(updatedBin.lastEmptied).toBeTruthy();
      
      // Verify notification was sent
      const notifications = await Notification.find({ recipient: resident._id });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should complete pickup with empty status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Check bin',
        quantity: { value: 1, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'scheduled',
        assignedCollector: collector._id
      });

      req.user = { _id: collector._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        binStatus: 'empty',
        collectorNotes: 'Bin was empty'
      };

      await completePickup(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedPickup = await PickupRequest.findById(pickup._id);
      expect(updatedPickup.status).toBe('completed');
      expect(updatedPickup.binStatus).toBe('empty');
    });

    it('should complete pickup with damaged status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const admin = await createTestUser('admin');
      const bin = await createTestBin(resident, operator);
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Check damaged bin',
        quantity: { value: 1, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'scheduled',
        assignedCollector: collector._id
      });

      req.user = { _id: collector._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        binStatus: 'damaged',
        collectorNotes: 'Bin is damaged, needs replacement'
      };

      await completePickup(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedPickup = await PickupRequest.findById(pickup._id);
      expect(updatedPickup.binStatus).toBe('damaged');
      
      // Verify bin status was updated to maintenance
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.status).toBe('maintenance');
      expect(updatedBin.maintenanceHistory.length).toBeGreaterThan(0);
      
      // Verify notifications were sent to resident and admin
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid bin status', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'scheduled',
        assignedCollector: collector._id
      });

      req.user = { _id: collector._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        binStatus: 'invalid-status'
      };

      await completePickup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'scheduled',
        assignedCollector: collector1._id
      });

      req.user = { _id: collector2._id };
      req.params = { id: pickup._id.toString() };
      req.body = {
        binStatus: 'collected'
      };

      await completePickup(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('cancelPickupRequest', () => {
    it('should cancel pickup successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'pending'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: pickup._id.toString() };
      req.body = {
        reason: 'No longer needed'
      };

      await cancelPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedPickup = await PickupRequest.findById(pickup._id);
      expect(updatedPickup.status).toBe('cancelled');
      expect(updatedPickup.cancellationReason).toBe('No longer needed');
    });

    it('should not cancel completed pickup', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-11-01'),
        timeSlot: 'morning',
        status: 'completed'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: pickup._id.toString() };
      req.body = {
        reason: 'Changed my mind'
      };

      await cancelPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPickupStats', () => {
    it('should return pickup statistics', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      // Create pickups with different statuses
      await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Pending',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        status: 'pending'
      });
      
      await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'hazardous',
        description: 'Completed',
        quantity: { value: 2, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-11-15'),
        timeSlot: 'afternoon',
        status: 'completed',
        estimatedCost: 100,
        actualCost: 95
      });

      req.user = { _id: admin._id, role: 'admin' };

      await getPickupStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('PickupRequest Model Tests', () => {
    it('should auto-generate request ID', async () => {
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      expect(pickup.requestId).toBeDefined();
      expect(pickup.requestId).toMatch(/^PKP/);
    });

    it('should have default status of pending', async () => {
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      expect(pickup.status).toBe('pending');
    });

    it('should have default priority of normal', async () => {
      const resident = await createTestUser('resident');
      
      const pickup = await PickupRequest.create({
        requestedBy: resident._id,
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: 5, unit: 'items' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '123 Test St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      });

      expect(pickup.priority).toBe('normal');
    });
  });

  describe('Additional Pickup Coverage Tests', () => {
    it('should handle pickup request with photos', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'hazardous',
        description: 'Chemical waste',
        quantity: { value: 2, unit: 'containers' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '456 Test Ave'
        },
        preferredDate: new Date('2025-12-15'),
        timeSlot: 'afternoon',
        photos: ['photo1.jpg', 'photo2.jpg']
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle urgent pickup requests', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'hazardous',
        description: 'Urgent medical waste',
        quantity: { value: 1, unit: 'box' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '789 Urgent St'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning',
        priority: 'urgent'
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should filter pickups by waste type', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');

      await createTestPickup(resident, 'bulk');
      await createTestPickup(resident, 'hazardous');

      req.user = { _id: operator._id, role: 'operator' };
      req.query = { wasteType: 'bulk' };

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter pickups by date range', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');

      await createTestPickup(resident);

      req.user = { _id: operator._id, role: 'operator' };
      req.query = {
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString()
      };

      await getPickupRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle pickup cancellation by resident', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const pickup = await createTestPickup(resident);

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: pickup._id.toString() };
      req.body = {
        status: 'cancelled',
        cancellationReason: 'No longer needed'
      };

      await updatePickupStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should track collector location during pickup', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const pickup = await createTestPickup(resident);

      pickup.assignedCollector = collector._id;
      pickup.status = 'assigned';
      await pickup.save();

      req.user = { _id: collector._id, role: 'collector' };
      req.params = { id: pickup._id.toString() };
      req.body = {
        status: 'in-progress',
        currentLocation: {
          type: 'Point',
          coordinates: [80.7700, 7.8700]
        }
      };

      await updatePickupStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should calculate pickup statistics by area', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      const pickup1 = await createTestPickup(resident1);
      pickup1.pickupLocation.address = 'Colombo Area';
      await pickup1.save();

      const pickup2 = await createTestPickup(resident2);
      pickup2.pickupLocation.address = 'Kandy Area';
      await pickup2.save();

      req.query = { groupBy: 'area' };

      await getPickupStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle multiple collector assignments', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      
      const pickup = await createTestPickup(resident);

      req.user = { _id: operator._id };
      req.params = { id: pickup._id.toString() };
      req.body = { collectorId: collector1._id.toString() };

      await assignCollector(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      // Reassign
      req.body = { collectorId: collector2._id.toString() };
      await assignCollector(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle pickup request with special instructions', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'e-waste',
        description: 'Old electronics',
        quantity: { value: 3, unit: 'boxes' },
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: '321 Special St'
        },
        preferredDate: new Date('2025-12-20'),
        timeSlot: 'evening',
        specialInstructions: 'Please call before arrival'
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should validate pickup quantity', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      req.user = { _id: resident._id };
      req.body = {
        wasteType: 'bulk',
        description: 'Test',
        quantity: { value: -5, unit: 'items' }, // Invalid negative quantity
        pickupLocation: {
          coordinates: [80.7718, 7.8731],
          address: 'Test'
        },
        preferredDate: new Date('2025-12-01'),
        timeSlot: 'morning'
      };

      await createPickupRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
