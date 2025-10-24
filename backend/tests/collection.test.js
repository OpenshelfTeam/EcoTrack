import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData } from './fixtures.js';
import CollectionRecord from '../models/CollectionRecord.model.js';
import SmartBin from '../models/SmartBin.model.js';

let app;

describe('Collection Controller', () => {
  beforeAll(async () => {
    await startTestDB();
    app = getTestApp();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/collections', () => {
    test('Collector can create collection record', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-TEST-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 85,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test Location'
        },
        createdBy: operator.user._id
      });

      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${collector.token}`)
        .send({
          bin: bin._id,
          wasteType: 'general',
          weightCollected: 25.5,
          collectionDate: new Date(),
          collectorNotes: 'Regular collection'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.weightCollected).toBe(25.5);
      expect(response.body.data.collectedBy).toBe(collector.user._id.toString());
    });

    test('Validate required fields', async () => {
      const collector = await createTestUser('collector');

      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${collector.token}`)
        .send({
          wasteType: 'general'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/collections', () => {
    test('Get all collection records', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'general',
        weightCollected: 20,
        collectionDate: new Date()
      });

      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Filter by waste type', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'recycling',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'recycling',
        weightCollected: 15,
        collectionDate: new Date()
      });

      const response = await request(app)
        .get('/api/collections?wasteType=recycling')
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(c => c.wasteType === 'recycling')).toBe(true);
    });

    test('Pagination works', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      for (let i = 0; i < 15; i++) {
        await CollectionRecord.create({
          bin: bin._id,
          collectedBy: collector.user._id,
          wasteType: 'general',
          weightCollected: 10 + i,
          collectionDate: new Date()
        });
      }

      const response = await request(app)
        .get('/api/collections?page=1&limit=10')
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pages).toBe(2);
    });
  });

  describe('GET /api/collections/:id', () => {
    test('Get single collection record', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      const collection = await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'general',
        weightCollected: 25,
        collectionDate: new Date()
      });

      const response = await request(app)
        .get(`/api/collections/${collection._id}`)
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(collection._id.toString());
    });

    test('Return 404 for non-existent collection', async () => {
      const collector = await createTestUser('collector');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/collections/${fakeId}`)
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/collections/:id', () => {
    test('Update collection record', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      const collection = await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'general',
        weightCollected: 20,
        collectionDate: new Date()
      });

      const response = await request(app)
        .put(`/api/collections/${collection._id}`)
        .set('Authorization', `Bearer ${collector.token}`)
        .send({
          weightCollected: 25.5,
          collectorNotes: 'Updated weight'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.weightCollected).toBe(25.5);
    });
  });

  describe('DELETE /api/collections/:id', () => {
    test('Admin can delete collection', async () => {
      const admin = await createTestUser('admin');
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      const collection = await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'general',
        weightCollected: 20,
        collectionDate: new Date()
      });

      const response = await request(app)
        .delete(`/api/collections/${collection._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      
      const deleted = await CollectionRecord.findById(collection._id);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/collections/stats/summary', () => {
    test('Get collection statistics', async () => {
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 50,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      await CollectionRecord.create({
        bin: bin._id,
        collectedBy: collector.user._id,
        wasteType: 'general',
        weightCollected: 25,
        collectionDate: new Date()
      });

      const response = await request(app)
        .get('/api/collections/stats/summary')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCollections');
      expect(response.body.data).toHaveProperty('totalWeight');
    });
  });

  describe('Edge Cases', () => {
    test('Handle very large weight values', async () => {
      const collector = await createTestUser('collector');
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        binId: 'BIN-001',
        binType: 'general',
        capacity: 100,
        currentLevel: 85,
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Test'
        },
        createdBy: operator.user._id
      });

      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${collector.token}`)
        .send({
          bin: bin._id,
          wasteType: 'general',
          weightCollected: 999.99,
          collectionDate: new Date()
        });

      expect(response.status).toBe(201);
      expect(response.body.data.weightCollected).toBe(999.99);
    });
  });
});
