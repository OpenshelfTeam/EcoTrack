import { jest } from '@jest/globals';

// Mock User model
const mockUser = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '1234567890',
  role: 'resident',
  isActive: true
};

const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
};

// Setup mock before importing
jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Import controller functions after mocking
const { getUsers, getUser, updateUser, deleteUser, updateUserRole, activateUser, deactivateUser } = await import('../../controllers/user.controller.js');

describe('User Controller Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getUsers', () => {
    test('should get all users successfully', async () => {
      // Arrange
      const users = [mockUser, { ...mockUser, _id: 'user456', email: 'jane@example.com' }];
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(users)
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockUserModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: users
      });
    });

    test('should filter users by role', async () => {
      // Arrange
      mockReq.query = { role: 'collector' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockUserModel.find).toHaveBeenCalledWith({ role: 'collector' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter users by active status', async () => {
      // Arrange
      mockReq.query = { isActive: 'true' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockUserModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    test('should search users by name', async () => {
      // Arrange
      mockReq.query = { search: 'John' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockUserModel.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'John', $options: 'i' } },
          { lastName: { $regex: 'John', $options: 'i' } },
          { email: { $regex: 'John', $options: 'i' } }
        ]
      });
    });

    test('should search users by email', async () => {
      // Arrange
      mockReq.query = { search: 'john@example' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return empty array when no users match filter', async () => {
      // Arrange
      mockReq.query = { role: 'nonexistent' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    test('should handle empty user database', async () => {
      // Arrange
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    test('should handle case-insensitive search', async () => {
      // Arrange
      mockReq.query = { search: 'JOHN' };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser])
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      const callArgs = mockUserModel.find.mock.calls[0][0];
      expect(callArgs.$or[0].firstName.$options).toBe('i');
    });

    test('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError)
      });

      // Act
      await getUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });

  describe('getUser', () => {
    test('should get user by ID successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getUser(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    test('should handle invalid user ID format', async () => {
      // Arrange
      mockReq.params.id = 'invalid-id';
      const error = new Error('Cast to ObjectId failed');
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await getUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should not return password field', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getUser(mockReq, mockRes);

      // Assert
      const selectCall = mockUserModel.findById().select;
      expect(selectCall).toHaveBeenCalledWith('-password');
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = { firstName: 'Jane', phone: '9876543210' };
      const updatedUser = { ...mockUser, firstName: 'Jane', phone: '9876543210' };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      // Act
      await updateUser(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { firstName: 'Jane', phone: '9876543210' },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser
      });
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      mockReq.body = { firstName: 'Jane' };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await updateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    test('should handle empty update body', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = {};
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await updateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should validate email format on update', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = { email: 'invalid-email' };
      const error = new Error('Validation failed');
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await updateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should validate phone number format', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = { phone: '123' };
      const error = new Error('Validation failed');
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await updateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      // Act
      await deleteUser(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when deleting non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      // Act
      await deleteUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      const dbError = new Error('Database error');
      mockUserModel.findByIdAndDelete.mockRejectedValue(dbError);

      // Act
      await deleteUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUserRole', () => {
    test('should update user role successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = { role: 'collector' };
      const updatedUser = { ...mockUser, role: 'collector' };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser)
      });

      // Act
      await updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { role: 'collector' },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User role updated to collector'
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      mockReq.body = { role: 'collector' };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle validation errors', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.body = { role: 'invalid' };
      const error = new Error('Validation failed');
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('activateUser', () => {
    test('should activate user successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      const activatedUser = { ...mockUser, isActive: true };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(activatedUser)
      });

      // Act
      await activateUser(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { isActive: true },
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User account activated successfully'
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await activateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deactivateUser', () => {
    test('should deactivate user successfully', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      const deactivatedUser = { ...mockUser, isActive: false };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(deactivatedUser)
      });

      // Act
      await deactivateUser(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { isActive: false },
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User account deactivated successfully'
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await deactivateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
