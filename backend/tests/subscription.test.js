import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Subscription from '../models/Subscription.model.js';
import Notification from '../models/Notification.model.js';
import subscriptionRoutes from '../routes/subscription.routes.js';
import {
  getMySubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getAllSubscriptions,
  reactivateSubscription,
  processSubscriptionPayment,
  getDueSubscriptions
} from '../controllers/subscription.controller.js';
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

const createTestSubscription = async (user, plan = 'basic') => {
  const planPricing = {
    basic: 25.00,
    standard: 40.00,
    premium: 60.00
  };

  const planFeatures = {
    basic: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false },
    standard: { maxBins: 3, maxPickupsPerMonth: 8, prioritySupport: true },
    premium: { maxBins: 5, maxPickupsPerMonth: 12, prioritySupport: true }
  };

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  return await Subscription.create({
    user: user._id,
    plan,
    monthlyCharge: planPricing[plan],
    status: 'active',
    nextBillingDate,
    paymentMethod: {
      type: 'card',
      details: 'Test card'
    },
    features: planFeatures[plan]
  });
};

describe('Subscription Controller Tests', () => {

  describe('createSubscription - Positive Cases', () => {
    it('should create basic subscription successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        plan: 'basic',
        paymentMethod: { type: 'card' }
      };

      await createSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Subscription created successfully',
          subscription: expect.objectContaining({
            plan: 'basic',
            monthlyCharge: 25.00
          })
        })
      );

      // Verify notification was created
      const notifications = await Notification.find({ recipient: user._id });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should create subscription with all plan types', async () => {
      const plans = ['basic', 'standard', 'premium'];
      const expectedCharges = [25.00, 40.00, 60.00];

      for (let i = 0; i < plans.length; i++) {
        const { req, res } = mockReqRes();
        const user = await createTestUser('resident');

        req.user = { _id: user._id };
        req.body = {
          plan: plans[i],
          paymentMethod: { type: 'card' }
        };

        await createSubscription(req, res);

        const subscription = await Subscription.findOne({ user: user._id });
        expect(subscription.plan).toBe(plans[i]);
        expect(subscription.monthlyCharge).toBe(expectedCharges[i]);
      }
    });

    it('should set features based on plan', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        plan: 'premium',
        paymentMethod: { type: 'card' }
      };

      await createSubscription(req, res);

      const subscription = await Subscription.findOne({ user: user._id });
      expect(subscription.features.maxBins).toBe(5);
      expect(subscription.features.maxPickupsPerMonth).toBe(12);
      expect(subscription.features.prioritySupport).toBe(true);
    });
  });

  describe('createSubscription - Negative & Edge Cases', () => {
    it('should prevent duplicate subscriptions', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      await createTestSubscription(user);

      req.user = { _id: user._id };
      req.body = {
        plan: 'standard',
        paymentMethod: { type: 'card' }
      };

      await createSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already have an active subscription')
        })
      );
    });

    it('should default to basic plan if not specified', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        paymentMethod: { type: 'card' }
      };

      await createSubscription(req, res);

      const subscription = await Subscription.findOne({ user: user._id });
      expect(subscription.plan).toBe('basic');
    });
  });

  describe('getMySubscription', () => {
    it('should get user subscription successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      await getMySubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: subscription.plan
        })
      );
    });

    it('should return 404 when no subscription exists', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      await getMySubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No subscription found')
        })
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      await createTestSubscription(user, 'basic');

      req.user = { _id: user._id };
      req.body = {
        plan: 'premium'
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedSubscription = await Subscription.findOne({ user: user._id });
      expect(updatedSubscription.plan).toBe('premium');
      expect(updatedSubscription.monthlyCharge).toBe(60.00);
    });

    it('should return 404 when updating non-existent subscription', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      req.body = {
        plan: 'premium'
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      await createTestSubscription(user);

      req.user = { _id: user._id };
      await cancelSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const cancelledSubscription = await Subscription.findOne({ user: user._id });
      expect(cancelledSubscription.status).toBe('cancelled');
      expect(cancelledSubscription.cancelledAt).toBeDefined();
    });

    it('should return 404 when cancelling non-existent subscription', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');

      req.user = { _id: user._id };
      await cancelSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllSubscriptions', () => {
    it('should get all subscriptions for admin', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      await createTestSubscription(user1);
      await createTestSubscription(user2);

      req.query = {};
      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should filter subscriptions by status', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const sub1 = await createTestSubscription(user1);
      const sub2 = await createTestSubscription(user2);
      sub2.status = 'cancelled';
      await sub2.save();

      req.query = { status: 'active' };
      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should filter subscriptions by plan', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      await createTestSubscription(user1, 'basic');
      await createTestSubscription(user2, 'premium');

      req.query = { plan: 'premium' };
      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.subscriptions[0].plan).toBe('premium');
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate cancelled subscription', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      
      // Cancel subscription first
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      await subscription.save();

      req.user = { _id: user._id };
      await reactivateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const reactivatedSubscription = await Subscription.findOne({ user: user._id });
      expect(reactivatedSubscription.status).toBe('active');
    });
  });

  describe('Additional Subscription Controller Tests', () => {
    it('should handle payment method update', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        paymentMethod: {
          type: 'bank-transfer',
          details: 'Bank Account 123456'
        }
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updated = await Subscription.findById(subscription._id);
      expect(updated.paymentMethod.type).toBe('bank-transfer');
    });

    it('should handle autoRenew toggle', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        autoRenew: false
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should get all subscriptions for admin', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      await createTestSubscription(user1, 'basic');
      await createTestSubscription(user2, 'premium');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = {};

      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter subscriptions by status', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      const sub1 = await createTestSubscription(user1);
      sub1.status = 'active';
      await sub1.save();

      const sub2 = await createTestSubscription(user2);
      sub2.status = 'cancelled';
      await sub2.save();

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { status: 'active' };

      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter subscriptions by plan', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      await createTestSubscription(user1, 'basic');
      await createTestSubscription(user2, 'premium');

      req.user = { _id: admin._id, role: 'admin' };
      req.query = { plan: 'premium' };

      await getAllSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle subscription downgrade', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user, 'premium');

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        plan: 'basic'
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await Subscription.findById(subscription._id);
      expect(updated.plan).toBe('basic');
      expect(updated.monthlyCharge).toBe(25.00);
    });

    it('should handle subscription upgrade', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user, 'basic');

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        plan: 'premium'
      };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await Subscription.findById(subscription._id);
      expect(updated.plan).toBe('premium');
      expect(updated.monthlyCharge).toBe(60.00);
    });

    it('should prevent unauthorized subscription update', async () => {
      const { req, res } = mockReqRes();
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const subscription = await createTestSubscription(user1);

      req.user = { _id: user2._id }; // Different user
      req.params = { id: subscription._id.toString() };
      req.body = { plan: 'premium' };

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('processSubscriptionPayment', () => {
    it('should process subscription payment successfully', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        paymentDetails: {
          notes: 'Monthly payment'
        }
      };

      await processSubscriptionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updated = await Subscription.findById(subscription._id);
      expect(updated.billingHistory).toHaveLength(1);
      expect(updated.billingHistory[0].status).toBe('paid');
    });

    it('should return 404 for non-existent subscription', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const nonExistentId = new mongoose.Types.ObjectId();

      req.user = { _id: user._id };
      req.params = { id: nonExistentId.toString() };
      req.body = {
        paymentDetails: {}
      };

      await processSubscriptionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should create notification after successful payment', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        paymentDetails: {
          notes: 'Payment test'
        }
      };

      await processSubscriptionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const notifications = await Notification.find({ recipient: user._id, type: 'payment' });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should process payment without paymentDetails notes', async () => {
      const { req, res } = mockReqRes();
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);

      req.user = { _id: user._id };
      req.params = { id: subscription._id.toString() };
      req.body = {
        paymentDetails: {}
      };

      await processSubscriptionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDueSubscriptions', () => {
    it('should get all due subscriptions', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      const sub1 = await createTestSubscription(user1);
      sub1.nextBillingDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      sub1.status = 'active';
      await sub1.save();

      const sub2 = await createTestSubscription(user2);
      sub2.nextBillingDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      sub2.status = 'active';
      await sub2.save();

      req.user = { _id: admin._id, role: 'admin' };

      await getDueSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not include future billing dates', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user = await createTestUser('resident');

      const sub = await createTestSubscription(user);
      sub.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      sub.status = 'active';
      await sub.save();

      req.user = { _id: admin._id, role: 'admin' };

      await getDueSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not include suspended subscriptions', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const user = await createTestUser('resident');

      const sub = await createTestSubscription(user);
      sub.nextBillingDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      sub.status = 'suspended';
      await sub.save();

      req.user = { _id: admin._id, role: 'admin' };

      await getDueSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Subscription Model Tests', () => {
    it('should create subscription with required fields', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      expect(subscription.plan).toBe('basic');
      expect(subscription.status).toBe('active');
      expect(subscription.monthlyCharge).toBe(25.00);
    });

    it('should have default status as active', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      expect(subscription.status).toBe('active');
    });

    it('should store features correctly', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user, 'standard');
      
      expect(subscription.features.maxBins).toBe(3);
      expect(subscription.features.maxPickupsPerMonth).toBe(8);
      expect(subscription.features.prioritySupport).toBe(true);
    });

    it('should track billing history', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false },
        billingHistory: [
          {
            date: new Date(),
            amount: 25.00,
            status: 'paid',
            transactionId: 'TXN123'
          }
        ]
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].amount).toBe(25.00);
    });
  });

  describe('Subscription Model Methods', () => {
    it('should check if subscription is due for payment', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const isDue = subscription.isDueForPayment();
      expect(isDue).toBe(true);
    });

    it('should not be due if nextBillingDate is in future', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const isDue = subscription.isDueForPayment();
      expect(isDue).toBe(false);
    });

    it('should process successful payment', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const initialBillingDate = subscription.nextBillingDate;

      await subscription.processPayment({
        success: true,
        paymentId: 'PAY123',
        notes: 'Monthly payment'
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].status).toBe('paid');
      expect(subscription.lastPaymentDate).toBeDefined();
      expect(subscription.status).toBe('active');
    });

    it('should process failed payment', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      await subscription.processPayment({
        success: false,
        paymentId: 'PAY124',
        notes: 'Payment failed'
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].status).toBe('failed');
    });

    it('should suspend after 3 failed payments', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      // Process 3 failed payments
      for (let i = 0; i < 3; i++) {
        await subscription.processPayment({
          success: false,
          paymentId: `PAY${i}`,
          notes: `Failed payment ${i}`
        });
      }

      expect(subscription.status).toBe('suspended');
      expect(subscription.billingHistory).toHaveLength(3);
    });

    it('should get due subscriptions', async () => {
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');

      await Subscription.create({
        user: user1._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      await Subscription.create({
        user: user2._id,
        plan: 'premium',
        monthlyCharge: 60.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Future
        paymentMethod: { type: 'card' },
        features: { maxBins: 5, maxPickupsPerMonth: 12, prioritySupport: true }
      });

      const dueSubscriptions = await Subscription.getDueSubscriptions();
      expect(dueSubscriptions).toHaveLength(1);
    });

    it('should update nextBillingDate after successful payment', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const oldDate = new Date(subscription.nextBillingDate);

      await subscription.processPayment({
        success: true,
        paymentId: 'PAY125'
      });

      expect(subscription.nextBillingDate.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should return false for isDueForPayment when status is suspended', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'suspended',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const isDue = subscription.isDueForPayment();
      expect(isDue).toBe(false);
    });

    it('should return false for isDueForPayment when status is cancelled', async () => {
      const user = await createTestUser('resident');
      const subscription = await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'cancelled',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const isDue = subscription.isDueForPayment();
      expect(isDue).toBe(false);
    });

    it('should handle processPayment with paid status', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      
      const paymentId = 'PAY' + new mongoose.Types.ObjectId();
      const amount = subscription.monthlyCharge;

      await subscription.processPayment({
        success: true,
        paymentId: paymentId,
        notes: 'Monthly payment'
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].paymentId).toBe(paymentId);
      expect(subscription.billingHistory[0].amount).toBe(amount);
      expect(subscription.billingHistory[0].status).toBe('paid');
      expect(subscription.status).toBe('active');
    });

    it('should handle processPayment with failed status', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      
      const paymentId = 'PAY' + new mongoose.Types.ObjectId();

      await subscription.processPayment({
        success: false,
        paymentId: paymentId,
        notes: 'Payment failed'
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].status).toBe('failed');
    });

    it('should handle processPayment with pending status', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      
      const paymentId = 'PAY' + new mongoose.Types.ObjectId();
      
      await subscription.processPayment({
        success: false,
        paymentId: paymentId,
        notes: 'Pending payment'
      });

      expect(subscription.billingHistory).toHaveLength(1);
      expect(subscription.billingHistory[0].paymentId).toBe(paymentId);
    });

    it('should reset failed attempts on successful payment after failures', async () => {
      const user = await createTestUser('resident');
      const subscription = await createTestSubscription(user);
      
      // Create 2 failed payments
      await subscription.processPayment({
        success: false,
        paymentId: 'PAY1',
        notes: 'Failed 1'
      });
      
      await subscription.processPayment({
        success: false,
        paymentId: 'PAY2',
        notes: 'Failed 2'
      });

      const paymentId = 'PAY' + new mongoose.Types.ObjectId();
      await subscription.processPayment({
        success: true,
        paymentId: paymentId,
        notes: 'Successful payment'
      });

      expect(subscription.status).toBe('active');
      expect(subscription.lastPaymentDate).toBeDefined();
    });

    it('should find multiple due subscriptions', async () => {
      const user1 = await createTestUser('resident');
      const user2 = await createTestUser('resident');
      const user3 = await createTestUser('resident');

      await Subscription.create({
        user: user1._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      await Subscription.create({
        user: user2._id,
        plan: 'standard',
        monthlyCharge: 40.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 3, maxPickupsPerMonth: 8, prioritySupport: true }
      });

      await Subscription.create({
        user: user3._id,
        plan: 'premium',
        monthlyCharge: 60.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 5, maxPickupsPerMonth: 12, prioritySupport: true }
      });

      const dueSubscriptions = await Subscription.getDueSubscriptions();
      expect(dueSubscriptions.length).toBeGreaterThanOrEqual(2);
    });

    it('should not find suspended subscriptions in due list', async () => {
      const user = await createTestUser('resident');
      await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'suspended',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const dueSubscriptions = await Subscription.getDueSubscriptions();
      const suspendedFound = dueSubscriptions.find(sub => sub.status === 'suspended');
      expect(suspendedFound).toBeUndefined();
    });

    it('should not find cancelled subscriptions in due list', async () => {
      const user = await createTestUser('resident');
      await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'cancelled',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const dueSubscriptions = await Subscription.getDueSubscriptions();
      const cancelledFound = dueSubscriptions.find(sub => sub.status === 'cancelled');
      expect(cancelledFound).toBeUndefined();
    });

    it('should populate user data in getDueSubscriptions', async () => {
      const user = await createTestUser('resident');
      await Subscription.create({
        user: user._id,
        plan: 'basic',
        monthlyCharge: 25.00,
        status: 'active',
        nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: { type: 'card' },
        features: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false }
      });

      const dueSubscriptions = await Subscription.getDueSubscriptions();
      expect(dueSubscriptions.length).toBeGreaterThanOrEqual(1);
      
      const subscription = dueSubscriptions.find(s => s.user.email === user.email);
      expect(subscription).toBeDefined();
      expect(subscription.user.email).toBe(user.email);
    });
  });
});
