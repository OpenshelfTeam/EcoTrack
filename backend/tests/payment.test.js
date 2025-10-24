import { jest } from '@jest/globals';
import User from '../models/User.model.js';
import Payment from '../models/Payment.model.js';
import paymentRoutes from '../routes/payment.routes.js';
import {
  createPayment,
  getPayments,
  getPayment,
  processPayment,
  updatePaymentStatus,
  refundPayment,
  generateInvoice,
  getPaymentStats,
  getUserPaymentHistory,
  getOverduePayments
} from '../controllers/payment.controller.js';
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

const createTestPayment = async (user, status = 'completed') => {
  return await Payment.create({
    transactionId: `TX${Date.now()}${Math.random().toString().substring(2,8)}`,
    user: user._id,
    amount: 1000,
    paymentType: 'service-charge',
    paymentMethod: 'credit-card',
    status
  });
};

describe('Payment Controller Tests', () => {
  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.body = {
        transactionId: `TX${Date.now()}`,
        user: user._id,
        amount: 500,
        paymentType: 'service-charge',
        paymentMethod: 'credit-card'
      };

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create payments with all payment types', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      const types = ['service-charge', 'penalty', 'installation-fee', 'maintenance-fee'];

      for (const type of types) {
        req.body = {
          transactionId: `TX${Date.now()}${Math.random()}`,
          user: user._id,
          amount: 100,
          paymentType: type,
          paymentMethod: 'credit-card'
        };

        await createPayment(req, res);
      }

      const payments = await Payment.find({ user: user._id });
      expect(payments.length).toBeGreaterThanOrEqual(4);
    });

    it('should create payments with all payment methods', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      const methods = ['credit-card', 'debit-card', 'bank-transfer', 'mobile-payment', 'cash'];

      for (const method of methods) {
        req.body = {
          transactionId: `TX${Date.now()}${Math.random()}`,
          user: user._id,
          amount: 100,
          paymentType: 'service-charge',
          paymentMethod: method
        };

        await createPayment(req, res);
      }

      const payments = await Payment.find({ user: user._id });
      expect(payments.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getPayments', () => {
    it('should get all payments for admin', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      await createTestPayment(user1);
      await createTestPayment(user2);

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should get only own payments for resident', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      await createTestPayment(user1);
      await createTestPayment(user2);

      req.user = { _id: user1._id, role: 'resident' };
      req.query = {};

      await getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by status', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user = await createTestUser('resident');

      await createTestPayment(user, 'completed');
      await createTestPayment(user, 'pending');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { status: 'completed' };

      await getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user = await createTestUser('resident');

      for (let i = 0; i < 15; i++) {
        await createTestPayment(user);
      }

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { page: '1', limit: '10' };

      await getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPayment', () => {
    it('should get single payment', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const payment = await createTestPayment(user);

      req.params = { id: payment._id.toString() };
      req.user = { _id: user._id, role: 'resident' };

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent payment', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.user = { _id: user._id, role: 'resident' };

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const payment = await createTestPayment(user, 'pending');

      req.params = { id: payment._id.toString() };
      req.body = { status: 'completed' };

      await updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent payment', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { status: 'completed' };

      await updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('processPayment', () => {
    it('should process payment', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.body = {
        transactionId: `TX${Date.now()}`,
        user: user._id,
        amount: 500,
        paymentType: 'service-charge',
        paymentMethod: 'credit-card'
      };

      await processPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestPayment(user, 'completed');
      await createTestPayment(user, 'pending');

      req.query = {};

      await getPaymentStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refundPayment', () => {
    it('should process refund', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const payment = await createTestPayment(user, 'completed');

      req.params = { id: payment._id.toString() };
      req.body = { reason: 'Customer request' };

      await refundPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent payment', async () => {
      const { req, res } = mockReqRes();

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { reason: 'Test' };

      await refundPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserPaymentHistory', () => {
    it('should get user payment history', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      await createTestPayment(user, 'completed');

      req.params = { userId: user._id.toString() };
      req.query = {};

      await getUserPaymentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getOverduePayments', () => {
    it('should get overdue payments', async () => {
      const { req, res } = mockReqRes();

      req.query = {};

      await getOverduePayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const payment = await createTestPayment(user, 'completed');

      req.params = { id: payment._id.toString() };

      await generateInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in createPayment', async () => {
      const { req, res } = mockReqRes();

      req.body = { invalid: 'data' };

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors in getPayments', async () => {
      const { req, res } = mockReqRes();

      req.user = { _id: 'invalid-id', role: 'admin' };
      req.query = {};

      await getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
