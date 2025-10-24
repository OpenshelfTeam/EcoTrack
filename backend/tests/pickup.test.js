import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData } from './fixtures.js';
import PickupRequest from '../models/PickupRequest.model.js';

let app;

describe('Pickup Controller', () => {
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

  describe('POST /api/pickups', () => {
    test('Resident can create pickup request', async () => {
      const resident = await createTestUser('resident');

      const pickupData = {
        wasteType: 'general',
        description: 'Weekly garbage pickup',
        quantity: 2,
        pickupLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: '123 Test Street'
        },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        contactPerson: {
          name: 'John Doe',
          phone: '+1234567890'
        },
        notes: 'Please call before arrival'
      };

      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send(pickupData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.wasteType).toBe('general');
      expect(response.body.data.status).toBe('pending');
    });

    test('Prevent duplicate pickup for same date', async () => {
      const resident = await createTestUser('resident');

      const pickupData = {
        wasteType: 'general',
        description: 'Test',
        quantity: 1,
        pickupLocation: {
          type: 'Point',
          coordinates: [79.8612, 6.9271]
        },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      };

      // Create first pickup
      await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send(pickupData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send(pickupData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already scheduled');
    });

    test('Validate required fields', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send({ wasteType: 'general' }); // Missing required fields

      expect(response.status).toBe(500);
    });

    test('Support multiple waste types', async () => {
      const resident = await createTestUser('resident');

      const wasteTypes = ['general', 'recycling', 'organic', 'hazardous'];
      
      for (const wasteType of wasteTypes) {
        const response = await request(app)
          .post('/api/pickups')
          .set('Authorization', `Bearer ${resident.token}`)
          .send({
            wasteType,
            quantity: 1,
            pickupLocation: {
              type: 'Point',
              coordinates: [79.8612, 6.9271]
            },
            preferredDate: new Date(Date.now() + (wasteTypes.indexOf(wasteType) + 2) * 24 * 60 * 60 * 1000),
            timeSlot: 'morning'
          });

        expect(response.status).toBe(201);
        expect(response.body.data.wasteType).toBe(wasteType);
      }
    });

    test('Support different time slots', async () => {
      const resident = await createTestUser('resident');

      const timeSlots = ['morning', 'afternoon', 'evening'];
      
      for (const timeSlot of timeSlots) {
        const response = await request(app)
          .post('/api/pickups')
          .set('Authorization', `Bearer ${resident.token}`)
          .send({
            wasteType: 'general',
            quantity: 1,
            pickupLocation: {
              type: 'Point',
              coordinates: [79.8612, 6.9271]
            },
            preferredDate: new Date(Date.now() + (timeSlots.indexOf(timeSlot) + 2) * 24 * 60 * 60 * 1000),
            timeSlot
          });

        expect(response.status).toBe(201);
        expect(response.body.data.timeSlot).toBe(timeSlot);
      }
    });

    test('Reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/pickups')
        .send({ wasteType: 'general' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pickups', () => {
    test('Resident sees own pickups only', async () => {
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      await PickupRequest.create({
        requestedBy: resident1.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      });

      await PickupRequest.create({
        requestedBy: resident2.user._id,
        wasteType: 'recycling',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon'
      });

      const response = await request(app)
        .get('/api/pickups')
        .set('Authorization', `Bearer ${resident1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].wasteType).toBe('general');
    });

    test('Operator sees all pickups', async () => {
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      await PickupRequest.create({
        requestedBy: resident1.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      });

      await PickupRequest.create({
        requestedBy: resident2.user._id,
        wasteType: 'recycling',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon'
      });

      const response = await request(app)
        .get('/api/pickups')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('Filter by status', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'recycling',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon',
        status: 'completed'
      });

      const response = await request(app)
        .get('/api/pickups?status=pending')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.status === 'pending')).toBe(true);
    });

    test('Filter by waste type', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      });

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'recycling',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon'
      });

      const response = await request(app)
        .get('/api/pickups?wasteType=recycling')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.wasteType === 'recycling')).toBe(true);
    });

    test('Pagination works', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      for (let i = 0; i < 15; i++) {
        await PickupRequest.create({
          requestedBy: resident.user._id,
          wasteType: 'general',
          quantity: 1,
          pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
          preferredDate: new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000),
          timeSlot: 'morning'
        });
      }

      const response = await request(app)
        .get('/api/pickups?page=1&limit=10')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/pickups/:id', () => {
    test('Get single pickup by ID', async () => {
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      });

      const response = await request(app)
        .get(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(pickup._id.toString());
    });

    test('Return 404 for non-existent pickup', async () => {
      const resident = await createTestUser('resident');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/pickups/${fakeId}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(404);
    });

    test('Resident cannot view other resident pickup', async () => {
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident2.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning'
      });

      const response = await request(app)
        .get(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${resident1.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/pickups/:id/status', () => {
    test('Operator can update pickup status', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      const response = await request(app)
        .patch(`/api/pickups/${pickup._id}/status`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('approved');
    });

    test('Collector can update to in-progress', async () => {
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'approved'
      });

      const response = await request(app)
        .patch(`/api/pickups/${pickup._id}/status`)
        .set('Authorization', `Bearer ${collector.token}`)
        .send({ status: 'in-progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in-progress');
    });

    test('Status history is tracked', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      await request(app)
        .patch(`/api/pickups/${pickup._id}/status`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ status: 'approved' });

      const response = await request(app)
        .get(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.statusHistory.length).toBeGreaterThan(1);
    });
  });

  describe('PATCH /api/pickups/:id/assign', () => {
    test('Operator can assign collector', async () => {
      const operator = await createTestUser('operator');
      const collector = await createTestUser('collector');
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'approved'
      });

      const response = await request(app)
        .patch(`/api/pickups/${pickup._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ collectorId: collector.user._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.assignedCollector).toBeDefined();
    });

    test('Cannot assign to non-collector role', async () => {
      const operator = await createTestUser('operator');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident2.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'approved'
      });

      const response = await request(app)
        .patch(`/api/pickups/${pickup._id}/assign`)
        .set('Authorization', `Bearer ${operator.token}`)
        .send({ collectorId: resident1.user._id.toString() });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/pickups/:id', () => {
    test('Resident can cancel own pending pickup', async () => {
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Cannot cancel in-progress pickup', async () => {
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'in-progress'
      });

      const response = await request(app)
        .delete(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(400);
    });

    test('Admin can delete any pickup', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const pickup = await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/pickups/${pickup._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/pickups/stats', () => {
    test('Get pickup statistics', async () => {
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'general',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        status: 'pending'
      });

      await PickupRequest.create({
        requestedBy: resident.user._id,
        wasteType: 'recycling',
        quantity: 1,
        pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon',
        status: 'completed'
      });

      const response = await request(app)
        .get('/api/pickups/stats')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byWasteType');
    });
  });

  describe('Edge Cases', () => {
    test('Handle invalid date format', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send({
          wasteType: 'general',
          quantity: 1,
          pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
          preferredDate: 'invalid-date',
          timeSlot: 'morning'
        });

      expect(response.status).toBe(500);
    });

    test('Handle very large quantity', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send({
          wasteType: 'general',
          quantity: 99999,
          pickupLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
          preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          timeSlot: 'morning'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantity).toBe(99999);
    });

    test('Handle boundary coordinates', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${resident.token}`)
        .send({
          wasteType: 'general',
          quantity: 1,
          pickupLocation: { type: 'Point', coordinates: [-180, -90] },
          preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          timeSlot: 'morning'
        });

      expect(response.status).toBe(201);
    });
  });
});
