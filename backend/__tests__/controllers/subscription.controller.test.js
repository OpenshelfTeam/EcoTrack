import { jest } from '@jest/globals';

// Mock models
const mockSubscriptionModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
};

const mockPaymentModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Subscription.model.js', () => ({
  default: mockSubscriptionModel
}));

jest.unstable_mockModule('../../models/Payment.model.js', () => ({
  default: mockPaymentModel
}));

// Import functions
const {
  getMySubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  processSubscriptionPayment,
  getAllSubscriptions,
  getDueSubscriptions,
  reactivateSubscription
} = await import('../../controllers/subscription.controller.js');

describe('Subscription Controller Comprehensive Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'resident' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getMySubscription', () => {
    test('should get user subscription', async () => {
      const subscription = {
        _id: 'sub123',
        user: 'user123',
        plan: 'premium',
        status: 'active'
      };

      mockSubscriptionModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(subscription)
      });

      await getMySubscription(mockReq, mockRes);

      expect(mockSubscriptionModel.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if no subscription found', async () => {
      mockSubscriptionModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getMySubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockSubscriptionModel.findOne.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getMySubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createSubscription', () => {
    test('should create subscription successfully', async () => {
      mockReq.body = {
        plan: 'premium',
        paymentMethod: 'card'
      };

      mockSubscriptionModel.findOne.mockResolvedValue(null);

      const subscription = {
        _id: 'sub123',
        populate: jest.fn().mockResolvedValue({ _id: 'sub123' })
      };

      mockSubscriptionModel.create.mockResolvedValue(subscription);
      mockPaymentModel.create.mockResolvedValue({ _id: 'pay123' });

      await createSubscription(mockReq, mockRes);

      expect(mockSubscriptionModel.create).toHaveBeenCalled();
      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return 400 if user already has subscription', async () => {
      mockReq.body = { plan: 'premium' };

      mockSubscriptionModel.findOne.mockResolvedValue({
        _id: 'existing-sub',
        status: 'active'
      });

      await createSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.body = { plan: 'premium' };

      mockSubscriptionModel.findOne.mockRejectedValue(new Error('DB Error'));

      await createSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateSubscription', () => {
    test('should update subscription successfully', async () => {
      mockReq.params.id = 'sub123';
      mockReq.body = { plan: 'premium' };

      const subscription = {
        _id: 'sub123',
        user: 'user123',
        plan: 'basic',
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'sub123' })
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await updateSubscription(mockReq, mockRes);

      expect(subscription.plan).toBe('premium');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if subscription not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { plan: 'premium' };

      mockSubscriptionModel.findById.mockResolvedValue(null);

      await updateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized access', async () => {
      mockReq.params.id = 'sub123';
      mockReq.body = { plan: 'premium' };

      const subscription = {
        _id: 'sub123',
        user: 'different-user',
        status: 'active'
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await updateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'sub123';
      mockReq.body = { plan: 'premium' };

      mockSubscriptionModel.findById.mockRejectedValue(new Error('DB Error'));

      await updateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancelSubscription', () => {
    test('should cancel subscription successfully', async () => {
      mockReq.params.id = 'sub123';

      const subscription = {
        _id: 'sub123',
        user: 'user123',
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'sub123' })
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await cancelSubscription(mockReq, mockRes);

      expect(subscription.status).toBe('cancelled');
      expect(subscription.cancelledAt).toBeDefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if subscription not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockSubscriptionModel.findById.mockResolvedValue(null);

      await cancelSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if already cancelled', async () => {
      mockReq.params.id = 'sub123';

      const subscription = {
        _id: 'sub123',
        status: 'cancelled'
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await cancelSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'sub123';

      mockSubscriptionModel.findById.mockRejectedValue(new Error('DB Error'));

      await cancelSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('processSubscriptionPayment', () => {
    test('should process subscription payment', async () => {
      mockReq.params.id = 'sub123';
      mockReq.body = { paymentMethod: 'card' };

      const subscription = {
        _id: 'sub123',
        user: 'user123',
        plan: 'premium',
        amount: 100,
        billingCycle: 'monthly',
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'sub123' })
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);
      mockPaymentModel.create.mockResolvedValue({ _id: 'pay123' });

      await processSubscriptionPayment(mockReq, mockRes);

      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(subscription.nextBillingDate).toBeDefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if subscription not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { paymentMethod: 'card' };

      mockSubscriptionModel.findById.mockResolvedValue(null);

      await processSubscriptionPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'sub123';
      mockReq.body = { paymentMethod: 'card' };

      mockSubscriptionModel.findById.mockRejectedValue(new Error('DB Error'));

      await processSubscriptionPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllSubscriptions', () => {
    test('should get all subscriptions for admin', async () => {
      mockReq.user.role = 'admin';

      mockSubscriptionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'sub1' },
            { _id: 'sub2' }
          ])
        })
      });

      await getAllSubscriptions(mockReq, mockRes);

      expect(mockSubscriptionModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.user.role = 'admin';
      mockReq.query.status = 'active';

      mockSubscriptionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getAllSubscriptions(mockReq, mockRes);

      expect(mockSubscriptionModel.find).toHaveBeenCalledWith({ status: 'active' });
    });

    test('should handle database errors', async () => {
      mockReq.user.role = 'admin';

      mockSubscriptionModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getAllSubscriptions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDueSubscriptions', () => {
    test('should get due subscriptions', async () => {
      mockSubscriptionModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { _id: 'sub1', nextBillingDate: new Date() }
        ])
      });

      await getDueSubscriptions(mockReq, mockRes);

      expect(mockSubscriptionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          nextBillingDate: expect.objectContaining({ $lte: expect.any(Date) })
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      mockSubscriptionModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await getDueSubscriptions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('reactivateSubscription', () => {
    test('should reactivate cancelled subscription', async () => {
      mockReq.params.id = 'sub123';

      const subscription = {
        _id: 'sub123',
        user: 'user123',
        status: 'cancelled',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({ _id: 'sub123' })
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await reactivateSubscription(mockReq, mockRes);

      expect(subscription.status).toBe('active');
      expect(subscription.cancelledAt).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 if subscription not found', async () => {
      mockReq.params.id = 'nonexistent';

      mockSubscriptionModel.findById.mockResolvedValue(null);

      await reactivateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 if subscription already active', async () => {
      mockReq.params.id = 'sub123';

      const subscription = {
        _id: 'sub123',
        status: 'active'
      };

      mockSubscriptionModel.findById.mockResolvedValue(subscription);

      await reactivateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.params.id = 'sub123';

      mockSubscriptionModel.findById.mockRejectedValue(new Error('DB Error'));

      await reactivateSubscription(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
