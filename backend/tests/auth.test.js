import request from 'supertest';
import { getTestApp, stopTestDB } from './testUtils.js';
import { 
  testUserData, 
  createTestUser, 
  generateUniqueEmail,
  cleanupTestData 
} from './fixtures.js';
import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';

let app;

describe('Auth API - Comprehensive Tests', () => {
  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register - User Registration', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        ...testUserData.resident,
        email: generateUniqueEmail('newuser')
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.firstName).toBe(userData.firstName);
      expect(res.body.data.role).toBe('resident');
      expect(res.body.data).not.toHaveProperty('password');

      // Verify JWT token is valid
      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.id).toBe(res.body.data._id);
    });

    test('should register user with specified role', async () => {
      const userData = {
        ...testUserData.collector,
        email: generateUniqueEmail('collector')
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.role).toBe('collector');
    });

    test('should default to resident role if not specified', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: generateUniqueEmail('default'),
        password: 'Test123456',
        phone: '+1234567890'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.role).toBe('resident');
    });

    test('should reject duplicate email registration', async () => {
      const email = generateUniqueEmail('duplicate');
      const userData = { ...testUserData.resident, email };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    test('should reject registration with missing required fields', async () => {
      const invalidData = {
        email: generateUniqueEmail('invalid')
        // Missing firstName, lastName, password, phone
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    test('should hash password before storing', async () => {
      const userData = {
        ...testUserData.resident,
        email: generateUniqueEmail('hash')
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findById(res.body.data._id).select('+password');
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    test('should store email in lowercase', async () => {
      const userData = {
        ...testUserData.resident,
        email: 'UPPERCASE@TEST.COM'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.email).toBe('uppercase@test.com');
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    let testUser;
    const password = 'Test123456';

    beforeEach(async () => {
      testUser = await createTestUser({
        ...testUserData.resident,
        email: generateUniqueEmail('login'),
        password
      });
    });

    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data._id).toBe(testUser.user._id.toString());
      expect(res.body.data.email).toBe(testUser.user.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    test('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email and password');
    });

    test('should reject login for inactive user', async () => {
      testUser.user.isActive = false;
      await testUser.user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        ...testUserData.resident,
        email: generateUniqueEmail('me')
      });
    });

    test('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testUser.user._id.toString());
      expect(res.body.data.email).toBe(testUser.user.email);
    });

    test('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no token');
    });

    test('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token failed');
    });

    test('should reject token for deleted user', async () => {
      const token = testUser.token;
      await User.findByIdAndDelete(testUser.user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('PUT /api/auth/updatepassword - Update Password', () => {
    let testUser;
    const oldPassword = 'Test123456';
    const newPassword = 'NewPassword789';

    beforeEach(async () => {
      testUser = await createTestUser({
        ...testUserData.resident,
        email: generateUniqueEmail('updatepw'),
        password: oldPassword
      });
    });

    test('should update password with valid current password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          currentPassword: oldPassword,
          newPassword
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');

      // Try logging in with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password: newPassword
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
    });

    test('should reject password update with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('incorrect');
    });
  });
});
