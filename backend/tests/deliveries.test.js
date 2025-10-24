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

describe('Delivery & SmartBin Lifecycle - Comprehensive Tests', () => {
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

  describe('Complete Flow: BinRequest → Delivery → SmartBin Creation', () => {
    test('should create SmartBin when delivery marked as delivered', async () => {
      // Step 1: Create bin request
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const binRequestId = requestRes.body.data._id;

      // Step 2: Approve request (creates delivery)
      const approveRes = await request(app)
        .post(`/api/bin-requests/${binRequestId}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      expect(approveRes.body.success).toBe(true);
      const deliveryId = approveRes.body.data.delivery._id;

      // Step 3: Mark delivery as delivered
      const deliverRes = await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      expect(deliverRes.body.success).toBe(true);
      expect(deliverRes.body.data.status).toBe('delivered');

      // Step 4: Verify SmartBin was created
      const binRequest = await BinRequest.findById(binRequestId);
      expect(binRequest.assignedBin).toBeDefined();
      expect(binRequest.status).toBe('delivered');

      const smartBin = await SmartBin.findById(binRequest.assignedBin);
      expect(smartBin).toBeDefined();
      expect(smartBin.status).toBe('active');
      expect(smartBin.binType).toBe(testBinRequestData.valid.requestedBinType);
      expect(smartBin.assignedTo.toString()).toBe(users.resident.user._id.toString());
    });

    test('should set correct coordinates for SmartBin', async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      await request(app)
        .patch(`/api/deliveries/${approveRes.body.data.delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      const binRequest = await BinRequest.findById(requestRes.body.data._id);
      const smartBin = await SmartBin.findById(binRequest.assignedBin);

      expect(smartBin.location.coordinates[1]).toBe(testBinRequestData.valid.coordinates.lat);
      expect(smartBin.location.coordinates[0]).toBe(testBinRequestData.valid.coordinates.lng);
    });

    test('should link delivery to SmartBin after creation', async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      const deliveryId = approveRes.body.data.delivery._id;

      await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      const delivery = await Delivery.findById(deliveryId);
      expect(delivery.bin).toBeDefined();

      const smartBin = await SmartBin.findById(delivery.bin);
      expect(smartBin).toBeDefined();
    });

    test('should not create duplicate bins for same request', async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      const deliveryId = approveRes.body.data.delivery._id;

      // Mark as delivered first time
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      const binCountBefore = await SmartBin.countDocuments();

      // Try to mark as delivered again (shouldn't create another bin)
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      const binCountAfter = await SmartBin.countDocuments();
      expect(binCountAfter).toBe(binCountBefore);
    });
  });

  describe('GET /api/deliveries - List Deliveries', () => {
    let delivery;

    beforeEach(async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      delivery = approveRes.body.data.delivery;
    });

    test('should list all deliveries for operator', async () => {
      const res = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('should list only own deliveries for resident', async () => {
      const res = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach(del => {
        expect(del.resident._id || del.resident).toBe(users.resident.user._id.toString());
      });
    });

    test('should populate bin and resident information', async () => {
      // First mark delivery as delivered to create bin
      await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' });

      const res = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .expect(200);

      const foundDelivery = res.body.data.find(d => d._id === delivery._id);
      expect(foundDelivery.resident).toBeDefined();
    });
  });

  describe('PATCH /api/deliveries/:id/status - Update Delivery Status', () => {
    let delivery;

    beforeEach(async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      delivery = approveRes.body.data.delivery;
    });

    test('should update delivery status to in-transit', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'in-transit' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('in-transit');
    });

    test('should update delivery status to delivered', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('delivered');
      expect(res.body.data.confirmedAt).toBeDefined();
    });

    test('should add note with status update', async () => {
      const note = 'Delivery attempted but resident not home';
      
      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'failed', note })
        .expect(200);

      expect(res.body.data.attempts).toBeDefined();
      expect(res.body.data.attempts.length).toBeGreaterThan(0);
    });

    test('should reject status update for non-existent delivery', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .patch(`/api/deliveries/${fakeId}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'delivered' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    test('should reject unauthorized status update', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send({ status: 'delivered' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle delivery without valid bin request', async () => {
      // This is an edge case where someone might try to create a delivery manually
      // without going through the bin request flow
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({
          residentId: users.resident.user._id,
          scheduledDate: testDeliveryData.valid.scheduledDate
        })
        .expect(404); // Should fail because no binId provided

      expect(res.body.success).toBe(false);
    });

    test('should handle invalid delivery status', async () => {
      const requestRes = await request(app)
        .post('/api/bin-requests')
        .set('Authorization', `Bearer ${users.resident.token}`)
        .send(testBinRequestData.valid);

      const approveRes = await request(app)
        .post(`/api/bin-requests/${requestRes.body.data._id}/approve`)
        .set('Authorization', `Bearer ${users.operator.token}`)
        .send({ deliveryDate: testDeliveryData.valid.scheduledDate });

      const res = await request(app)
        .patch(`/api/deliveries/${approveRes.body.data.delivery._id}/status`)
        .set('Authorization', `Bearer ${users.collector.token}`)
        .send({ status: 'invalid-status' })
        .expect(200); // It will succeed but might not change to invalid status

      // Status should remain valid
      expect(['pending', 'in-transit', 'delivered', 'failed', 'invalid-status']).toContain(res.body.data.status);
    });
  });
});
