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
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

// Setup mock before importing
jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Import controller functions after mocking
const { getUsers, getUser, updateUser, deleteUser, updateUserRole, activateUser, deactivateUser, getUserStats, getUserActivity } = await import('../../controllers/user.controller.js');

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

    test('should handle database errors', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      // Act
      await deactivateUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });

  describe('getUserStats', () => {
    test('should get user statistics successfully', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        active: 85,
        inactive: 15,
        byRole: [
          { _id: 'resident', count: 60 },
          { _id: 'collector', count: 30 },
          { _id: 'admin', count: 10 }
        ],
        recentUsers: [mockUser],
        userGrowth: [
          { _id: { year: 2024, month: 10 }, count: 15 },
          { _id: { year: 2024, month: 9 }, count: 12 }
        ]
      };

      mockUserModel.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85)  // active
        .mockResolvedValueOnce(15); // inactive

      mockUserModel.aggregate
        .mockResolvedValueOnce(mockStats.byRole) // byRole aggregation
        .mockResolvedValueOnce(mockStats.userGrowth); // userGrowth aggregation

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockStats.recentUsers)
      });

      // Act
      await getUserStats(mockReq, mockRes);

      // Assert
      expect(mockUserModel.countDocuments).toHaveBeenCalledTimes(3);
      expect(mockUserModel.aggregate).toHaveBeenCalledTimes(2);
      expect(mockUserModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 100,
          active: 85,
          inactive: 15,
          byRole: mockStats.byRole,
          recentUsers: mockStats.recentUsers,
          userGrowth: mockStats.userGrowth
        }
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      mockUserModel.countDocuments.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await getUserStats(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
    });
  });

  describe('getUserActivity', () => {
    const mockPickupRequest = {
      requestId: 'PU001',
      status: 'pending',
      wasteType: 'plastic',
      createdAt: new Date()
    };

    const mockTicket = {
      ticketId: 'TKT001',
      subject: 'Test ticket',
      status: 'open',
      priority: 'high',
      createdAt: new Date()
    };

    const mockPayment = {
      invoiceId: 'INV001',
      amount: 100,
      status: 'completed',
      paymentDate: new Date()
    };

    const mockFeedback = {
      category: 'service',
      subject: 'Test feedback',
      rating: 5,
      status: 'active',
      createdAt: new Date()
    };

    // Mock the dynamic imports
    const mockPickupRequestModel = {
      find: jest.fn()
    };

    const mockTicketModel = {
      find: jest.fn()
    };

    const mockPaymentModel = {
      find: jest.fn()
    };

    const mockFeedbackModel = {
      find: jest.fn()
    };

    beforeAll(async () => {
      // Mock the dynamic imports
      jest.unstable_mockModule('../../models/PickupRequest.model.js', () => ({
        default: mockPickupRequestModel
      }));

      jest.unstable_mockModule('../../models/Ticket.model.js', () => ({
        default: mockTicketModel
      }));

      jest.unstable_mockModule('../../models/Payment.model.js', () => ({
        default: mockPaymentModel
      }));

      jest.unstable_mockModule('../../models/Feedback.model.js', () => ({
        default: mockFeedbackModel
      }));
    });

    test('should get user activity for admin', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.user = { _id: 'admin123', role: 'admin' };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      mockPickupRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockPickupRequest])
      });

      mockTicketModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockTicket])
      });

      mockPaymentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockPayment])
      });

      mockFeedbackModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockFeedback])
      });

      // Act
      await getUserActivity(mockReq, mockRes);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: mockUser,
          activity: expect.objectContaining({
            pickupRequests: expect.any(Object),
            tickets: expect.any(Object),
            payments: expect.any(Object),
            feedback: expect.any(Object)
          })
        })
      });
    });

    test('should get user activity for owner', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.user = { _id: 'user123', role: 'resident' };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      mockPickupRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockPickupRequest])
      });

      mockTicketModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockTicket])
      });

      mockPaymentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockPayment])
      });

      mockFeedbackModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([mockFeedback])
      });

      // Act
      await getUserActivity(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      mockReq.params.id = 'nonexistent';
      mockReq.user = { _id: 'admin123', role: 'admin' };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getUserActivity(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    test('should return 403 for unauthorized access', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.user = { _id: 'otheruser', role: 'resident' };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getUserActivity(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to view this user activity'
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      mockReq.params.id = 'user123';
      mockReq.user = { _id: 'admin123', role: 'admin' };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      // Act
      await getUserActivity(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error'
      });
    });
  });
});
