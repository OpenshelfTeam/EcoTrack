import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData, testSmartBinData, testCoordinates } from './fixtures.js';
import SmartBin from '../models/SmartBin.model.js';
import Payment from '../models/Payment.model.js';

let app;

describe('SmartBin Controller', () => {
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

  describe('GET /api/smart-bins', () => {
    test('Operator can list all bins', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      await SmartBin.create({
        ...testSmartBinData.general,
        assignedTo: resident.user._id,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/smart-bins')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Resident only sees assigned bins', async () => {
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create bin for resident1
      await SmartBin.create({
        ...testSmartBinData.general,
        binId: 'BIN-001',
        assignedTo: resident1.user._id,
        createdBy: operator.user._id
      });
      
      // Create bin for resident2
      await SmartBin.create({
        ...testSmartBinData.recycling,
        binId: 'BIN-002',
        assignedTo: resident2.user._id,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/smart-bins')
        .set('Authorization', `Bearer ${resident1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].assignedTo._id).toBe(resident1.user._id.toString());
    });

    test('Filter by status', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({
        ...testSmartBinData.general,
        binId: 'BIN-ACTIVE',
        status: 'active',
        createdBy: operator.user._id
      });
      
      await SmartBin.create({
        ...testSmartBinData.recycling,
        binId: 'BIN-MAINTENANCE',
        status: 'maintenance',
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/smart-bins?status=active')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.status === 'active')).toBe(true);
    });

    test('Filter by multiple statuses', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', status: 'active', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', status: 'assigned', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.compost, binId: 'B3', status: 'maintenance', createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins?status=active,assigned')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => ['active', 'assigned'].includes(b.status))).toBe(true);
    });

    test('Filter by bin type', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins?binType=recycling')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.binType === 'recycling')).toBe(true);
    });

    test('Filter by level range', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', currentLevel: 20, createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', currentLevel: 50, createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.compost, binId: 'B3', currentLevel: 90, createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins?minLevel=40&maxLevel=95')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.currentLevel >= 40 && b.currentLevel <= 95)).toBe(true);
    });

    test('Search by binId, address, or QR code', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({
        ...testSmartBinData.general,
        binId: 'SEARCH-TEST-123',
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/smart-bins?search=SEARCH-TEST')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Map view returns all bins with coordinates', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins?view=map')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.location && b.location.coordinates)).toBe(true);
    });

    test('Pagination works correctly', async () => {
      const operator = await createTestUser('operator');
      
      for (let i = 0; i < 15; i++) {
        await SmartBin.create({
          ...testSmartBinData.general,
          binId: `BIN-${i}`,
          createdBy: operator.user._id
        });
      }

      const response = await request(app)
        .get('/api/smart-bins?page=1&limit=10')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.page).toBe(1);
      expect(response.body.total).toBe(15);
      expect(response.body.pages).toBe(2);
    });
  });

  describe('GET /api/smart-bins/:id', () => {
    test('Get single bin by ID', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        assignedTo: resident.user._id,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(bin._id.toString());
      expect(response.body.data.assignedTo).toBeDefined();
    });

    test('Return 404 for non-existent bin', async () => {
      const operator = await createTestUser('operator');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/smart-bins/${fakeId}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/smart-bins', () => {
    test('Operator can create bin', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/smart-bins')
        .set('Authorization', `Bearer ${operator.token}`)
        .send(testSmartBinData.general);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.binId).toBe(testSmartBinData.general.binId);
      expect(response.body.data.createdBy).toBe(operator.user._id.toString());
      expect(response.body.message).toContain('notifications sent');
    });

    test('Admin can create bin', async () => {
      const admin = await createTestUser('admin');

      const response = await request(app)
        .post('/api/smart-bins')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(testSmartBinData.recycling);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('CreatedBy is set automatically', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/smart-bins')
        .set('Authorization', `Bearer ${operator.token}`)
        .send(testSmartBinData.general);

      expect(response.status).toBe(201);
      expect(response.body.data.createdBy).toBe(operator.user._id.toString());
    });

    test('Validate required fields', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/smart-bins')
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ binId: 'TEST' }); // Missing required fields

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/smart-bins/:id', () => {
    test('Operator can update any bin', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ currentLevel: 75, status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.data.currentLevel).toBe(75);
      expect(response.body.data.status).toBe('active');
    });

    test('Resident can update own bin limited fields', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        assignedTo: resident.user._id,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${resident.token}`)
        .send({ currentLevel: 60 });

      expect(response.status).toBe(200);
      expect(response.body.data.currentLevel).toBe(60);
    });

    test('Resident cannot update another resident bin', async () => {
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        assignedTo: resident2.user._id,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${resident1.token}`)
        .send({ currentLevel: 60 });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('own bins');
    });

    test('Resident can only update allowed fields', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        assignedTo: resident.user._id,
        createdBy: operator.user._id,
        binType: 'general'
      });

      const response = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${resident.token}`)
        .send({ 
          currentLevel: 70,
          binType: 'recycling' // Try to change binType
        });

      expect(response.status).toBe(200);
      expect(response.body.data.currentLevel).toBe(70);
      expect(response.body.data.binType).toBe('general'); // Should not change
    });

    test('Return 404 for non-existent bin', async () => {
      const operator = await createTestUser('operator');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/smart-bins/${fakeId}`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ currentLevel: 50 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/smart-bins/:id', () => {
    test('Admin can delete bin', async () => {
      const admin = await createTestUser('admin');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: admin.user._id
      });

      const response = await request(app)
        .delete(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await SmartBin.findById(bin._id);
      expect(deleted).toBeNull();
    });

    test('Return 404 for non-existent bin', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/smart-bins/${fakeId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/smart-bins/:id/assign', () => {
    test('Assign bin to resident with payment verification', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      // Create payment for resident
      await Payment.create({
        user: resident.user._id,
        amount: 100,
        status: 'completed',
        paymentType: 'installation-fee',
        paymentDate: new Date()
      });
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id,
        status: 'available'
      });

      const response = await request(app)
        .post(`/api/smart-bins/${bin._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          userId: resident.user._id.toString(),
          deliveryDate: new Date()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bin.assignedTo._id).toBe(resident.user._id.toString());
      expect(response.body.data.bin.status).toBe('assigned');
      expect(response.body.data.delivery).toBeDefined();
    });

    test('Reject assignment without payment', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .post(`/api/smart-bins/${bin._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ userId: resident.user._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('payment');
    });

    test('Return 404 for non-existent user', async () => {
      const operator = await createTestUser('operator');
      const fakeUserId = '507f1f77bcf86cd799439011';
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .post(`/api/smart-bins/${bin._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ userId: fakeUserId });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('PATCH /api/smart-bins/:id/activate', () => {
    test('Operator can activate bin', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id,
        status: 'assigned'
      });

      const response = await request(app)
        .patch(`/api/smart-bins/${bin._id}/activate`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.activationDate).toBeDefined();
    });
  });

  describe('PATCH /api/smart-bins/:id/level', () => {
    test('Update bin level and sensor data', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .patch(`/api/smart-bins/${bin._id}/level`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          currentLevel: 85,
          batteryLevel: 75,
          temperature: 22
        });

      expect(response.status).toBe(200);
      expect(response.body.data.currentLevel).toBe(85);
      expect(response.body.data.sensorData.batteryLevel).toBe(75);
      expect(response.body.data.sensorData.temperature).toBe(22);
      expect(response.body.data.sensorData.lastUpdate).toBeDefined();
    });

    test('Return 404 for non-existent bin', async () => {
      const operator = await createTestUser('operator');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/smart-bins/${fakeId}/level`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ currentLevel: 50 });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/smart-bins/:id/maintenance', () => {
    test('Collector can add maintenance record', async () => {
      const collector = await createTestUser('collector');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: collector.user._id
      });

      const response = await request(app)
        .post(`/api/smart-bins/${bin._id}/maintenance`)
        .set('Authorization', `Bearer ${collector.token}`)
        .send({
          type: 'repair',
          description: 'Fixed sensor malfunction'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.maintenanceHistory.length).toBe(1);
      expect(response.body.data.maintenanceHistory[0].type).toBe('repair');
      expect(response.body.data.maintenanceHistory[0].description).toContain('sensor');
    });

    test('Repair sets status to active', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id,
        status: 'maintenance'
      });

      const response = await request(app)
        .post(`/api/smart-bins/${bin._id}/maintenance`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          type: 'repair',
          description: 'Fixed'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('PATCH /api/smart-bins/:id/empty', () => {
    test('Collector can empty bin', async () => {
      const collector = await createTestUser('collector');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: collector.user._id,
        currentLevel: 95
      });

      const response = await request(app)
        .patch(`/api/smart-bins/${bin._id}/empty`)
        .set('Authorization', `Bearer ${collector.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.currentLevel).toBe(0);
      expect(response.body.data.lastEmptied).toBeDefined();
    });
  });

  describe('GET /api/smart-bins/stats', () => {
    test('Get bin statistics', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', status: 'active', currentLevel: 30, createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', status: 'active', currentLevel: 85, createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.compost, binId: 'B3', status: 'maintenance', currentLevel: 50, createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins/stats')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statusCounts');
      expect(response.body.data).toHaveProperty('typeCounts');
      expect(response.body.data).toHaveProperty('fillLevels');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('avgLevel');
      expect(response.body.data).toHaveProperty('needsCollection');
    });
  });

  describe('GET /api/smart-bins/nearby', () => {
    test('Find bins near location', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({
        ...testSmartBinData.general,
        binId: 'NEARBY-1',
        location: {
          type: 'Point',
          coordinates: testCoordinates.colombo, // [79.8612, 6.9271]
          address: '123 Colombo St'
        },
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get(`/api/smart-bins/nearby?longitude=${testCoordinates.colombo[0]}&latitude=${testCoordinates.colombo[1]}&maxDistance=10000`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Require longitude and latitude', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .get('/api/smart-bins/nearby')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Longitude and latitude');
    });
  });

  describe('GET /api/smart-bins/needs-collection', () => {
    test('Get bins needing collection (>=80% full)', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', currentLevel: 85, status: 'active', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', currentLevel: 95, status: 'active', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.compost, binId: 'B3', currentLevel: 50, status: 'active', createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins/needs-collection')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.currentLevel >= 80)).toBe(true);
      expect(response.body.count).toBe(2);
    });

    test('Bins sorted by fill level descending', async () => {
      const operator = await createTestUser('operator');
      
      await SmartBin.create({ ...testSmartBinData.general, binId: 'B1', currentLevel: 85, status: 'active', createdBy: operator.user._id });
      await SmartBin.create({ ...testSmartBinData.recycling, binId: 'B2', currentLevel: 95, status: 'active', createdBy: operator.user._id });

      const response = await request(app)
        .get('/api/smart-bins/needs-collection')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].currentLevel).toBeGreaterThanOrEqual(response.body.data[1].currentLevel);
    });
  });

  describe('Edge Cases', () => {
    test('Handle boundary fill levels (0, 100)', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        currentLevel: 0,
        createdBy: operator.user._id
      });

      const response1 = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ currentLevel: 100 });

      expect(response1.status).toBe(200);
      expect(response1.body.data.currentLevel).toBe(100);

      const response2 = await request(app)
        .put(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ currentLevel: 0 });

      expect(response2.status).toBe(200);
      expect(response2.body.data.currentLevel).toBe(0);
    });

    test('Handle extreme coordinates', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/smart-bins')
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          ...testSmartBinData.general,
          binId: 'EXTREME-COORDS',
          location: {
            type: 'Point',
            coordinates: [-180, -90], // Extreme boundaries
            address: 'Edge of world'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.location.coordinates).toEqual([-180, -90]);
    });

    test('Multiple maintenance records accumulate', async () => {
      const operator = await createTestUser('operator');
      
      const bin = await SmartBin.create({
        ...testSmartBinData.general,
        createdBy: operator.user._id
      });

      await request(app)
        .post(`/api/smart-bins/${bin._id}/maintenance`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ type: 'cleaning', description: 'Regular cleaning' });

      await request(app)
        .post(`/api/smart-bins/${bin._id}/maintenance`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ type: 'repair', description: 'Sensor fix' });

      const response = await request(app)
        .get(`/api/smart-bins/${bin._id}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.maintenanceHistory.length).toBe(2);
    });
  });
});
