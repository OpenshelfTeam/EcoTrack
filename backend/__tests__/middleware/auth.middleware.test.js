import { jest } from '@jest/globals';

// Mock jwt
const mockJwt = {
  verify: jest.fn(),
  sign: jest.fn()
};

// Mock User model
const mockUserModel = {
  findById: jest.fn()
};

// Setup mocks before importing
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '7d';

// Import middleware functions after mocking
const { protect, authorize, generateToken } = await import('../../middleware/auth.middleware.js');

describe('Auth Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'resident',
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('protect middleware', () => {
    test('should authenticate user with valid token', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer valid-token-123';
      
      mockJwt.verify.mockReturnValue({ id: 'user123' });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token-123', 'test-secret');
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should fail when no token provided', async () => {
      // Arrange
      mockReq.headers.authorization = undefined;

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail with invalid token format', async () => {
      // Arrange
      mockReq.headers.authorization = 'InvalidFormat';

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail with invalid token', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer invalid-token';
      
      const error = new Error('Invalid token');
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, token failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail when user not found', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer valid-token-123';
      
      mockJwt.verify.mockReturnValue({ id: 'nonexistent' });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail when user is deactivated', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer valid-token-123';
      
      const inactiveUser = { ...mockUser, isActive: false };
      mockJwt.verify.mockReturnValue({ id: 'user123' });
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser)
      });

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User account is deactivated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    test('should allow admin access', () => {
      // Arrange
      mockReq.user = { ...mockUser, role: 'admin' };
      const authMiddleware = authorize('admin', 'operator');

      // Act
      authMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow operator access', () => {
      // Arrange
      mockReq.user = { ...mockUser, role: 'operator' };
      const authMiddleware = authorize('admin', 'operator');

      // Act
      authMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny resident access to admin routes', () => {
      // Arrange
      mockReq.user = { ...mockUser, role: 'resident' };
      const authMiddleware = authorize('admin', 'operator');

      // Act
      authMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "User role 'resident' is not authorized to access this route"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle multiple allowed roles', () => {
      // Arrange
      mockReq.user = { ...mockUser, role: 'collector' };
      const authMiddleware = authorize('admin', 'operator', 'collector');

      // Act
      authMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    test('should generate token for user ID', () => {
      // Arrange
      const userId = 'user123';
      const expectedToken = 'generated-jwt-token';
      mockJwt.sign.mockReturnValue(expectedToken);

      // Act
      const token = generateToken(userId);

      // Assert
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe(expectedToken);
    });

    test('should return string token', () => {
      // Arrange
      mockJwt.sign.mockReturnValue('string-token');

      // Act
      const token = generateToken('user123');

      // Assert
      expect(typeof token).toBe('string');
    });
  });
});
