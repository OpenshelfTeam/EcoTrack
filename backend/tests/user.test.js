import request from 'supertest';
import { startTestDB, stopTestDB, getTestApp } from './testUtils.js';
import { createTestUser, cleanupTestData, testUserData } from './fixtures.js';
import User from '../models/User.model.js';

let app;

describe('User Controller', () => {
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

  describe('GET /api/users', () => {
    test('Admin can list all users', async () => {
      const admin = await createTestUser('admin');
      await createTestUser('resident');
      await createTestUser('collector');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(3);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    test('Operator can list all users', async () => {
      const operator = await createTestUser('operator');
      await createTestUser('resident');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${operator.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Filter users by role', async () => {
      const admin = await createTestUser('admin');
      await createTestUser('resident');
      await createTestUser('collector');

      const response = await request(app)
        .get('/api/users?role=collector')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(u => u.role === 'collector')).toBe(true);
    });

    test('Filter users by active status', async () => {
      const admin = await createTestUser('admin');
      const inactive = await createTestUser('resident');
      await User.findByIdAndUpdate(inactive.user._id, { isActive: false });

      const response = await request(app)
        .get('/api/users?isActive=true')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(u => u.isActive === true)).toBe(true);
    });

    test('Search users by name or email', async () => {
      const admin = await createTestUser('admin');
      await createTestUser('resident'); // Has firstName: 'John'

      const response = await request(app)
        .get('/api/users?search=john')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Reject unauthenticated request', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    test('Get single user by ID', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .get(`/api/users/${resident.user._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(resident.user._id.toString());
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Handle invalid ObjectId format', async () => {
      const admin = await createTestUser('admin');

      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('Update user information', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put(`/api/users/${resident.user._id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.phone).toBe('+1234567890');
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ firstName: 'Test' });

      expect(response.status).toBe(404);
    });

    test('Validate updated data', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .put(`/api/users/${resident.user._id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(500); // Validation error
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('Admin can delete user', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .delete(`/api/users/${resident.user._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await User.findById(resident.user._id);
      expect(deleted).toBeNull();
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    test('Admin can update user role', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .patch(`/api/users/${resident.user._id}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'collector' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('collector');
      expect(response.body.message).toContain('collector');
    });

    test('Reject invalid role', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .patch(`/api/users/${resident.user._id}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'invalid-role' });

      expect(response.status).toBe(400);
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/users/${fakeId}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'collector' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/activate', () => {
    test('Admin can activate user', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      // First deactivate
      await User.findByIdAndUpdate(resident.user._id, { isActive: false });

      const response = await request(app)
        .patch(`/api/users/${resident.user._id}/activate`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.message).toContain('activated');
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/users/${fakeId}/activate`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/deactivate', () => {
    test('Admin can deactivate user', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .patch(`/api/users/${resident.user._id}/deactivate`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/users/${fakeId}/deactivate`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/stats', () => {
    test('Get user statistics', async () => {
      const admin = await createTestUser('admin');
      await createTestUser('resident');
      await createTestUser('collector');
      await createTestUser('operator');

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('inactive');
      expect(response.body.data).toHaveProperty('byRole');
      expect(response.body.data).toHaveProperty('recentUsers');
      expect(response.body.data).toHaveProperty('userGrowth');
      expect(response.body.data.total).toBeGreaterThanOrEqual(4);
    });

    test('ByRole contains role breakdown', async () => {
      const admin = await createTestUser('admin');
      await createTestUser('resident');
      await createTestUser('collector');

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.byRole).toBeInstanceOf(Array);
      expect(response.body.data.byRole.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id/activity', () => {
    test('Admin can view any user activity', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const response = await request(app)
        .get(`/api/users/${resident.user._id}/activity`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('activity');
      expect(response.body.data.activity).toHaveProperty('pickupRequests');
      expect(response.body.data.activity).toHaveProperty('tickets');
      expect(response.body.data.activity).toHaveProperty('payments');
      expect(response.body.data.activity).toHaveProperty('feedback');
    });

    test('User can view own activity', async () => {
      const resident = await createTestUser('resident');

      const response = await request(app)
        .get(`/api/users/${resident.user._id}/activity`)
        .set('Authorization', `Bearer ${resident.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Resident cannot view other user activity', async () => {
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');

      const response = await request(app)
        .get(`/api/users/${resident2.user._id}/activity`)
        .set('Authorization', `Bearer ${resident1.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/users/${fakeId}/activity`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    test('Handle concurrent user updates', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      const updates = [
        request(app)
          .put(`/api/users/${resident.user._id}`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({ firstName: 'Update1' }),
        request(app)
          .put(`/api/users/${resident.user._id}`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({ firstName: 'Update2' })
      ];

      const responses = await Promise.all(updates);
      expect(responses.every(r => r.status === 200)).toBe(true);
    });

    test('Handle very long search query', async () => {
      const admin = await createTestUser('admin');
      const longSearch = 'a'.repeat(1000);

      const response = await request(app)
        .get(`/api/users?search=${longSearch}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Deleted user should not appear in list', async () => {
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');

      await request(app)
        .delete(`/api/users/${resident.user._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const listResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin.token}`);

      const deletedUser = listResponse.body.data.find(
        u => u._id === resident.user._id.toString()
      );
      expect(deletedUser).toBeUndefined();
    });
  });
});
