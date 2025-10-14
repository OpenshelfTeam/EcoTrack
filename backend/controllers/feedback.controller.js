import Feedback from '../models/Feedback.model.js';

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private
export const getFeedback = async (req, res) => {
  try {
    let query = {};

    // Authority and admin can see all feedback
    if (req.user.role === 'resident') {
      query.user = req.user.id;
    }

    const feedback = await Feedback.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
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
    req.body.user = req.user.id;
    const feedback = await Feedback.create(req.body);

    res.status(201).json({
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
