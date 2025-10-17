import PickupRequest from '../models/PickupRequest.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Create new pickup request
// @route   POST /api/pickups
// @access  Private (Resident)
export const createPickupRequest = async (req, res) => {
  try {
    const {
      wasteType,
      description,
      quantity,
      images,
      pickupLocation,
      preferredDate,
      timeSlot,
      contactPerson,
      notes
    } = req.body;

    // Check if there's already a scheduled pickup for this date
    const requestedDate = new Date(preferredDate);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    const existingPickup = await PickupRequest.findOne({
      requestedBy: req.user._id,
      preferredDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'approved', 'in-progress'] }
    });

    if (existingPickup) {
      return res.status(400).json({
        success: false,
        message: 'Collection is already scheduled for this date.',
        existingPickup: {
          id: existingPickup._id,
          date: existingPickup.preferredDate,
          status: existingPickup.status,
          timeSlot: existingPickup.timeSlot
        }
      });
    }

    const pickupRequest = await PickupRequest.create({
      requestedBy: req.user._id,
      wasteType,
      description,
      quantity,
      images,
      pickupLocation,
      preferredDate,
      timeSlot,
      contactPerson,
      notes,
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id,
        changedAt: new Date()
      }]
    });

    await pickupRequest.populate('requestedBy', 'firstName lastName email phone');

    // Notify all operators and admins about the new pickup request
    const operators = await User.find({ 
      role: { $in: ['operator', 'admin'] },
      isActive: true 
    });

    const residentName = `${pickupRequest.requestedBy.firstName} ${pickupRequest.requestedBy.lastName}`;
    const wasteTypeDisplay = wasteType.charAt(0).toUpperCase() + wasteType.slice(1);
    const preferredDateDisplay = new Date(preferredDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    for (const operator of operators) {
      await Notification.create({
        recipient: operator._id,
        type: 'pickup-scheduled',
        title: 'New Pickup Request',
        message: `${residentName} has requested a pickup for ${wasteTypeDisplay} waste on ${preferredDateDisplay} (${timeSlot}).`,
        priority: 'medium',
        channel: ['in-app', 'email'],
        relatedEntity: {
          entityType: 'collection',
          entityId: pickupRequest._id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pickup request submitted successfully. Operators have been notified.',
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all pickup requests (with filters)
// @route   GET /api/pickups
// @access  Private
export const getPickupRequests = async (req, res) => {
  try {
    const {
      status,
      wasteType,
      priority,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = '-createdAt'
    } = req.query;

    // Build filter query
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'resident') {
      // Residents can only see their own pickup requests
      filter.requestedBy = req.user._id;
    } else if (req.user.role === 'collector') {
      // Collectors can see their assigned pickups and approved requests
      filter.$or = [
        { assignedCollector: req.user._id },
        { status: 'approved' }
      ];
    }
    // Operators, Admins, and Authority can see ALL pickup requests (no filter)

    if (status) {
      filter.status = status;
    }

    if (wasteType) {
      filter.wasteType = wasteType;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (startDate || endDate) {
      filter.preferredDate = {};
      if (startDate) filter.preferredDate.$gte = new Date(startDate);
      if (endDate) filter.preferredDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'pickupLocation.address': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      PickupRequest.find(filter)
        .populate('requestedBy', 'firstName lastName email phone')
        .populate('assignedCollector', 'firstName lastName email phone')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit)),
      PickupRequest.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single pickup request
// @route   GET /api/pickups/:id
// @access  Private
export const getPickupRequest = async (req, res) => {
  try {
    const pickupRequest = await PickupRequest.findById(req.params.id)
      .populate('requestedBy', 'firstName lastName email phone address')
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate({
        path: 'statusHistory.changedBy',
        select: 'firstName lastName email'
      });

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    // Check authorization
    if (
      req.user.role === 'resident' &&
      pickupRequest.requestedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this pickup request'
      });
    }

    res.status(200).json({
      success: true,
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update pickup request
// @route   PUT /api/pickups/:id
// @access  Private
export const updatePickupRequest = async (req, res) => {
  try {
    let pickupRequest = await PickupRequest.findById(req.params.id);

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    // Check authorization
    if (
      req.user.role === 'resident' &&
      pickupRequest.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pickup request'
      });
    }

    // Residents can only update pending requests
    if (req.user.role === 'resident' && pickupRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending requests'
      });
    }

    pickupRequest = await PickupRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('requestedBy assignedCollector');

    res.status(200).json({
      success: true,
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update pickup request status
// @route   PATCH /api/pickups/:id/status
// @access  Private (Collector, Admin, Operator)
export const updatePickupStatus = async (req, res) => {
  try {
    const { status, notes, rejectionReason, cancellationReason } = req.body;

    const pickupRequest = await PickupRequest.findById(req.params.id);

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    pickupRequest.status = status;
    if (notes) pickupRequest.notes = notes;
    if (rejectionReason) pickupRequest.rejectionReason = rejectionReason;
    if (cancellationReason) pickupRequest.cancellationReason = cancellationReason;

    // Add to status history
    pickupRequest.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes
    });

    // Set completion date
    if (status === 'completed') {
      pickupRequest.completedDate = new Date();
    }

    await pickupRequest.save();
    await pickupRequest.populate('requestedBy assignedCollector');

    res.status(200).json({
      success: true,
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign collector to pickup request
// @route   PATCH /api/pickups/:id/assign
// @access  Private (Admin, Operator)
export const assignCollector = async (req, res) => {
  try {
    const { collectorId, scheduledDate } = req.body;

    const pickupRequest = await PickupRequest.findById(req.params.id);

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    // Verify collector exists and has collector role
    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== 'collector') {
      return res.status(400).json({
        success: false,
        message: 'Invalid collector'
      });
    }

    pickupRequest.assignedCollector = collectorId;
    pickupRequest.scheduledDate = scheduledDate;
    pickupRequest.status = 'scheduled';

    pickupRequest.statusHistory.push({
      status: 'scheduled',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Assigned to ${collector.firstName} ${collector.lastName}`
    });

    await pickupRequest.save();
    await pickupRequest.populate('requestedBy assignedCollector');

    // Notify the assigned collector
    const scheduledDateDisplay = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    await Notification.create({
      recipient: collectorId,
      type: 'pickup-scheduled',
      title: 'New Pickup Assignment',
      message: `You have been assigned to collect ${pickupRequest.wasteType} waste from ${pickupRequest.requestedBy.firstName} ${pickupRequest.requestedBy.lastName} on ${scheduledDateDisplay}.`,
      priority: 'high',
      channel: ['in-app', 'email', 'sms'],
      relatedEntity: {
        entityType: 'collection',
        entityId: pickupRequest._id
      }
    });

    // Notify the resident about the assignment
    await Notification.create({
      recipient: pickupRequest.requestedBy._id,
      type: 'pickup-scheduled',
      title: 'Pickup Scheduled',
      message: `Your pickup request has been scheduled. ${collector.firstName} ${collector.lastName} will collect your ${pickupRequest.wasteType} waste on ${scheduledDateDisplay}.`,
      priority: 'medium',
      channel: ['in-app', 'email'],
      relatedEntity: {
        entityType: 'collection',
        entityId: pickupRequest._id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Collector assigned successfully. Notifications sent to collector and resident.',
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel pickup request
// @route   DELETE /api/pickups/:id
// @access  Private
export const cancelPickupRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const pickupRequest = await PickupRequest.findById(req.params.id);

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    // Check authorization
    if (
      req.user.role === 'resident' &&
      pickupRequest.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this pickup request'
      });
    }

    // Check if can be cancelled
    if (['completed', 'cancelled'].includes(pickupRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this pickup request'
      });
    }

    pickupRequest.status = 'cancelled';
    pickupRequest.cancellationReason = reason;

    pickupRequest.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: reason
    });

    await pickupRequest.save();

    res.status(200).json({
      success: true,
      data: pickupRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pickup statistics
// @route   GET /api/pickups/stats
// @access  Private (Admin, Operator, Collector)
export const getPickupStats = async (req, res) => {
  try {
    const stats = await PickupRequest.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          wasteTypeCounts: [
            {
              $group: {
                _id: '$wasteType',
                count: { $sum: 1 }
              }
            }
          ],
          priorityCounts: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $count: 'count'
            }
          ],
          totalCost: [
            {
              $group: {
                _id: null,
                total: { $sum: '$actualCost' },
                estimated: { $sum: '$estimatedCost' }
              }
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
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
