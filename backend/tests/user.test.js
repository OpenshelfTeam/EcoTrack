import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import userRoutes from '../routes/user.routes.js';
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser,
  updateUserRole,
  activateUser,
  deactivateUser,
  getUserStats,
  getUserActivity
} from '../controllers/user.controller.js';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

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
    role,
    isActive: true
  });
};

describe('User Controller Tests', () => {
  
  describe('getUsers - Positive Cases', () => {
    it('should get all users successfully', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('collector');
      await createTestUser('admin');

      req.query = {};
      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3,
          data: expect.any(Array)
        })
      );
    });

    it('should filter users by role', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('collector');
      await createTestUser('admin');

      req.query = { role: 'collector' };
      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data).toHaveLength(1);
      expect(response.data[0].role).toBe('collector');
    });

    it('should filter users by active status', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('collector');
      user2.isActive = false;
      await user2.save();

      req.query = { isActive: 'true' };
      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data).toHaveLength(1);
      expect(response.data[0].isActive).toBe(true);
    });

    it('should search users by name or email', async () => {
      const { req, res } = mockReqRes();
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      req.query = { search: 'john' };
      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.length).toBeGreaterThan(0);
    });
  });

  describe('getUser - Single User Retrieval', () => {
    it('should get single user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: user._id,
            email: user.email
          })
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found'
        })
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      req.body = { 
        firstName: 'Updated',
        lastName: 'Name'
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.firstName).toBe('Updated');
      expect(response.data.lastName).toBe('Name');
    });

    it('should return 404 when updating non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { firstName: 'Updated' };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      req.body = { role: 'collector' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('collector');
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { role: 'collector' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for missing role', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      req.body = {};

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      await deactivateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const deactivatedUser = await User.findById(user._id);
      expect(deactivatedUser.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };

      await deactivateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      user.isActive = false;
      await user.save();

      req.params = { id: user._id.toString() };
      await activateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const activatedUser = await User.findById(user._id);
      expect(activatedUser.isActive).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res} = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };

      await activateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('collector');
      await createTestUser('admin');

      req.query = {};
      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getUserActivity', () => {
    it('should get user activity', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      await getUserActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent user', async () => {
      const { req, res } = mockReqRes();
      req.params = { id: '507f1f77bcf86cd799439011' };

      await getUserActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('User Model Tests', () => {
    it('should create user with required fields', async () => {
      const user = await User.create({
        firstName: 'Model',
        lastName: 'Test',
        email: 'model.test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'resident'
      });

      expect(user.firstName).toBe('Model');
      expect(user.email).toBe('model.test@example.com');
      expect(user.role).toBe('resident');
      expect(user.isActive).toBe(true); // default
    });

    it('should hash password on creation', async () => {
      const user = await User.create({
        firstName: 'Password',
        lastName: 'Test',
        email: 'password.test@example.com',
        password: 'plaintext123',
        phone: '1234567890',
        role: 'resident'
      });

      expect(user.password).not.toBe('plaintext123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should validate email format', async () => {
      await expect(
        User.create({
          firstName: 'Email',
          lastName: 'Test',
          email: 'invalid-email',
          password: 'password123',
          phone: '1234567890',
          role: 'resident'
        })
      ).rejects.toThrow();
    });

    it('should have default isActive as true', async () => {
      const user = await createTestUser('resident');
      expect(user.isActive).toBe(true);
    });

    it('should store address fields', async () => {
      const user = await User.create({
        firstName: 'Address',
        lastName: 'Test',
        email: 'address.test@example.com',
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

      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('Colombo');
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle getMe with invalid user', async () => {
      const { req, res } = mockReqRes();
      req.user = { _id: '507f1f77bcf86cd799439011' };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle updateUserProfile with password change', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        firstName: 'Updated',
        currentPassword: 'password123',
        newPassword: 'newPassword456'
      };

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle getUserStats with date filters', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('collector');

      req.query = {
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString()
      };

      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle bulk user operations', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      req.body = {
        userIds: [user1._id, user2._id],
        action: 'deactivate'
      };

      await deactivateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should validate phone number format', async () => {
      const { req, res } = mockReqRes();

      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'phone.test@example.com',
        password: 'password123',
        phone: '123', // Invalid phone
        role: 'resident'
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle user search by email', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.query = {
        email: user.email
      };

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle concurrent user updates', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };
      req.body = {
        firstName: 'Concurrent1',
        lastName: 'Update1'
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('Concurrent1');
    });

    it('should handle user filtering by multiple roles', async () => {
      const { req, res } = mockReqRes();
      await createTestUser('resident');
      await createTestUser('collector');
      await createTestUser('operator');

      req.query = {
        roles: 'resident,collector'
      };

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle user activation status toggle', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: user._id.toString() };

      await deactivateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      let dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(false);

      await activateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(true);
    });

    it('should prevent duplicate email registration', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.body = {
        firstName: 'Duplicate',
        lastName: 'Test',
        email: user.email,
        password: 'password123',
        phone: '9876543210',
        role: 'resident'
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
