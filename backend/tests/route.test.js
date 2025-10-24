import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData } from './fixtures.js';
import Route from '../models/Route.model.js';

let app;

describe('Route Controller', () => {
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

  describe('POST /api/routes', () => {
    test('Operator can create route', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          routeName: 'Downtown Route',
          routeCode: 'DT-001',
          area: 'Downtown',
          startLocation: {
            type: 'Point',
            coordinates: [79.8612, 6.9271],
            address: 'Start Point'
          },
          endLocation: {
            type: 'Point',
            coordinates: [79.8712, 6.9371],
            address: 'End Point'
          },
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estimatedDuration: 120,
          frequency: 'daily'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.routeName).toBe('Downtown Route');
      expect(response.body.data.routeCode).toBe('DT-001');
    });

    test('Validate required fields', async () => {
      const operator = await createTestUser('operator');

      const response = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${operator.token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('Prevent duplicate route codes', async () => {
      const operator = await createTestUser('operator');

      // Create first route
      await Route.create({
        routeName: 'Route 1',
        routeCode: 'R-001',
        area: 'Area 1',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          routeName: 'Route 2',
          routeCode: 'R-001', // Duplicate code
          area: 'Area 2',
          startLocation: {
            type: 'Point',
            coordinates: [79.8612, 6.9271],
            address: 'Start'
          },
          endLocation: {
            type: 'Point',
            coordinates: [79.8712, 6.9371],
            address: 'End'
          },
          scheduledDate: new Date(),
          estimatedDuration: 60
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/routes', () => {
    test('List all routes', async () => {
      const operator = await createTestUser('operator');

      await Route.create({
        routeName: 'Test Route',
        routeCode: 'TR-001',
        area: 'Test Area',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 90,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/routes')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Filter by area', async () => {
      const operator = await createTestUser('operator');

      await Route.create({
        routeName: 'North Route',
        routeCode: 'N-001',
        area: 'North District',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/routes?area=North District')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(r => r.area === 'North District')).toBe(true);
    });

    test('Filter by status', async () => {
      const operator = await createTestUser('operator');

      await Route.create({
        routeName: 'Active Route',
        routeCode: 'A-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        status: 'active',
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/routes?status=active')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(r => r.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/routes/:id', () => {
    test('Get single route', async () => {
      const operator = await createTestUser('operator');

      const route = await Route.create({
        routeName: 'Single Route',
        routeCode: 'SR-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get(`/api/routes/${route._id}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(route._id.toString());
    });

    test('Return 404 for non-existent route', async () => {
      const operator = await createTestUser('operator');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/routes/${fakeId}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/routes/:id', () => {
    test('Update route', async () => {
      const operator = await createTestUser('operator');

      const route = await Route.create({
        routeName: 'Old Name',
        routeCode: 'ON-001',
        area: 'Old Area',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .put(`/api/routes/${route._id}`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({
          routeName: 'New Name',
          area: 'New Area',
          estimatedDuration: 90
        });

      expect(response.status).toBe(200);
      expect(response.body.data.routeName).toBe('New Name');
      expect(response.body.data.area).toBe('New Area');
    });
  });

  describe('DELETE /api/routes/:id', () => {
    test('Delete route', async () => {
      const operator = await createTestUser('operator');

      const route = await Route.create({
        routeName: 'Delete Me',
        routeCode: 'DM-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .delete(`/api/routes/${route._id}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      
      const deleted = await Route.findById(route._id);
      expect(deleted).toBeNull();
    });
  });

  describe('PATCH /api/routes/:id/status', () => {
    test('Update route status', async () => {
      const collector = await createTestUser('collector');

      const route = await Route.create({
        routeName: 'Status Route',
        routeCode: 'ST-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        status: 'scheduled',
        createdBy: collector.user._id
      });

      const response = await request(app)
        .patch(`/api/routes/${route._id}/status`)
        .set('Authorization', `Bearer ${collector.token}`)
        .send({ status: 'in-progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in-progress');
    });
  });

  describe('POST /api/routes/:id/assign', () => {
    test('Assign collector to route', async () => {
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');

      const route = await Route.create({
        routeName: 'Assign Route',
        routeCode: 'AS-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        createdBy: operator.user._id
      });

      const response = await request(app)
        .post(`/api/routes/${route._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ collectorId: collector.user._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.assignedTo).toBe(collector.user._id.toString());
    });
  });

  describe('GET /api/routes/stats', () => {
    test('Get route statistics', async () => {
      const operator = await createTestUser('operator');

      await Route.create({
        routeName: 'Stats Route',
        routeCode: 'STT-001',
        area: 'Test',
        startLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: 'Start'
        },
        endLocation: {
          type: 'Point',
          coordinates: [79.8712, 6.9371],
          address: 'End'
        },
        scheduledDate: new Date(),
        estimatedDuration: 60,
        status: 'completed',
        createdBy: operator.user._id
      });

      const response = await request(app)
        .get('/api/routes/stats')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
