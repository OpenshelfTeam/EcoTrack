import User from '../models/User.model.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Authority, Operator)
export const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Activate user account
// @route   PATCH /api/users/:id/activate
// @access  Private (Admin)
export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User account activated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Deactivate user account
// @route   PATCH /api/users/:id/deactivate
// @access  Private (Admin)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User account deactivated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin, Authority)
export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      byRole,
      recentUsers,
      userGrowth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.find()
        .select('-password')
        .sort('-createdAt')
        .limit(10),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole,
        recentUsers,
        userGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user activity
// @route   GET /api/users/:id/activity
// @access  Private (Admin, Authority, Owner)
export const getUserActivity = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'authority' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user activity'
      });
    }

    // Import models dynamically to avoid circular dependencies
    const PickupRequest = (await import('../models/PickupRequest.model.js')).default;
    const Ticket = (await import('../models/Ticket.model.js')).default;
    const Payment = (await import('../models/Payment.model.js')).default;
    const Feedback = (await import('../models/Feedback.model.js')).default;

    const [
      pickupRequests,
      tickets,
      payments,
      feedback
    ] = await Promise.all([
      PickupRequest.find({ createdBy: req.params.id })
        .sort('-createdAt')
        .limit(10)
        .select('requestId status wasteType createdAt'),
      Ticket.find({ createdBy: req.params.id })
        .sort('-createdAt')
        .limit(10)
        .select('ticketId subject status priority createdAt'),
      Payment.find({ user: req.params.id })
        .sort('-createdAt')
        .limit(10)
        .select('invoiceId amount status paymentDate'),
      Feedback.find({ user: req.params.id })
        .sort('-createdAt')
        .limit(10)
        .select('category subject rating status createdAt')
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        activity: {
          pickupRequests: {
            count: pickupRequests.length,
            recent: pickupRequests
          },
          tickets: {
            count: tickets.length,
            recent: tickets
          },
          payments: {
            count: payments.length,
            recent: payments
          },
          feedback: {
            count: feedback.length,
            recent: feedback
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
