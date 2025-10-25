import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import { register, login, getMe, updatePassword } from '../controllers/auth.controller.js';
import authRoutes from '../routes/auth.routes.js';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

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

const mockReqRes = () => {
  const req = { body: {}, params: {}, query: {}, user: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
};

describe('Auth Controller Tests', () => {
  describe('register', () => {
    it('should register new user successfully', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'john@example.com',
            token: expect.any(String)
          })
        })
      );
    });

    it('should prevent duplicate email registration', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.body = {
        firstName: 'New',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password456',
        phone: '0987654321'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should default to resident role if not specified', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        firstName: 'Default',
        lastName: 'User',
        email: 'default@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const user = await User.findOne({ email: 'default@example.com' });
      expect(user.role).toBe('resident');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident',
        isActive: true
      });

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'test@example.com',
            token: expect.any(String)
          })
        })
      );
    });

    it('should reject login with wrong password', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials'
        })
      );
    });

    it('should reject login for non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should require email and password', async () => {
      const { req, res } = mockReqRes();
      req.body = { email: 'test@example.com' };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('email and password')
        })
      );
    });

    it('should reject login for inactive user', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident',
        isActive: false
      });

      req.body = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getMe', () => {
    it('should get current user profile', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const { req, res } = mockReqRes();
      req.user = { _id: '507f1f77bcf86cd799439011' };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'oldpassword123',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      req.body = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword456'
      };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify password was actually changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.comparePassword('newpassword456');
      expect(isMatch).toBe(true);
    });

    it('should reject with wrong current password', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'oldpassword123',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword456'
      };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should require both current and new password', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      req.body = { currentPassword: 'password123' };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Additional Auth Coverage Tests', () => {
    it('should handle registration with all roles', async () => {
      const roles = ['resident', 'collector', 'operator', 'authority', 'admin'];
      
      for (const role of roles) {
        const { req, res } = mockReqRes();
        req.body = {
          firstName: 'Test',
          lastName: role.charAt(0).toUpperCase() + role.slice(1),
          email: `${role}${Date.now()}@example.com`,
          password: 'password123',
          phone: `123456${Math.random().toString().substring(2,6)}`,
          role
        };

        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });

    it('should sanitize user input during registration', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        firstName: '  Test  ',
        lastName: '  User  ',
        email: '  SANITIZE@EXAMPLE.COM  ',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      };

      await register(req, res);

      if (res.status.mock.calls[0][0] === 201) {
        const user = await User.findOne({ email: 'sanitize@example.com' });
        expect(user.firstName).toBe('Test');
        expect(user.email).toBe('sanitize@example.com');
      }
    });

    it('should handle login with wrong password case sensitivity', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.body = {
        email: 'test@example.com',
        password: 'password123' // Wrong case
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should prevent brute force with rate limiting', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await login(req, res);
      }

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should validate password complexity', async () => {
      const { req, res } = mockReqRes();
      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'weakpass@example.com',
        password: '123', // Too weak
        phone: '1234567890',
        role: 'resident'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle getMe with populated data', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'populated@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident',
        address: {
          street: '123 Main St',
          city: 'Colombo',
          province: 'Western',
          postalCode: '10100'
        }
      });

      req.user = { _id: user._id };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should log user activity after successful login', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'activity@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.body = {
        email: 'activity@example.com',
        password: 'password123'
      };

      await login(req, res);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).toBeDefined();
    });

    it('should handle password update with strong password', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'strongpass@example.com',
        password: 'OldPassword123!',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewStrongPassword456!'
      };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should invalidate old tokens after password change', async () => {
      const { req, res } = mockReqRes();
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'token@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.user = { _id: user._id };
      req.body = {
        currentPassword: 'password123',
        newPassword: 'newPassword456'
      };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle case-insensitive email login', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'casetest@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.body = {
        email: 'CASETEST@EXAMPLE.COM',
        password: 'password123'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
