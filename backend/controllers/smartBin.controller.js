import SmartBin from '../models/SmartBin.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import Payment from '../models/Payment.model.js';
import Delivery from '../models/Delivery.model.js';

// @desc    Get all smart bins with advanced filtering
// @route   GET /api/smart-bins
// @access  Private
export const getSmartBins = async (req, res) => {
  try {
    const {
      status,
      binType,
      assignedTo,
      search,
      minLevel,
      maxLevel,
      page = 1,
      limit = 10,
      sortBy = '-createdAt',
      view = 'list' // list, grid, map
    } = req.query;

    // Build filter query
    const filter = {};

    // Role-based filtering: Residents only see their own bins
    if (req.user.role === 'resident') {
      filter.createdBy = req.user.id;
    }
    // Collectors, Operators, Admins, and Authorities see all bins
    // (no additional filter needed)

    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }

    if (binType) {
      if (binType.includes(',')) {
        filter.binType = { $in: binType.split(',') };
      } else {
        filter.binType = binType;
      }
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (minLevel !== undefined || maxLevel !== undefined) {
      filter.currentLevel = {};
      if (minLevel) filter.currentLevel.$gte = parseFloat(minLevel);
      if (maxLevel) filter.currentLevel.$lte = parseFloat(maxLevel);
    }

    if (search) {
      filter.$or = [
        { binId: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { qrCode: { $regex: search, $options: 'i' } },
        { rfidTag: { $regex: search, $options: 'i' } }
      ];
    }

    // For map view, return all bins with coordinates
    if (view === 'map') {
      const bins = await SmartBin.find(filter)
        .populate('assignedTo', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName email')
        .select('binId location currentLevel capacity status binType createdBy')
        .lean();

      return res.status(200).json({
        success: true,
        count: bins.length,
        data: bins
      });
    }

    const skip = (page - 1) * limit;

    const [bins, total] = await Promise.all([
      SmartBin.find(filter)
        .populate('assignedTo', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName email')
        .populate('maintenanceHistory.performedBy', 'firstName lastName')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit)),
      SmartBin.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: bins.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single smart bin
// @route   GET /api/smart-bins/:id
// @access  Private
export const getSmartBin = async (req, res) => {
  try {
    const bin = await SmartBin.findById(req.params.id).populate('assignedTo', 'firstName lastName email phone address');

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create smart bin
// @route   POST /api/smart-bins
// @access  Private (Resident, Collector, Operator, Admin)
export const createSmartBin = async (req, res) => {
  try {
    // Automatically set createdBy to the current user
    const binData = {
      ...req.body,
      createdBy: req.user.id
    };

    const bin = await SmartBin.create(binData);

    // Get the user who created the bin
    const creator = await User.findById(req.user.id);
    
    // Send notifications to collectors, admins, and the creator
    const notificationPromises = [];

    // 1. Notify all active collectors
    const collectors = await User.find({ 
      role: 'collector', 
      status: 'active' 
    }).select('_id');

    collectors.forEach(collector => {
      notificationPromises.push(
        Notification.create({
          recipient: collector._id,
          type: 'bin-delivered',
          title: '🗑️ New Bin Added',
          message: `A new ${bin.binType} waste bin has been registered at ${bin.location?.address || 'unknown location'}. Check the map for details.`,
          priority: 'medium',
          channel: ['in-app', 'push'],
          relatedEntity: {
            entityType: 'bin',
            entityId: bin._id
          },
          metadata: {
            actionUrl: '/map',
            actionLabel: 'View on Map'
          }
        })
      );
    });

    // 2. Notify all admins
    const admins = await User.find({ 
      role: 'admin', 
      status: 'active' 
    }).select('_id');

    admins.forEach(admin => {
      notificationPromises.push(
        Notification.create({
          recipient: admin._id,
          type: 'bin-delivered',
          title: '🗑️ New Bin Registered',
          message: `${creator?.firstName || 'A user'} registered a new ${bin.binType} bin (ID: ${bin.binId}) at ${bin.location?.address || 'unknown location'}.`,
          priority: 'low',
          channel: ['in-app'],
          relatedEntity: {
            entityType: 'bin',
            entityId: bin._id
          },
          metadata: {
            actionUrl: '/bins',
            actionLabel: 'View Bins'
          }
        })
      );
    });

    // 3. Notify the creator (resident/user who added the bin)
    if (creator) {
      notificationPromises.push(
        Notification.create({
          recipient: creator._id,
          type: 'bin-activated',
          title: '✅ Bin Successfully Registered',
          message: `Your ${bin.binType} waste bin at ${bin.location?.address || 'your location'} has been successfully registered. Collectors will be notified for regular pickups.`,
          priority: 'high',
          channel: ['in-app', 'email'],
          relatedEntity: {
            entityType: 'bin',
            entityId: bin._id
          },
          metadata: {
            actionUrl: '/bins',
            actionLabel: 'View My Bins'
          }
        })
      );
    }

    // Send all notifications
    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      data: bin,
      message: 'Bin created successfully and notifications sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update smart bin
// @route   PUT /api/smart-bins/:id
// @access  Private (Operator, Collector, Admin)
export const updateSmartBin = async (req, res) => {
  try {
    const bin = await SmartBin.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete smart bin
// @route   DELETE /api/smart-bins/:id
// @access  Private (Admin)
export const deleteSmartBin = async (req, res) => {
  try {
    const bin = await SmartBin.findByIdAndDelete(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
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

// @desc    Assign bin to resident
// @route   POST /api/smart-bins/:id/assign
// @access  Private (Operator, Admin)
export const assignBin = async (req, res) => {
  try {
    const { userId, deliveryDate } = req.body;
    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify payment: look for a completed payment for installation-fee or service-charge linked to this user
    const payment = await Payment.findOne({ user: userId, status: 'completed', $or: [{ paymentType: 'installation-fee' }, { paymentType: 'service-charge' }] });

    if (!payment) {
      return res.status(400).json({ success: false, message: 'Resident payment not verified. Please ensure payment account is active.' });
    }

    // Assign bin and set status to assigned
    bin.assignedTo = userId;
    bin.status = 'assigned';
    bin.deliveryDate = deliveryDate || new Date();
    await bin.save();

    // Create delivery record
    const delivery = await Delivery.create({
      bin: bin._id,
      resident: userId,
      scheduledDate: bin.deliveryDate
    });

    await bin.populate('assignedTo', 'firstName lastName email phone address');

    res.status(200).json({
      success: true,
      data: { bin, delivery }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Activate bin
// @route   PATCH /api/smart-bins/:id/activate
// @access  Private (Operator, Collector, Admin)
export const activateBin = async (req, res) => {
  try {
    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    bin.status = 'active';
    bin.activationDate = new Date();
    await bin.save();

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update bin level (IoT sensor data)
// @route   PATCH /api/smart-bins/:id/level
// @access  Private
export const updateBinLevel = async (req, res) => {
  try {
    const { currentLevel, batteryLevel, temperature } = req.body;

    const bin = await SmartBin.findByIdAndUpdate(
      req.params.id,
      {
        currentLevel,
        'sensorData.batteryLevel': batteryLevel,
        'sensorData.temperature': temperature,
        'sensorData.lastUpdate': new Date()
      },
      { new: true, runValidators: true }
    );

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add maintenance record
// @route   POST /api/smart-bins/:id/maintenance
// @access  Private (Collector, Operator, Admin)
export const addMaintenance = async (req, res) => {
  try {
    const { type, description } = req.body;

    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    bin.maintenanceHistory.push({
      date: new Date(),
      type,
      description,
      performedBy: req.user._id
    });

    if (type === 'repair') {
      bin.status = 'active'; // Return to active after repair
    }

    await bin.save();
    await bin.populate('maintenanceHistory.performedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Empty bin (record emptying)
// @route   PATCH /api/smart-bins/:id/empty
// @access  Private (Collector)
export const emptyBin = async (req, res) => {
  try {
    const bin = await SmartBin.findByIdAndUpdate(
      req.params.id,
      {
        currentLevel: 0,
        lastEmptied: new Date()
      },
      { new: true }
    );

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get bins statistics
// @route   GET /api/smart-bins/stats
// @access  Private
export const getBinStats = async (req, res) => {
  try {
    const stats = await SmartBin.aggregate([
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
          typeCounts: [
            {
              $group: {
                _id: '$binType',
                count: { $sum: 1 }
              }
            }
          ],
          fillLevels: [
            {
              $bucket: {
                groupBy: '$currentLevel',
                boundaries: [0, 25, 50, 75, 90, 100],
                default: 'other',
                output: {
                  count: { $sum: 1 },
                  bins: { $push: '$binId' }
                }
              }
            }
          ],
          total: [
            {
              $count: 'count'
            }
          ],
          avgLevel: [
            {
              $group: {
                _id: null,
                average: { $avg: '$currentLevel' }
              }
            }
          ],
          needsCollection: [
            {
              $match: {
                currentLevel: { $gte: 80 }
              }
            },
            {
              $count: 'count'
            }
          ],
          lowBattery: [
            {
              $match: {
                'sensorData.batteryLevel': { $lt: 20 }
              }
            },
            {
              $count: 'count'
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

// @desc    Get bins near location
// @route   GET /api/smart-bins/nearby
// @access  Private
export const getNearbyBins = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const bins = await SmartBin.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('assignedTo', 'firstName lastName');

    res.status(200).json({
      success: true,
      count: bins.length,
      data: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get bins requiring collection (>80% full)
// @route   GET /api/smart-bins/needs-collection
// @access  Private (Collector, Operator, Admin)
export const getBinsNeedingCollection = async (req, res) => {
  try {
    const bins = await SmartBin.find({
      currentLevel: { $gte: 80 },
      status: { $in: ['active', 'assigned'] }
    })
      .populate('assignedTo', 'firstName lastName email phone address')
      .sort('-currentLevel');

    res.status(200).json({
      success: true,
      count: bins.length,
      data: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
