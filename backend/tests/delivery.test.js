import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import Delivery from '../models/Delivery.model.js';
import SmartBin from '../models/SmartBin.model.js';
import User from '../models/User.model.js';
import BinRequest from '../models/BinRequest.model.js';
import Notification from '../models/Notification.model.js';
import deliveryRoutes from '../routes/delivery.routes.js';
import {
  createDelivery,
  updateDeliveryStatus,
  confirmReceipt,
  getDeliveries
} from '../controllers/delivery.controller.js';

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
    role
  });
};

const createTestBin = async (resident, operator) => {
  return await SmartBin.create({
    binType: 'general',
    capacity: 100,
    currentLevel: 0,
    status: 'available',
    assignedTo: resident?._id || null,
    createdBy: operator._id,
    location: {
      type: 'Point',
      coordinates: [80.7718, 7.8731],
      address: '123 Test Street'
    }
  });
};

describe('Delivery Controller Tests', () => {
  
  describe('createDelivery - Positive Cases', () => {
    it('should create delivery successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: operator._id };
      req.body = {
        binId: bin._id.toString(),
        residentId: resident._id.toString(),
        scheduledDate: new Date('2025-12-01')
      };

      await createDelivery(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'scheduled'
          })
        })
      );

      // Verify bin status was updated
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.status).toBe('in-transit');
      
      // Verify delivery was created with tracking number
      const delivery = await Delivery.findOne();
      expect(delivery.trackingNumber).toBeDefined();
      expect(delivery.deliveryId).toBeDefined();
    });

    it('should create delivery without explicit residentId', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: resident._id };
      req.body = {
        binId: bin._id.toString(),
        scheduledDate: new Date('2025-12-01')
      };

      await createDelivery(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      
      const delivery = await Delivery.findOne();
      expect(delivery.resident.toString()).toBe(resident._id.toString());
    });

    it('should auto-generate unique delivery and tracking IDs', async () => {
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      const deliveryIds = new Set();
      const trackingNumbers = new Set();
      
      for (let i = 0; i < 3; i++) {
        const bin = await createTestBin(resident, operator);
        const { req, res } = mockReqRes();
        
        req.user = { _id: operator._id };
        req.body = {
          binId: bin._id.toString(),
          residentId: resident._id.toString()
        };

        await createDelivery(req, res);
        
        const delivery = await Delivery.findOne().sort('-createdAt');
        deliveryIds.add(delivery.deliveryId);
        trackingNumbers.add(delivery.trackingNumber);
      }
      
      expect(deliveryIds.size).toBe(3);
      expect(trackingNumbers.size).toBe(3);
    });
  });

  describe('createDelivery - Negative & Edge Cases', () => {
    it('should return 404 for non-existent bin', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      
      req.user = { _id: operator._id };
      req.body = {
        binId: new mongoose.Types.ObjectId().toString(),
        residentId: resident._id.toString()
      };

      await createDelivery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bin not found'
        })
      );
    });

    it('should return 404 for non-existent resident', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: operator._id };
      req.body = {
        binId: bin._id.toString(),
        residentId: new mongoose.Types.ObjectId().toString()
      };

      await createDelivery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resident not found'
        })
      );
    });
  });

  describe('updateDeliveryStatus - Status Updates', () => {
    it('should update delivery status to in-transit', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident, operator);
      
      const delivery = await Delivery.create({
        bin: bin._id,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'scheduled'
      });

      req.user = { _id: collector._id };
      req.params = { id: delivery._id.toString() };
      req.body = {
        status: 'in-transit',
        note: 'Out for delivery'
      };

      await updateDeliveryStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedDelivery = await Delivery.findById(delivery._id);
      expect(updatedDelivery.status).toBe('in-transit');
      expect(updatedDelivery.attempts).toHaveLength(1);
    });

    it('should create smart bin when status is delivered', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      
      // Create bin request first
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'recyclable',
        address: '123 Test St',
        coordinates: { lat: 7.8731, lng: 80.7718 },
        status: 'approved'
      });
      
      const delivery = await Delivery.create({
        bin: null,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'in-transit'
      });
      
      // Link delivery to bin request
      binRequest.deliveryId = delivery._id;
      await binRequest.save();

      req.user = { _id: collector._id };
      req.params = { id: delivery._id.toString() };
      req.body = {
        status: 'delivered',
        note: 'Delivered successfully'
      };

      await updateDeliveryStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify smart bin was created
      const smartBin = await SmartBin.findOne({ assignedTo: resident._id });
      expect(smartBin).toBeTruthy();
      expect(smartBin.binType).toBe('recyclable');
      expect(smartBin.status).toBe('active');
      
      // Verify bin request was updated
      const updatedRequest = await BinRequest.findById(binRequest._id);
      expect(updatedRequest.status).toBe('delivered');
      expect(updatedRequest.assignedBin).toBeTruthy();
      
      // Verify notification was created
      const notifications = await Notification.find({ recipient: resident._id });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should handle delivery with valid coordinates', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'organic',
        address: '456 Test Ave',
        coordinates: { lat: 6.9271, lng: 79.8612 },
        status: 'approved'
      });
      
      const delivery = await Delivery.create({
        bin: null,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'in-transit'
      });
      
      binRequest.deliveryId = delivery._id;
      await binRequest.save();

      req.user = { _id: collector._id };
      req.params = { id: delivery._id.toString() };
      req.body = {
        status: 'delivered'
      };

      await updateDeliveryStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const smartBin = await SmartBin.findOne({ assignedTo: resident._id });
      expect(smartBin.location.coordinates).toEqual([79.8612, 6.9271]);
    });

    it('should handle delivery with invalid coordinates', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const collector = await createTestUser('collector');
      
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'general',
        address: '789 Test Rd',
        coordinates: { lat: null, lng: null }, // Invalid - will fallback to default
        status: 'approved'
      });
      
      const delivery = await Delivery.create({
        bin: null,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'in-transit'
      });
      
      binRequest.deliveryId = delivery._id;
      await binRequest.save();

      req.user = { _id: collector._id };
      req.params = { id: delivery._id.toString() };
      req.body = {
        status: 'delivered'
      };

      await updateDeliveryStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Should default to [0, 0]
      const smartBin = await SmartBin.findOne({ assignedTo: resident._id });
      expect(smartBin.location.coordinates).toEqual([0, 0]);
    });

    it('should return 404 for non-existent delivery', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      
      req.user = { _id: collector._id };
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = {
        status: 'delivered'
      };

      await updateDeliveryStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('confirmReceipt', () => {
    it('should confirm delivery receipt successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      const delivery = await Delivery.create({
        bin: bin._id,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'in-transit'
      });

      req.user = { _id: resident._id };
      req.params = { id: delivery._id.toString() };

      await confirmReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedDelivery = await Delivery.findById(delivery._id);
      expect(updatedDelivery.status).toBe('delivered');
      expect(updatedDelivery.confirmedAt).toBeTruthy();
      
      // Verify bin status was updated
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.status).toBe('active');
      expect(updatedBin.activationDate).toBeTruthy();
    });

    it('should handle delivery without linked bin', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const delivery = await Delivery.create({
        bin: null,
        resident: resident._id,
        scheduledDate: new Date(),
        status: 'in-transit'
      });

      req.user = { _id: resident._id };
      req.params = { id: delivery._id.toString() };

      await confirmReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedDelivery = await Delivery.findById(delivery._id);
      expect(updatedDelivery.status).toBe('delivered');
    });

    it('should return 404 for non-existent delivery', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await confirmReceipt(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getDeliveries', () => {
    it('should get all deliveries for operator', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      const bin1 = await createTestBin(resident1, operator);
      const bin2 = await createTestBin(resident2, operator);
      
      await Delivery.create({
        bin: bin1._id,
        resident: resident1._id,
        scheduledDate: new Date()
      });
      
      await Delivery.create({
        bin: bin2._id,
        resident: resident2._id,
        scheduledDate: new Date()
      });

      req.user = { _id: operator._id, role: 'operator' };

      await getDeliveries(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should get only own deliveries for resident', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      const bin1 = await createTestBin(resident1, operator);
      const bin2 = await createTestBin(resident2, operator);
      
      await Delivery.create({
        bin: bin1._id,
        resident: resident1._id,
        scheduledDate: new Date()
      });
      
      await Delivery.create({
        bin: bin2._id,
        resident: resident2._id,
        scheduledDate: new Date()
      });

      req.user = { _id: resident1._id, role: 'resident' };

      await getDeliveries(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should return empty array when no deliveries exist', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');

      req.user = { _id: resident._id, role: 'resident' };

      await getDeliveries(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(0);
      expect(response.data).toEqual([]);
    });
  });

  describe('Delivery Model Tests', () => {
    it('should have default status of scheduled', async () => {
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      const delivery = await Delivery.create({
        bin: bin._id,
        resident: resident._id
      });

      expect(delivery.status).toBe('scheduled');
    });

    it('should auto-generate delivery ID and tracking number', async () => {
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      const delivery = await Delivery.create({
        bin: bin._id,
        resident: resident._id
      });

      expect(delivery.deliveryId).toBeDefined();
      expect(delivery.deliveryId).toMatch(/^DLV/);
      expect(delivery.trackingNumber).toBeDefined();
      expect(delivery.trackingNumber).toMatch(/^TRK/);
    });

    it('should store delivery attempts', async () => {
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      const bin = await createTestBin(resident, operator);
      
      const delivery = await Delivery.create({
        bin: bin._id,
        resident: resident._id,
        status: 'scheduled',
        attempts: [{
          date: new Date(),
          note: 'First delivery attempt',
          performedBy: collector._id
        }]
      });

      expect(delivery.attempts).toHaveLength(1);
      expect(delivery.attempts[0].note).toBe('First delivery attempt');
    });
  });

  describe('Integration Tests - Full Delivery Flow', () => {
    it('should complete full delivery flow from creation to confirmation', async () => {
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      
      // Create bin request
      const binRequest = await BinRequest.create({
        resident: resident._id,
        requestedBinType: 'hazardous',
        address: '321 Test Blvd',
        coordinates: { lat: 6.0535, lng: 80.2210 },
        status: 'approved'
      });
      
      // Create delivery
      const { req: createReq, res: createRes } = mockReqRes();
      createReq.user = { _id: operator._id };
      createReq.body = {
        binId: null,
        residentId: resident._id.toString(),
        scheduledDate: new Date('2025-12-15')
      };

      const delivery = await Delivery.create({
        bin: null,
        resident: resident._id,
        scheduledDate: new Date('2025-12-15'),
        status: 'scheduled'
      });
      
      binRequest.deliveryId = delivery._id;
      await binRequest.save();
      
      // Update to in-transit
      const { req: transitReq, res: transitRes } = mockReqRes();
      transitReq.user = { _id: collector._id };
      transitReq.params = { id: delivery._id.toString() };
      transitReq.body = { status: 'in-transit' };
      
      await updateDeliveryStatus(transitReq, transitRes);
      expect(transitRes.status).toHaveBeenCalledWith(200);
      
      // Update to delivered
      const { req: deliveredReq, res: deliveredRes } = mockReqRes();
      deliveredReq.user = { _id: collector._id };
      deliveredReq.params = { id: delivery._id.toString() };
      deliveredReq.body = { status: 'delivered' };
      
      await updateDeliveryStatus(deliveredReq, deliveredRes);
      expect(deliveredRes.status).toHaveBeenCalledWith(200);
      
      // Verify final state
      const finalDelivery = await Delivery.findById(delivery._id);
      expect(finalDelivery.status).toBe('delivered');
      
      const finalBinRequest = await BinRequest.findById(binRequest._id);
      expect(finalBinRequest.status).toBe('delivered');
      expect(finalBinRequest.assignedBin).toBeTruthy();
      
      const smartBin = await SmartBin.findById(finalBinRequest.assignedBin);
      expect(smartBin.binType).toBe('hazardous');
      expect(smartBin.status).toBe('active');
    });
  });
});
