import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import CollectionRecord from '../models/CollectionRecord.model.js';
import Route from '../models/Route.model.js';
import SmartBin from '../models/SmartBin.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import collectionRoutes from '../routes/collection.routes.js';
import {
  getCollectionRecords,
  getCollectionRecord,
  createCollectionRecord,
  updateCollectionRecord,
  deleteCollectionRecord,
  getCollectionStats
} from '../controllers/collection.controller.js';

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

const createTestRoute = async (collector) => {
  const uniqueId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  return await Route.create({
    routeName: `Route ${uniqueId}`,
    routeCode: `RT${uniqueId}`.toUpperCase().substring(0, 20),
    area: 'Test Area',
    assignedCollector: collector._id,
    scheduledDate: new Date(),
    status: 'in-progress'
  });
};

const createTestBin = async (resident, operator) => {
  return await SmartBin.create({
    binType: 'general',
    capacity: 100,
    currentLevel: 50,
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

describe('Collection Controller Tests', () => {
  
  describe('createCollectionRecord - Positive Cases', () => {
    it('should create collection record successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: collector._id, firstName: 'Test', lastName: 'Collector' };
      req.body = {
        route: route._id.toString(),
        bin: bin._id.toString(),
        wasteWeight: 15.5,
        wasteType: 'general',
        binLevelBefore: 50,
        binLevelAfter: 0,
        status: 'collected',
        notes: 'Collection completed successfully'
      };

      await createCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            wasteWeight: 15.5,
            status: 'collected'
          })
        })
      );

      // Verify bin was updated
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.currentLevel).toBe(0);
      expect(updatedBin.lastEmptied).toBeTruthy();
      
      // Verify notifications were created
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should handle different waste types', async () => {
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      
      const wasteTypes = ['general', 'recyclable', 'organic', 'hazardous'];
      
      for (const wasteType of wasteTypes) {
        const bin = await createTestBin(resident, operator);
        const { req, res } = mockReqRes();
        
        req.user = { _id: collector._id, firstName: 'Test', lastName: 'Collector' };
        req.body = {
          route: route._id.toString(),
          bin: bin._id.toString(),
          wasteWeight: 10,
          wasteType,
          status: 'collected'
        };

        await createCollectionRecord(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
      }
      
      const records = await CollectionRecord.find();
      expect(records).toHaveLength(wasteTypes.length);
    });

    it('should handle exception reporting', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: collector._id, firstName: 'Test', lastName: 'Collector' };
      req.body = {
        route: route._id.toString(),
        bin: bin._id.toString(),
        status: 'exception',
        exceptionReported: true,
        exceptionReason: 'Bin damaged',
        exceptionDescription: 'Bin lid is broken'
      };

      await createCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      
      const record = await CollectionRecord.findOne();
      expect(record.exception.reported).toBe(true);
      expect(record.exception.reason).toBe('Bin damaged');
      
      // Verify bin status updated
      const updatedBin = await SmartBin.findById(bin._id);
      expect(updatedBin.status).toBe('maintenance-required');
    });

    it('should update route collectedBins count', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: collector._id, firstName: 'Test', lastName: 'Collector' };
      req.body = {
        route: route._id.toString(),
        bin: bin._id.toString(),
        status: 'collected'
      };

      await createCollectionRecord(req, res);

      const updatedRoute = await Route.findById(route._id);
      expect(updatedRoute.collectedBins).toBe(1);
    });
  });

  describe('createCollectionRecord - Negative & Edge Cases', () => {
    it('should return 404 for non-existent route', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const bin = await createTestBin(resident, operator);
      
      req.user = { _id: collector._id };
      req.body = {
        route: new mongoose.Types.ObjectId().toString(),
        bin: bin._id.toString(),
        status: 'collected'
      };

      await createCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Route not found'
        })
      );
    });

    it('should return 404 for non-existent bin', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const route = await createTestRoute(collector);
      
      req.user = { _id: collector._id };
      req.body = {
        route: route._id.toString(),
        bin: new mongoose.Types.ObjectId().toString(),
        status: 'collected'
      };

      await createCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bin not found'
        })
      );
    });

    it('should handle empty bin scenario', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      // Set bin level to 0
      bin.currentLevel = 0;
      await bin.save();
      
      req.user = { _id: collector._id, firstName: 'Test', lastName: 'Collector' };
      req.body = {
        route: route._id.toString(),
        bin: bin._id.toString(),
        wasteWeight: 0,
        binLevelBefore: 0,
        binLevelAfter: 0,
        status: 'empty'
      };

      await createCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      
      const record = await CollectionRecord.findOne();
      expect(record.wasteWeight).toBe(0);
    });
  });

  describe('getCollectionRecords - Filtering & Pagination', () => {
    it('should get all collection records for authority', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        status: 'collected'
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = {};

      await getCollectionRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            records: expect.any(Array)
          })
        })
      );
    });

    it('should get only own collections for collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route1 = await createTestRoute(collector1);
      const route2 = await createTestRoute(collector2);
      const bin1 = await createTestBin(resident, operator);
      const bin2 = await createTestBin(resident, operator);
      
      await CollectionRecord.create({
        route: route1._id,
        bin: bin1._id,
        collector: collector1._id,
        resident: resident._id,
        status: 'collected'
      });
      
      await CollectionRecord.create({
        route: route2._id,
        bin: bin2._id,
        collector: collector2._id,
        resident: resident._id,
        status: 'collected'
      });

      req.user = { _id: collector1._id, role: 'collector' };
      req.query = {};

      await getCollectionRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.records).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin1 = await createTestBin(resident, operator);
      const bin2 = await createTestBin(resident, operator);
      
      await CollectionRecord.create({
        route: route._id,
        bin: bin1._id,
        collector: collector._id,
        resident: resident._id,
        status: 'collected'
      });
      
      await CollectionRecord.create({
        route: route._id,
        bin: bin2._id,
        collector: collector._id,
        resident: resident._id,
        status: 'exception'
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { status: 'collected' };

      await getCollectionRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.records).toHaveLength(1);
      expect(response.data.records[0].status).toBe('collected');
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      
      // Create 15 collection records
      for (let i = 0; i < 15; i++) {
        const bin = await createTestBin(resident, operator);
        await CollectionRecord.create({
          route: route._id,
          bin: bin._id,
          collector: collector._id,
          resident: resident._id,
          status: 'collected'
        });
      }

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { page: 1, limit: 10 };

      await getCollectionRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.records).toHaveLength(10);
      expect(response.data.pagination.totalItems).toBe(15);
    });
  });

  describe('getCollectionRecord - Single Record', () => {
    it('should get single collection record', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        wasteWeight: 20,
        status: 'collected'
      });

      req.user = { _id: collector._id, role: 'collector' };
      req.params = { id: record._id.toString() };

      await getCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            wasteWeight: 20
          })
        })
      );
    });

    it('should return 404 for non-existent record', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      
      req.user = { _id: collector._id, role: 'collector' };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await getCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector1);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector1._id,
        resident: resident._id,
        status: 'collected'
      });

      req.user = { _id: collector2._id, role: 'collector' };
      req.params = { id: record._id.toString() };

      await getCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateCollectionRecord', () => {
    it('should update collection record successfully', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        wasteWeight: 15,
        status: 'collected'
      });

      req.user = { _id: collector._id, role: 'collector' };
      req.params = { id: record._id.toString() };
      req.body = {
        wasteWeight: 20,
        notes: 'Updated weight measurement'
      };

      await updateCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedRecord = await CollectionRecord.findById(record._id);
      expect(updatedRecord.wasteWeight).toBe(20);
      expect(updatedRecord.notes).toBe('Updated weight measurement');
    });

    it('should return 403 for unauthorized collector', async () => {
      const { req, res } = mockReqRes();
      const collector1 = await createTestUser('collector');
      const collector2 = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector1);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector1._id,
        resident: resident._id,
        status: 'collected'
      });

      req.user = { _id: collector2._id, role: 'collector' };
      req.params = { id: record._id.toString() };
      req.body = { wasteWeight: 25 };

      await updateCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteCollectionRecord', () => {
    it('should delete collection record successfully', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        status: 'collected'
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.params = { id: record._id.toString() };

      await deleteCollectionRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const deletedRecord = await CollectionRecord.findById(record._id);
      expect(deletedRecord).toBeNull();
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection statistics', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      
      // Create multiple collections
      for (let i = 0; i < 5; i++) {
        const bin = await createTestBin(resident, operator);
        await CollectionRecord.create({
          route: route._id,
          bin: bin._id,
          collector: collector._id,
          resident: resident._id,
          wasteWeight: 10 + i,
          wasteType: i % 2 === 0 ? 'general' : 'recyclable',
          status: 'collected'
        });
      }

      req.user = { _id: collector._id, role: 'collector' };

      await getCollectionStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: expect.any(Number),
            totalWeightCollected: expect.any(Number)
          })
        })
      );
    });

    it('should return today\'s collection count', async () => {
      const { req, res } = mockReqRes();
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        collectionDate: new Date(),
        status: 'collected'
      });

      req.user = { _id: collector._id, role: 'collector' };

      await getCollectionStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.todayCollections).toBeGreaterThan(0);
    });
  });

  describe('CollectionRecord Model Tests', () => {
    it('should have default status of collected', async () => {
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id
      });

      expect(record.status).toBe('collected');
    });

    it('should store geospatial location data', async () => {
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');
      const operator = await createTestUser('operator');
      const route = await createTestRoute(collector);
      const bin = await createTestBin(resident, operator);
      
      const record = await CollectionRecord.create({
        route: route._id,
        bin: bin._id,
        collector: collector._id,
        resident: resident._id,
        location: {
          type: 'Point',
          coordinates: [80.7718, 7.8731]
        }
      });

      expect(record.location.coordinates).toEqual([80.7718, 7.8731]);
    });
  });
});
