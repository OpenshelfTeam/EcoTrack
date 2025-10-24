import { jest } from '@jest/globals';

// Mock models
const mockPaymentModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  findById: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Payment.model.js', () => ({
  default: mockPaymentModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

// Import functions
const {
  getPayments,
  getPayment,
  createPayment,
  processPayment,
  updatePaymentStatus,
  refundPayment,
  generateInvoice,
  getPaymentStats,
  getUserPaymentHistory,
  getOverduePayments
} = await import('../../controllers/payment.controller.js');

describe('Payment Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'admin' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getPayments', () => {
    test('should get all payments for admin with pagination', async () => {
      mockReq.query = { page: '1', limit: '10' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: 'pay1', amount: 100 },
          { _id: 'pay2', amount: 200 }
        ])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(2);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          total: 2,
          page: 1
        })
      );
    });

    test('should filter payments by status', async () => {
      mockReq.query = { status: 'completed' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    test('should filter by multiple statuses', async () => {
      mockReq.query = { status: 'completed,pending' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: { $in: ['completed', 'pending'] } })
      );
    });

    test('should filter payments for residents (role-based)', async () => {
      mockReq.user.role = 'resident';

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'user123' })
      );
    });

    test('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        })
      );
    });

    test('should filter by amount range', async () => {
      mockReq.query = { minAmount: '100', maxAmount: '500' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: { $gte: 100, $lte: 500 }
        })
      );
    });

    test('should search by transaction ID or description', async () => {
      mockReq.query = { search: 'TXN123' };

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await getPayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { transactionId: { $regex: 'TXN123', $options: 'i' } }
          ])
        })
      );
    });

    test('should handle database errors', async () => {
      mockPaymentModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPayment', () => {
    test('should get payment by ID', async () => {
      mockReq.params.id = 'pay123';

      const payment = {
        _id: 'pay123',
        user: { _id: 'user123' },
        amount: 100
      };

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(payment)
      });

      await getPayment(mockReq, mockRes);

      expect(mockPaymentModel.findById).toHaveBeenCalledWith('pay123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if payment not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized resident access', async () => {
      mockReq.params.id = 'pay123';
      mockReq.user.role = 'resident';

      const payment = {
        _id: 'pay123',
        user: { _id: 'different-user' },
        amount: 100
      };

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(payment)
      });

      await getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pay123';

      mockPaymentModel.findById.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      mockReq.body = {
        amount: 100,
        paymentType: 'subscription',
        paymentMethod: 'card',
        description: 'Test payment'
      };

      const payment = {
        _id: 'pay123',
        amount: 100,
        populate: jest.fn().mockResolvedValue({
          _id: 'pay123',
          amount: 100
        })
      };

      mockPaymentModel.create.mockResolvedValue(payment);

      await createPayment(mockReq, mockRes);

      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user123',
          amount: 100,
          paymentType: 'subscription'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should use default dueDate if not provided', async () => {
      mockReq.body = {
        amount: 100,
        paymentType: 'subscription',
        paymentMethod: 'card'
      };

      const payment = {
        _id: 'pay123',
        populate: jest.fn().mockResolvedValue({ _id: 'pay123' })
      };

      mockPaymentModel.create.mockResolvedValue(payment);

      await createPayment(mockReq, mockRes);

      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice: expect.objectContaining({
            dueDate: expect.any(Date)
          })
        })
      );
    });

    test('should handle database errors', async () => {
      mockReq.body = { amount: 100 };

      mockPaymentModel.create.mockRejectedValue(new Error('DB Error'));

      await createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = {
        paymentDetails: { cardLast4: '1234' },
        gatewayTransactionId: 'gw123'
      };

      const payment = {
        _id: 'pay123',
        user: 'user123',
        status: 'pending',
        invoice: {},
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'pay123',
          status: 'processing'
        })
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await processPayment(mockReq, mockRes);

      expect(payment.status).toBe('processing');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if payment not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { paymentDetails: {} };

      mockPaymentModel.findById.mockResolvedValue(null);

      await processPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized resident', async () => {
      mockReq.params.id = 'pay123';
      mockReq.user.role = 'resident';
      mockReq.body = { paymentDetails: {} };

      const payment = {
        _id: 'pay123',
        user: 'different-user',
        status: 'pending'
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await processPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 400 if payment already completed', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { paymentDetails: {} };

      const payment = {
        _id: 'pay123',
        user: 'user123',
        status: 'completed'
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await processPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { paymentDetails: {} };

      mockPaymentModel.findById.mockRejectedValue(new Error('DB Error'));

      await processPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePaymentStatus', () => {
    test('should update payment status to completed', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { status: 'completed' };

      const payment = {
        _id: 'pay123',
        status: 'processing',
        invoice: {},
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'pay123',
          status: 'completed'
        })
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await updatePaymentStatus(mockReq, mockRes);

      expect(payment.status).toBe('completed');
      expect(payment.invoice.paidDate).toBeDefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should update to failed with reason', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { status: 'failed', failureReason: 'Insufficient funds' };

      const payment = {
        _id: 'pay123',
        status: 'processing',
        invoice: {},
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pay123' })
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await updatePaymentStatus(mockReq, mockRes);

      expect(payment.status).toBe('failed');
      expect(payment.failureReason).toBe('Insufficient funds');
    });

    test('should return 404 if payment not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { status: 'completed' };

      mockPaymentModel.findById.mockResolvedValue(null);

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { status: 'completed' };

      mockPaymentModel.findById.mockRejectedValue(new Error('DB Error'));

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refundPayment', () => {
    test('should refund completed payment', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { reason: 'Customer request' };

      const payment = {
        _id: 'pay123',
        status: 'completed',
        description: 'Original payment',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'pay123' })
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await refundPayment(mockReq, mockRes);

      expect(payment.status).toBe('refunded');
      expect(payment.description).toContain('Refunded: Customer request');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if payment not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { reason: 'Test' };

      mockPaymentModel.findById.mockResolvedValue(null);

      await refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if payment not completed', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { reason: 'Test' };

      const payment = {
        _id: 'pay123',
        status: 'pending'
      };

      mockPaymentModel.findById.mockResolvedValue(payment);

      await refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'pay123';
      mockReq.body = { reason: 'Test' };

      mockPaymentModel.findById.mockRejectedValue(new Error('DB Error'));

      await refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateInvoice', () => {
    test('should generate invoice for user', async () => {
      mockReq.body = {
        userId: 'user456',
        amount: 100,
        paymentType: 'subscription',
        description: 'Monthly fee'
      };

      mockUserModel.findById.mockResolvedValue({
        _id: 'user456',
        name: 'Test User'
      });

      const payment = {
        _id: 'pay123',
        populate: jest.fn().mockResolvedValue({ _id: 'pay123' })
      };

      mockPaymentModel.create.mockResolvedValue(payment);

      await generateInvoice(mockReq, mockRes);

      expect(mockUserModel.findById).toHaveBeenCalledWith('user456');
      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 404 if user not found', async () => {
      mockReq.body = {
        userId: 'nonexistent',
        amount: 100
      };

      mockUserModel.findById.mockResolvedValue(null);

      await generateInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.body = {
        userId: 'user456',
        amount: 100
      };

      mockUserModel.findById.mockRejectedValue(new Error('DB Error'));

      await generateInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPaymentStats', () => {
    test('should return payment statistics', async () => {
      mockPaymentModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalRevenue: 10000,
          totalPayments: 50,
          avgPayment: 200
        }
      ]);

      await getPaymentStats(mockReq, mockRes);

      expect(mockPaymentModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockPaymentModel.aggregate.mockRejectedValue(new Error('DB Error'));

      await getPaymentStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserPaymentHistory', () => {
    test('should get user payment history', async () => {
      mockReq.params.userId = 'user456';

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'pay1' },
            { _id: 'pay2' }
          ])
        })
      });

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ user: 'user456' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockReq.params.userId = 'user456';

      mockPaymentModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getOverduePayments', () => {
    test('should get overdue payments', async () => {
      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'pay1', status: 'pending' }
          ])
        })
      });

      await getOverduePayments(mockReq, mockRes);

      expect(mockPaymentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          'invoice.dueDate': { $lt: expect.any(Date) }
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockPaymentModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getOverduePayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
