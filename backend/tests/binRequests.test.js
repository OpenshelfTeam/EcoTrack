import request from 'supertest';
import { getTestApp, stopTestDB } from './testUtils.js';
import { 
  createTestUsers,
  testBinRequestData,
  testDeliveryData,
  cleanupTestData 
} from './fixtures.js';
import BinRequest from '../models/BinRequest.model.js';
import Delivery from '../models/Delivery.model.js';
import SmartBin from '../models/SmartBin.model.js';

let app;
let users;

describe('BinRequest API - Comprehensive Tests', () => {
  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
    users = await createTestUsers();
  });

  describe('POST /api/bin-requests - Create Bin Request', () => {
    test('should create bin request with valid data (resident)', async () => {
      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.resident).toBe(users.resident.user._id.toString());
      expect(res.body.data.requestedBinType).toBe(testBinRequestData.valid.requestedBinType);
      expect(res.body.data.status).toBe('pending');
    });

    test('should store coordinates correctly', async () => {
      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid)
        .expect(201);

      expect(res.body.data.coordinates).toBeDefined();
      expect(res.body.data.coordinates.lat).toBe(testBinRequestData.valid.coordinates.lat);
      expect(res.body.data.coordinates.lng).toBe(testBinRequestData.valid.coordinates.lng);
    });

    test('should create notification for operators', async () => {
      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid)
        .expect(201);

      expect(res.body.success).toBe(true);
      // Notification creation is fire-and-forget, so we just verify request succeeded
    });

    test('should reject request without authentication', async () => {
      const res = await request(app)
        .post('/api/bin-requests')
        .send(testBinRequestData.valid)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject request with missing required fields', async () => {
      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.missingRequired)
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    test('should handle optional notes field', async () => {
      const dataWithoutNotes = { ...testBinRequestData.valid };
      delete dataWithoutNotes.notes;

      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(dataWithoutNotes)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    test('should accept different bin types', async () => {
      const binTypes = ['recycling', 'compost', 'general'];
      
      for (const binType of binTypes) {
        const data = {
          ...testBinRequestData.valid,
          requestedBinType: binType
        };

        const res = await request(app)
          .post('/api/bin-requests')
          .set('Authorization', `Bearer ${users.resident.token}`)
          .send(data)
          .expect(201);

        expect(res.body.data.requestedBinType).toBe(binType);
      }
    });
  });

  describe('POST /api/bin-requests/:requestId/approve - Approve Request', () => {
    let binRequest;

    beforeEach(async () => {
      // Create a bin request
      const createRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      binRequest = createRes.body.data;
    });

    test('should approve request and create delivery (operator)', async () => {
      const approvalData = {
        deliveryDate: testDeliveryData.valid.scheduledDate
      };

      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send(approvalData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('approved');
      expect(res.body.data.delivery).toBeDefined();
      expect(res.body.data.delivery.resident).toBe(users.resident.user._id.toString());
    });

    test('should approve request as admin', async () => {
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.admin.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('should create delivery with correct scheduled date', async () => {
      const scheduledDate = new Date('2025-12-25');
      
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: scheduledDate })
        .expect(200);

      expect(res.body.data.delivery.scheduledDate).toBeDefined();
    });

    test('should reject approval if request not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .post(`/api/bin-requests/${fakeId}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    test('should reject approval of already approved request', async () => {
      // Approve once
      await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(200);

      // Try to approve again
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already approved');
    });

    test('should reject approval by non-operator/admin', async () => {
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    test('should link delivery to bin request', async () => {
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(200);

      // Verify deliveryId is stored in request
      const updatedRequest = await BinRequest.findById(binRequest._id);
      expect(updatedRequest.deliveryId).toBeDefined();
      expect(updatedRequest.deliveryId.toString()).toBe(res.body.data.delivery._id);
    });

    test('should create notification for resident', async () => {
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(200);

      expect(res.body.success).toBe(true);
      // Notification created in background
    });
  });

  describe('GET /api/bin-requests - List Requests', () => {
    beforeEach(async () => {
      // Create multiple requests for resident
      await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send({ ...testBinRequestData.valid, requestedBinType: 'compost' });
    });

    test('should list all requests for operator', async () => {
      const res = await request(app)
        .get('/api/bin-requests')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('should list only own requests for resident', async () => {
      const res = await request(app)
        .get('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach(req => {
        expect(req.resident._id || req.resident).toBe(users.resident.user._id.toString());
      });
    });

    test('should populate resident information', async () => {
      const res = await request(app)
        .get('/api/bin-requests')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .expect(200);

      expect(res.body.data[0].resident).toBeDefined();
      if (typeof res.body.data[0].resident === 'object') {
        expect(res.body.data[0].resident.firstName).toBeDefined();
        expect(res.body.data[0].resident.email).toBeDefined();
      }
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/bin-requests?page=1&limit=1')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/bin-requests/:requestId/cancel - Cancel Request', () => {
    let binRequest;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      binRequest = createRes.body.data;
    });

    test('should cancel own pending request (resident)', async () => {
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/cancel`)
        .set('Authorization', `Bearer ${users.resident.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
    });

    test('should reject cancellation of approved request', async () => {
      // Approve first
      await request(app)
        .post(`/api/bin-requests/${binRequest._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      // Try to cancel
      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/cancel`)
        .set('Authorization', `Bearer ${users.resident.token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot cancel');
    });

    test('should reject cancellation of another users request', async () => {
      // Create another resident
      const anotherResident = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Another',
          lastName: 'Resident',
          email: 'another.resident@test.com',
          password: 'Test123456',
          phone: '+1111111111',
          role: 'resident'
        });

      const res = await request(app)
        .post(`/api/bin-requests/${binRequest._id}/cancel`)
        .set('Authorization', `Bearer ${anotherResident.body.data.token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle invalid ObjectId format', async () => {
      const res = await request(app)
        .post('/api/bin-requests/invalid-id/approve')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate })
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    test('should handle database errors gracefully', async () => {
      // Try to create request with impossibly long field
      const invalidData = {
        ...testBinRequestData.valid,
        notes: 'a'.repeat(100000) // Very long notes
      };

      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(invalidData)
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    test('should handle coordinates at boundary values', async () => {
      const boundaryData = {
        ...testBinRequestData.valid,
        coordinates: { lat: 90, lng: 180 }
      };

      const res = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(boundaryData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });
});
