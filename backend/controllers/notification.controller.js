import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// @desc    Get user notifications with filters and pagination
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      priority, 
      unreadOnly, 
      page = 1, 
      limit = 20,
      sortBy = '-createdAt' 
    } = req.query;

    const filter = { recipient: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (unreadOnly === 'true') filter.readAt = { $exists: false };

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, readAt: { $exists: false } })
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
export const getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Authorization check
    if (notification.recipient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notification'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Admin, System)
export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private (Admin)
export const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private (Owner, Admin)
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Authorization check
    if (notification.recipient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Authorization check
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    notification.readAt = new Date();
    notification.status = 'read';
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, readAt: { $exists: false } },
      { readAt: new Date(), status: 'read' }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
export const deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      readAt: { $exists: true }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');

    res.status(200).json({
      success: true,
      data: user.notificationPreferences || {
        email: true,
        sms: false,
        push: true,
        'in-app': true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: req.body },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send bulk notifications
// @route   POST /api/notifications/bulk
// @access  Private (Admin, Authority)
export const sendBulkNotification = async (req, res) => {
  try {
    const { recipients, type, title, message, priority, channel } = req.body;

    // If recipients is 'all', send to all users
    let recipientIds = recipients;
    if (recipients === 'all') {
      const users = await User.find({ isActive: true }).select('_id');
      recipientIds = users.map(user => user._id);
    }

    // Create notifications for all recipients
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      priority: priority || 'medium',
      channel: channel || ['in-app'],
      status: 'sent',
      sentAt: new Date()
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} notifications sent successfully`,
      count: createdNotifications.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private (Admin, Authority)
export const getNotificationStats = async (req, res) => {
  try {
    const [
      totalNotifications,
      sentNotifications,
      readNotifications,
      pendingNotifications,
      byType,
      byPriority,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'sent' }),
      Notification.countDocuments({ readAt: { $exists: true } }),
      Notification.countDocuments({ status: 'pending' }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Notification.find()
        .populate('recipient', 'firstName lastName')
        .sort('-createdAt')
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalNotifications,
        sent: sentNotifications,
        read: readNotifications,
        pending: pendingNotifications,
        byType,
        byPriority,
        recentNotifications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
