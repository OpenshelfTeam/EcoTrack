import { jest } from '@jest/globals';

// Mock the User model
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '1234567890',
  role: 'resident',
  isActive: true,
  comparePassword: jest.fn(),
  save: jest.fn()
};

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
};

// Mock the auth middleware
const mockGenerateToken = jest.fn(() => 'mock-jwt-token-12345');

// Setup mocks before importing
jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../middleware/auth.middleware.js', () => ({
  generateToken: mockGenerateToken
}));

// Import functions to test (after mocking)
const { register, login, getMe, updatePassword } = await import('../../controllers/auth.controller.js');

describe('Auth Controller Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockReq = {
      body: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Reset mock implementations
    mockUserModel.findOne.mockReset();
    mockUserModel.create.mockReset();
    mockUser.comparePassword.mockReset();
  });

  describe('register', () => {
    test('should successfully register a new user', async () => {
      // Arrange - Positive case
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St', city: 'Colombo' }
      };

      mockUserModel.findOne.mockResolvedValue(null); // No existing user
      mockUserModel.create.mockResolvedValue(mockUser);

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'john@example.com',
            token: expect.any(String)
          })
        })
      );
    });

    test('should return 400 if user already exists', async () => {
      // Arrange - Negative case
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      mockUserModel.findOne.mockResolvedValue(mockUser); // User exists

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(mockUserModel.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists with this email'
      });
    });

    test('should use default role "resident" if not provided', async () => {
      // Arrange - Edge case
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'resident'
        })
      );
    });

    test('should handle database errors', async () => {
      // Arrange - Error case
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      const dbError = new Error('Database connection failed');
      mockUserModel.findOne.mockRejectedValue(dbError);

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
    });

    test('should accept custom role when provided', async () => {
      // Arrange - Positive case with role
      mockReq.body = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'admin'
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({ ...mockUser, role: 'admin' });

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin'
        })
      );
    });
  });

  describe('login', () => {
    test('should successfully login with valid credentials', async () => {
      // Arrange - Positive case
      mockReq.body = {
        email: 'john@example.com',
        password: 'password123'
      };

      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'john@example.com',
            token: expect.any(String)
          })
        })
      );
    });

    test('should return 400 if email is missing', async () => {
      // Arrange - Negative case
      mockReq.body = { password: 'password123' };

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide email and password'
      });
    });

    test('should return 400 if password is missing', async () => {
      // Arrange - Negative case
      mockReq.body = { email: 'john@example.com' };

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide email and password'
      });
    });

    test('should return 401 for invalid email', async () => {
      // Arrange - Negative case
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    test('should return 401 for invalid password', async () => {
      // Arrange - Negative case
      mockReq.body = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    test('should return 401 if user account is deactivated', async () => {
      // Arrange - Edge case
      mockReq.body = {
        email: 'john@example.com',
        password: 'password123'
      };

      const inactiveUser = {
        ...mockUser,
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser)
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Your account has been deactivated'
      });
    });

    test('should handle empty credentials', async () => {
      // Arrange - Edge case
      mockReq.body = { email: '', password: '' };

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors during login', async () => {
      // Arrange - Error case
      mockReq.body = {
        email: 'john@example.com',
        password: 'password123'
      };

      const dbError = new Error('Database connection failed');
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError)
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
    });
  });

  describe('getMe', () => {
    test('should return user profile successfully', async () => {
      // Arrange - Positive case
      mockReq.user = { id: 'user123' };

      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      await getMe(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    test('should handle database errors', async () => {
      // Arrange - Error case
      mockReq.user = { id: 'user123' };

      const dbError = new Error('Database error');
      mockUserModel.findById.mockRejectedValue(dbError);

      // Act
      await getMe(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });

  describe('updatePassword', () => {
    test('should change password successfully', async () => {
      // Arrange - Positive case
      mockReq.user = { id: 'user123' };
      mockReq.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const userWithPassword = {
        ...mockUser,
        password: 'hashedOldPassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      // Act
      await updatePassword(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith('oldPassword123');
      expect(userWithPassword.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: expect.any(String)
        }
      });
    });

    test('should fail with incorrect current password', async () => {
      // Arrange - Negative case
      mockReq.user = { id: 'user123' };
      mockReq.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      // Act
      await updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password is incorrect'
      });
    });

    test('should handle database errors', async () => {
      // Arrange - Error case
      mockReq.user = { id: 'user123' };
      mockReq.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const dbError = new Error('Database error');
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError)
      });

      // Act
      await updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });
});
