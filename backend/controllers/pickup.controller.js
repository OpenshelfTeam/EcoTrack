import PickupRequest from '../models/PickupRequest.model.js';
import User from '../models/User.model.js';

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

    res.status(201).json({
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
      filter.requestedBy = req.user._id;
    } else if (req.user.role === 'collector') {
      filter.$or = [
        { assignedCollector: req.user._id },
        { status: 'approved' } // Collectors can see approved requests
      ];
    }

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
