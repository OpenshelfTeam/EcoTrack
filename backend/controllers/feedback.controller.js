import Feedback from '../models/Feedback.model.js';

// @desc    Get all feedback with filters and pagination
// @route   GET /api/feedback
// @access  Private
export const getAllFeedback = async (req, res) => {
  try {
    const { status, category, rating, search, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'resident') {
      filter.user = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (rating) filter.rating = Number(rating);
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'firstName lastName email phone')
        .populate('response.respondedBy', 'firstName lastName role')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit)),
      Feedback.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: feedback.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
export const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('response.respondedBy', 'firstName lastName role');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Authorization check
    if (req.user.role === 'resident' && feedback.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private
export const createFeedback = async (req, res) => {
  try {
    const { category, subject, message, rating, attachments } = req.body;

    const feedback = await Feedback.create({
      user: req.user._id,
      category,
      subject,
      message,
      rating,
      attachments,
      status: 'submitted'
    });

    await feedback.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private
export const updateFeedback = async (req, res) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Authorization check - only owner can update
    if (feedback.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this feedback'
      });
    }

    // Only allow updating if status is pending
    if (feedback.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update feedback that has been reviewed'
      });
    }

    feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Admin, Owner)
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && feedback.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this feedback'
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Respond to feedback
// @route   POST /api/feedback/:id/respond
// @access  Private (Authority, Admin)
export const respondToFeedback = async (req, res) => {
  try {
    const { response } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.response = response;
    feedback.respondedBy = req.user._id;
    feedback.respondedAt = new Date();
    feedback.status = 'responded';

    await feedback.save();
    await feedback.populate(['user', 'respondedBy']);

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update feedback status
// @route   PATCH /api/feedback/:id/status
// @access  Private (Authority, Admin)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get feedback statistics
// @route   GET /api/feedback/stats
// @access  Private (Authority, Admin)
export const getFeedbackStats = async (req, res) => {
  try {
    const [
      totalFeedback,
      pendingFeedback,
      respondedFeedback,
      resolvedFeedback,
      byCategory,
      avgRating,
      recentFeedback
    ] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'submitted' }),
      Feedback.countDocuments({ status: 'under-review' }),
      Feedback.countDocuments({ status: 'addressed' }),
      Feedback.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Feedback.find()
        .populate('user', 'firstName lastName')
        .sort('-createdAt')
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalFeedback,
        pending: pendingFeedback,
        responded: respondedFeedback,
        resolved: resolvedFeedback,
        byCategory,
        averageRating: avgRating[0]?.avgRating || 0,
        recentFeedback
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
