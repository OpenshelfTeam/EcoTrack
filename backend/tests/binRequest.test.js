import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import BinRequest from '../models/BinRequest.model.js';
import User from '../models/User.model.js';
import SmartBin from '../models/SmartBin.model.js';
import Delivery from '../models/Delivery.model.js';
import Notification from '../models/Notification.model.js';
import Payment from '../models/Payment.model.js';
import binRequestRoutes from '../routes/binRequest.routes.js';
import {
  createBinRequest,
  approveAndAssignRequest,
  getRequests,
  cancelBinRequest,
  confirmBinReceipt
} from '../controllers/binRequest.controller.js';

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

// Helper function to create mock request and response objects
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

// Helper function to create test users
const createTestUser = async (role = 'resident') => {
  return await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    role
  });
};

describe('Bin Request Controller Tests', () => {
  
  describe('createBinRequest', () => {
    it('should create a new bin request successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      req.user = { _id: resident._id };
      req.body = {
        requestedBinType: 'recyclable',
        preferredDeliveryDate: new Date('2025-12-01'),
        notes: 'Test notes',
        address: '123 Test St',
        street: 'Test Street',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        coordinates: { lat: 7.8731, lng: 80.7718 }
      };

      await createBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            requestedBinType: 'recyclable',
            status: 'pending'
          })
        })
      );

      // Verify bin request was created in database
      const binRequests = await BinRequest.find();
      expect(binRequests).toHaveLength(1);
      expect(binRequests[0].requestedBinType).toBe('recyclable');
      
      // Verify notification was created
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 if resident not found', async () => {
      const { req, res } = mockReqRes();
      req.user = { _id: new mongoose.Types.ObjectId() };
      req.body = {
        requestedBinType: 'general',
        address: '123 Test St'
      };

      await createBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resident not found'
        })
      );
    });

    it('should handle different bin types', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      
      const binTypes = ['general', 'recyclable', 'organic', 'hazardous'];
      
      for (const binType of binTypes) {
        req.body = {
          requestedBinType: binType,
          address: '123 Test St',
          coordinates: { lat: 7.8731, lng: 80.7718 }
        };
        
        const { req: newReq, res: newRes } = mockReqRes();
        newReq.user = req.user;
        newReq.body = req.body;
        
        await createBinRequest(newReq, newRes);
        
        expect(newRes.status).toHaveBeenCalledWith(201);
      }
      
      const binRequests = await BinRequest.find();
      expect(binRequests).toHaveLength(binTypes.length);
    });

    it('should handle errors gracefully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.body = {
        requestedBinType: 'invalid-type', // Invalid type
        address: '123 Test St'
      };

      await createBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe('approveAndAssignRequest', () => {
    it('should approve a pending bin request and create delivery', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      // Create a pending bin request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        coordinates: { lat: 7.8731, lng: 80.7718 },
        status: 'pending'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = {
        deliveryDate: new Date('2025-12-01')
      };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            request: expect.any(Object),
            delivery: expect.any(Object)
          })
        })
      );

      // Verify request status was updated
      const updatedRequest = await BinRequest.findById(binRequest._id);
      expect(updatedRequest.status).toBe('approved');
      
      // Verify delivery was created
      const deliveries = await Delivery.find();
      expect(deliveries).toHaveLength(1);
      
      // Verify notification was created
      const notifications = await Notification.find({ recipient: resident._id });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 if bin request not found', async () => {
      const { req, res } = mockReqRes();
      
      req.params = { requestId: new mongoose.Types.ObjectId().toString() };
      req.body = { deliveryDate: new Date('2025-12-01') };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bin request not found'
        })
      );
    });

    it('should return 400 if request is not pending', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      // Create an already approved request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'approved'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = { deliveryDate: new Date('2025-12-01') };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already')
        })
      );
    });

    it('should handle approval with payment verification', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      // Create a payment with all required fields including transactionId
      await Payment.create({
        transactionId: `PAY${Date.now()}TEST`,
        user: resident._id,
        amount: 100,
        status: 'completed',
        paymentType: 'installation-fee',
        paymentMethod: 'credit-card',
        invoice: {
          invoiceNumber: `INV${Date.now()}TEST`,
          invoiceDate: new Date()
        }
      });
      
      // Create a pending bin request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        coordinates: { lat: 7.8731, lng: 80.7718 },
        status: 'pending'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = { deliveryDate: new Date('2025-12-01') };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedRequest = await BinRequest.findById(binRequest._id);
      expect(updatedRequest.paymentVerified).toBe(true);
    });

    it('should assign collector when approving bin request', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      
      // Create a pending bin request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        coordinates: { lat: 7.8731, lng: 80.7718 },
        status: 'pending'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = {
        deliveryDate: new Date('2025-12-01'),
        collectorId: collector._id.toString()
      };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify delivery has assigned collector
      const delivery = await Delivery.findOne({ resident: resident._id });
      expect(delivery.deliveryTeam.toString()).toBe(collector._id.toString());

      // Verify notification was created for collector
      const collectorNotifications = await Notification.find({ recipient: collector._id });
      expect(collectorNotifications.length).toBeGreaterThan(0);
      expect(collectorNotifications[0].title).toContain('Delivery Assignment');
    });

    it('should return 404 if collector not found', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'pending'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = {
        deliveryDate: new Date('2025-12-01'),
        collectorId: new mongoose.Types.ObjectId().toString()
      };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Collector not found'
        })
      );
    });

    it('should return 400 if assigned user is not a collector', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'pending'
      });

      req.params = { requestId: binRequest._id.toString() };
      req.body = {
        deliveryDate: new Date('2025-12-01'),
        collectorId: operator._id.toString()
      };

      await approveAndAssignRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Assigned user must be a collector'
        })
      );
    });
  });

  describe('getRequests', () => {
    it('should get all bin requests for operator/admin', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create multiple bin requests
      await BinRequest.create({
        resident: resident1._id,
        requestedBinType: 'general',
        address: '123 Test St'
      });
      
      await BinRequest.create({
        resident: resident2._id,
        requestedBinType: 'recyclable',
        address: '456 Test Ave'
      });

      req.user = { _id: operator._id, role: 'operator' };
      req.query = {};

      await getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: expect.any(Array)
        })
      );
    });

    it('should get only own bin requests for resident', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create bin requests for both residents
      await BinRequest.create({
        resident: resident1._id,
        requestedBinType: 'general',
        address: '123 Test St'
      });
      
      await BinRequest.create({
        resident: resident2._id,
        requestedBinType: 'recyclable',
        address: '456 Test Ave'
      });

      req.user = { _id: resident1._id, role: 'resident' };
      req.query = {};

      await getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].resident._id.toString()).toBe(resident1._id.toString());
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      // Create multiple bin requests
      for (let i = 0; i < 25; i++) {
        await BinRequest.create({
          resident: resident._id,
          requestedBinType: 'general',
          address: `${i} Test St`
        });
      }

      req.user = { _id: operator._id, role: 'operator' };
      req.query = { page: 1, limit: 10 };

      await getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(10);
    });
  });

  describe('cancelBinRequest', () => {
    it('should cancel a pending bin request', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      // Create a pending bin request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        status: 'pending'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await cancelBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('cancelled successfully')
        })
      );

      // Verify request status was updated
      const updatedRequest = await BinRequest.findById(binRequest._id);
      expect(updatedRequest.status).toBe('cancelled');
      
      // Verify notification was created for operators
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 if bin request not found', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: new mongoose.Types.ObjectId().toString() };

      await cancelBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bin request not found'
        })
      );
    });

    it('should return 403 if resident tries to cancel another resident\'s request', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create bin request for resident1
      const binRequest = await BinRequest.create({
        resident: resident1._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'pending'
      });

      // Try to cancel with resident2
      req.user = { _id: resident2._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await cancelBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Not authorized')
        })
      );
    });

    it('should return 400 if request is not pending', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      // Create an approved request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'approved'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await cancelBinRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot cancel')
        })
      );
    });
  });

  describe('confirmBinReceipt', () => {
    it('should return success if bin already delivered', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      // Create a smart bin with proper structure
      const smartBin = await SmartBin.create({
        binId: 'BIN001',
        binType: 'recyclable',
        createdBy: operator._id,
        assignedTo: resident._id,
        location: {
          type: 'Point',
          coordinates: [80.7718, 7.8731], // [longitude, latitude]
          address: '123 Test St'
        },
        status: 'active',
        capacity: 100
      });
      
      // Create a delivered request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        status: 'delivered',
        assignedBin: smartBin._id
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await confirmBinReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('already been delivered')
        })
      );
    });

    it('should return 400 if bin is still being delivered', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      // Create an approved request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        status: 'approved'
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await confirmBinReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('still being delivered')
        })
      );
    });

    it('should return 404 if bin request not found', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id, role: 'resident' };
      req.params = { requestId: new mongoose.Types.ObjectId().toString() };

      await confirmBinReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bin request not found'
        })
      );
    });

    it('should return 403 if resident tries to confirm another resident\'s request', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create bin request for resident1
      const binRequest = await BinRequest.create({
        resident: resident1._id,
        requestedBinType: 'general',
        address: '123 Test St',
        status: 'approved'
      });

      // Try to confirm with resident2
      req.user = { _id: resident2._id, role: 'resident' };
      req.params = { requestId: binRequest._id.toString() };

      await confirmBinReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Not authorized')
        })
      );
    });
  });

  describe('BinRequest Model', () => {
    it('should auto-generate requestId on creation', async () => {
      const resident = await createTestUser('resident');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St'
      });

      expect(binRequest.requestId).toBeDefined();
      expect(binRequest.requestId).toMatch(/^BR\d+/);
    });

    it('should have default status of pending', async () => {
      const resident = await createTestUser('resident');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St'
      });

      expect(binRequest.status).toBe('pending');
    });

    it('should accept valid bin types', async () => {
      const resident = await createTestUser('resident');
      const validTypes = ['general', 'recyclable', 'organic', 'hazardous'];
      
      for (const type of validTypes) {
        const binRequest = await BinRequest.create({
          resident: resident._id,
          requestedBinType: type,
          address: '123 Test St'
        });
        
        expect(binRequest.requestedBinType).toBe(type);
      }
    });

    it('should store coordinates correctly', async () => {
      const resident = await createTestUser('resident');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '123 Test St',
        coordinates: { lat: 7.8731, lng: 80.7718 }
      });

      expect(binRequest.coordinates.lat).toBe(7.8731);
      expect(binRequest.coordinates.lng).toBe(80.7718);
    });
  });
});
