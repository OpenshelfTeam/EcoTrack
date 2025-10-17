import Subscription from '../models/Subscription.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Get user's subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private (Resident)
export const getMySubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user._id });
    
    if (!subscription) {
      return res.status(404).json({
        message: 'No subscription found. Please create a subscription to use the service.'
      });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Private (Resident)
export const createSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;

    // Check if user already has a subscription
    const existingSubscription = await Subscription.findOne({ user: req.user._id });
    if (existingSubscription) {
      return res.status(400).json({
        message: 'You already have an active subscription. Please update or cancel it first.'
      });
    }

    // Define plan pricing
    const planPricing = {
      basic: 25.00,
      standard: 40.00,
      premium: 60.00
    };

    // Define plan features
    const planFeatures = {
      basic: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false },
      standard: { maxBins: 3, maxPickupsPerMonth: 8, prioritySupport: true },
      premium: { maxBins: 5, maxPickupsPerMonth: 12, prioritySupport: true }
    };

    const selectedPlan = plan || 'basic';
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan: selectedPlan,
      monthlyCharge: planPricing[selectedPlan],
      status: 'active',
      nextBillingDate,
      paymentMethod,
      features: planFeatures[selectedPlan]
    });

    // Create notification
    await Notification.create({
      recipient: req.user._id,
      type: 'system',
      title: 'Subscription Activated',
      message: `Your ${selectedPlan} subscription has been activated. Monthly charge: $${planPricing[selectedPlan]}.`,
      priority: 'medium'
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update subscription plan
// @route   PUT /api/subscriptions/:id
// @access  Private (Resident)
export const updateSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod, autoRenew } = req.body;

    const subscription = await Subscription.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Plan pricing
    const planPricing = {
      basic: 25.00,
      standard: 40.00,
      premium: 60.00
    };

    // Plan features
    const planFeatures = {
      basic: { maxBins: 2, maxPickupsPerMonth: 4, prioritySupport: false },
      standard: { maxBins: 3, maxPickupsPerMonth: 8, prioritySupport: true },
      premium: { maxBins: 5, maxPickupsPerMonth: 12, prioritySupport: true }
    };

    if (plan && plan !== subscription.plan) {
      subscription.plan = plan;
      subscription.monthlyCharge = planPricing[plan];
      subscription.features = planFeatures[plan];
    }

    if (paymentMethod) {
      subscription.paymentMethod = paymentMethod;
    }

    if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }

    await subscription.save();

    res.status(200).json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private (Resident)
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Create notification
    await Notification.create({
      recipient: req.user._id,
      type: 'system',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You can reactivate it anytime.',
      priority: 'high'
    });

    res.status(200).json({
      message: 'Subscription cancelled successfully. You can continue using the service until the end of your billing period.',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process monthly payment for subscription
// @route   POST /api/subscriptions/:id/process-payment
// @access  Private (Resident)
export const processSubscriptionPayment = async (req, res) => {
  try {
    const { paymentDetails } = req.body;

    const subscription = await Subscription.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Simulate payment processing
    const paymentResult = {
      success: true, // In real app, integrate with payment gateway
      paymentId: `PAY-${Date.now()}`,
      notes: paymentDetails?.notes || 'Monthly subscription payment'
    };

    await subscription.processPayment(paymentResult);

    // Create notification
    await Notification.create({
      recipient: req.user._id,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your monthly subscription payment of $${subscription.monthlyCharge} has been processed successfully.`,
      priority: 'medium'
    });

    res.status(200).json({
      message: 'Payment processed successfully',
      subscription,
      payment: paymentResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/subscriptions
// @access  Private (Admin/Authority)
export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, plan } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const subscriptions = await Subscription.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subscriptions due for billing (System/Admin)
// @route   GET /api/subscriptions/due-billing
// @access  Private (Admin)
export const getDueSubscriptions = async (req, res) => {
  try {
    const dueSubscriptions = await Subscription.getDueSubscriptions();

    res.status(200).json({
      count: dueSubscriptions.length,
      subscriptions: dueSubscriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reactivate cancelled subscription
// @route   POST /api/subscriptions/:id/reactivate
// @access  Private (Resident)
export const reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'cancelled' && subscription.status !== 'suspended') {
      return res.status(400).json({ 
        message: 'Only cancelled or suspended subscriptions can be reactivated' 
      });
    }

    subscription.status = 'active';
    subscription.autoRenew = true;
    
    // Set next billing date to next month
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    subscription.nextBillingDate = nextBillingDate;

    await subscription.save();

    // Create notification
    await Notification.create({
      recipient: req.user._id,
      type: 'system',
      title: 'Subscription Reactivated',
      message: `Your subscription has been reactivated. Next billing date: ${nextBillingDate.toLocaleDateString()}.`,
      priority: 'medium'
    });

    res.status(200).json({
      message: 'Subscription reactivated successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
