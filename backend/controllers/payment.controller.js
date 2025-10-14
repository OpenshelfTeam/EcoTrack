import Payment from '../models/Payment.model.js';

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const { status, paymentType, user } = req.query;
    let query = {};

    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (user) query.user = user;

    // If user is a resident, only show their payments
    if (req.user.role === 'resident') {
      query.user = req.user.id;
    }

    const payments = await Payment.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

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

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const payment = await Payment.create(req.body);

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
