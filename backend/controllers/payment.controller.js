import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';

// @desc    Get all payments with advanced filtering
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const {
      status,
      paymentType,
      paymentMethod,
      user,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = '-createdAt'
    } = req.query;

    // Build filter query
    const filter = {};

    // If user is a resident, only show their payments
    if (req.user.role === 'resident') {
      filter.user = req.user._id;
    }

    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }

    if (paymentType) {
      if (paymentType.includes(',')) {
        filter.paymentType = { $in: paymentType.split(',') };
      } else {
        filter.paymentType = paymentType;
      }
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (user) {
      filter.user = user;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'invoice.invoiceNumber': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'firstName lastName email phone address')
        .populate('relatedBin', 'binId location')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address')
      .populate('relatedBin', 'binId location');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization for residents
    if (
      req.user.role === 'resident' &&
      payment.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create payment / initiate transaction
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const {
      amount,
      paymentType,
      paymentMethod,
      billingPeriod,
      relatedBin,
      description,
      dueDate
    } = req.body;

    const paymentData = {
      user: req.user._id,
      amount,
      paymentType,
      paymentMethod,
      billingPeriod,
      relatedBin,
      description,
      invoice: {
        invoiceDate: new Date(),
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    };

    const payment = await Payment.create(paymentData);
    await payment.populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Process payment (update status to completed)
// @route   PATCH /api/payments/:id/process
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const {
      paymentDetails,
      gatewayTransactionId
    } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization for residents
    if (
      req.user.role === 'resident' &&
      payment.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this payment'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    payment.status = 'processing';
    
    // Simulate payment processing (in real app, integrate with payment gateway)
    setTimeout(async () => {
      payment.status = 'completed';
      payment.paymentDetails = {
        ...paymentDetails,
        gatewayTransactionId,
        paymentGateway: 'Stripe' // or whatever gateway
      };
      payment.invoice.paidDate = new Date();
      
      await payment.save();
    }, 2000);

    // Immediate response
    payment.status = 'processing';
    await payment.save();
    await payment.populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Payment is being processed',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/payments/:id/status
// @access  Private (Admin, Operator)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, failureReason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = status;

    if (status === 'completed' && !payment.invoice.paidDate) {
      payment.invoice.paidDate = new Date();
    }

    if (status === 'failed' && failureReason) {
      payment.failureReason = failureReason;
    }

    await payment.save();
    await payment.populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refund payment
// @route   PATCH /api/payments/:id/refund
// @access  Private (Admin, Operator)
export const refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    payment.status = 'refunded';
    payment.description = `${payment.description} (Refunded: ${reason})`;

    await payment.save();
    await payment.populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate invoice for user
// @route   POST /api/payments/generate-invoice
// @access  Private (Admin, Operator)
export const generateInvoice = async (req, res) => {
  try {
    const {
      userId,
      amount,
      paymentType,
      billingPeriod,
      dueDate,
      description,
      relatedBin
    } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const payment = await Payment.create({
      user: userId,
      amount,
      paymentType,
      paymentMethod: 'pending', // Will be updated when user pays
      billingPeriod,
      relatedBin,
      description,
      status: 'pending',
      invoice: {
        invoiceDate: new Date(),
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await payment.populate('user', 'firstName lastName email address');

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private (Admin, Operator, Authority)
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          typeCounts: [
            {
              $group: {
                _id: '$paymentType',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          methodCounts: [
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          completed: [
            {
              $match: { status: 'completed' }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          pending: [
            {
              $match: { status: 'pending' }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          overdue: [
            {
              $match: {
                status: 'pending',
                'invoice.dueDate': { $lt: new Date() }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          monthlyRevenue: [
            {
              $match: { status: 'completed' }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$invoice.paidDate' },
                  month: { $month: '$invoice.paidDate' }
                },
                revenue: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
              $limit: 12
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user payment history
// @route   GET /api/payments/user/:userId/history
// @access  Private
export const getUserPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (
      req.user.role === 'resident' &&
      userId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment history'
      });
    }

    const payments = await Payment.find({ user: userId })
      .populate('relatedBin', 'binId')
      .sort('-createdAt');

    const summary = await Payment.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get overdue payments
// @route   GET /api/payments/overdue
// @access  Private (Admin, Operator, Authority)
export const getOverduePayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      status: 'pending',
      'invoice.dueDate': { $lt: new Date() }
    })
      .populate('user', 'firstName lastName email phone')
      .populate('relatedBin', 'binId')
      .sort('invoice.dueDate');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
