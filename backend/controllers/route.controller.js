import Route from '../models/Route.model.js';
import SmartBin from '../models/SmartBin.model.js';
import User from '../models/User.model.js';

// @desc    Get all routes with advanced filtering and pagination
// @route   GET /api/routes
// @access  Private
export const getRoutes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      area,
      assignedCollector,
      priority,
      startDate,
      endDate,
      search,
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (area) query.area = { $regex: area, $options: 'i' };
    if (assignedCollector) query.assignedCollector = assignedCollector;
    if (priority) query.priority = priority;
    
    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    
    // Search by route name or code
    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { routeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'collector') {
      query.assignedCollector = req.user._id;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const routes = await Route.find(query)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Route.countDocuments(query);

    res.json({
      success: true,
      data: {
        routes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching routes',
      error: error.message
    });
  }
};

// @desc    Get single route by ID
// @route   GET /api/routes/:id
// @access  Private
export const getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate({
        path: 'bins',
        select: 'binId location currentLevel capacity binType status lastEmptied',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email'
        }
      });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check access
    if (req.user.role === 'collector' && route.assignedCollector._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this route'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message
    });
  }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private (Operator, Authority, Admin)
export const createRoute = async (req, res) => {
  try {
    const {
      routeName,
      assignedCollector,
      area,
      bins,
      scheduledDate,
      scheduledTime,
      priority,
      notes
    } = req.body;

    // Validate collector exists and has collector role
    const collector = await User.findById(assignedCollector);
    if (!collector || collector.role !== 'collector') {
      return res.status(400).json({
        success: false,
        message: 'Invalid collector selected'
      });
    }

    // Validate bins exist
    if (bins && bins.length > 0) {
      const validBins = await SmartBin.find({ _id: { $in: bins } });
      if (validBins.length !== bins.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid bins selected'
        });
      }
    }

    // Generate unique route code
    const lastRoute = await Route.findOne().sort({ createdAt: -1 });
    let routeNumber = 1;
    if (lastRoute && lastRoute.routeCode) {
      const lastNumber = parseInt(lastRoute.routeCode.replace('RT', ''));
      routeNumber = lastNumber + 1;
    }
    const routeCode = `RT${routeNumber.toString().padStart(5, '0')}`;

    const route = await Route.create({
      routeName,
      routeCode,
      assignedCollector,
      area,
      bins: bins || [],
      scheduledDate,
      scheduledTime,
      priority: priority || 'medium',
      totalBins: bins ? bins.length : 0,
      notes
    });

    const populatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.status(201).json({
      success: true,
      data: populatedRoute,
      message: 'Route created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating route',
      error: error.message
    });
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private (Operator, Authority, Admin)
export const updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Don't allow updating completed routes
    if (route.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed route'
      });
    }

    const {
      routeName,
      assignedCollector,
      area,
      bins,
      scheduledDate,
      scheduledTime,
      priority,
      notes
    } = req.body;

    // Validate collector if changed
    if (assignedCollector && assignedCollector !== route.assignedCollector.toString()) {
      const collector = await User.findById(assignedCollector);
      if (!collector || collector.role !== 'collector') {
        return res.status(400).json({
          success: false,
          message: 'Invalid collector selected'
        });
      }
    }

    // Validate bins if changed
    if (bins && bins.length > 0) {
      const validBins = await SmartBin.find({ _id: { $in: bins } });
      if (validBins.length !== bins.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid bins selected'
        });
      }
    }

    // Update fields
    if (routeName) route.routeName = routeName;
    if (assignedCollector) route.assignedCollector = assignedCollector;
    if (area) route.area = area;
    if (bins) {
      route.bins = bins;
      route.totalBins = bins.length;
    }
    if (scheduledDate) route.scheduledDate = scheduledDate;
    if (scheduledTime) route.scheduledTime = scheduledTime;
    if (priority) route.priority = priority;
    if (notes !== undefined) route.notes = notes;

    await route.save();

    const updatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.json({
      success: true,
      data: updatedRoute,
      message: 'Route updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating route',
      error: error.message
    });
  }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private (Authority, Admin)
export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Don't allow deleting in-progress or completed routes
    if (route.status === 'in-progress' || route.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete route that is in-progress or completed'
      });
    }

    await route.deleteOne();

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting route',
      error: error.message
    });
  }
};

// @desc    Update route status
// @route   PATCH /api/routes/:id/status
// @access  Private (Collector can update their own routes)
export const updateRouteStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if collector is updating their own route
    if (req.user.role === 'collector' && route.assignedCollector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this route'
      });
    }

    // Validate status transition
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    route.status = status;
    if (notes) route.notes = notes;

    // Set timestamps
    if (status === 'in-progress' && !route.startTime) {
      route.startTime = new Date();
    } else if (status === 'completed' && !route.endTime) {
      route.endTime = new Date();
    }

    await route.save();

    const updatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.json({
      success: true,
      data: updatedRoute,
      message: `Route ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating route status',
      error: error.message
    });
  }
};

// @desc    Start route (collector)
// @route   PATCH /api/routes/:id/start
// @access  Private (Collector)
export const startRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if collector is starting their own route
    if (route.assignedCollector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this route'
      });
    }

    if (route.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Route cannot be started'
      });
    }

    route.status = 'in-progress';
    route.startTime = new Date();
    await route.save();

    const updatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.json({
      success: true,
      data: updatedRoute,
      message: 'Route started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting route',
      error: error.message
    });
  }
};

// @desc    Complete route (collector)
// @route   PATCH /api/routes/:id/complete
// @access  Private (Collector)
export const completeRoute = async (req, res) => {
  try {
    const { distance, collectedBins } = req.body;
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if collector is completing their own route
    if (route.assignedCollector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this route'
      });
    }

    if (route.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Route is not in progress'
      });
    }

    route.status = 'completed';
    route.endTime = new Date();
    if (distance) route.distance = distance;
    if (collectedBins !== undefined) route.collectedBins = collectedBins;

    await route.save();

    const updatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.json({
      success: true,
      data: updatedRoute,
      message: 'Route completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing route',
      error: error.message
    });
  }
};

// @desc    Optimize route (reorder bins for shortest path)
// @route   POST /api/routes/:id/optimize
// @access  Private (Operator, Authority, Admin)
export const optimizeRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate('bins');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    if (route.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only optimize pending routes'
      });
    }

    if (!route.bins || route.bins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Route has no bins to optimize'
      });
    }

    // Simple greedy nearest-neighbor algorithm
    // In production, use more sophisticated algorithms like TSP solvers
    const optimizedBins = [];
    const remainingBins = [...route.bins];
    
    // Start with first bin
    let currentBin = remainingBins.shift();
    optimizedBins.push(currentBin._id);

    while (remainingBins.length > 0) {
      // Find nearest bin to current position
      let nearestBin = remainingBins[0];
      let minDistance = calculateDistance(
        currentBin.location.coordinates,
        nearestBin.location.coordinates
      );

      for (let i = 1; i < remainingBins.length; i++) {
        const distance = calculateDistance(
          currentBin.location.coordinates,
          remainingBins[i].location.coordinates
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestBin = remainingBins[i];
        }
      }

      optimizedBins.push(nearestBin._id);
      currentBin = nearestBin;
      remainingBins.splice(remainingBins.indexOf(nearestBin), 1);
    }

    route.bins = optimizedBins;
    await route.save();

    const updatedRoute = await Route.findById(route._id)
      .populate('assignedCollector', 'firstName lastName email phone')
      .populate('bins', 'binId location currentLevel binType status');

    res.json({
      success: true,
      data: updatedRoute,
      message: 'Route optimized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message
    });
  }
};

// @desc    Get route statistics
// @route   GET /api/routes/stats
// @access  Private
export const getRouteStats = async (req, res) => {
  try {
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'collector') {
      query.assignedCollector = req.user._id;
    }

    const [statusCounts, priorityCounts, todayRoutes, upcomingRoutes, completionStats] = await Promise.all([
      // Count by status
      Route.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Count by priority
      Route.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      // Today's routes
      Route.countDocuments({
        ...query,
        scheduledDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      
      // Upcoming routes (next 7 days)
      Route.countDocuments({
        ...query,
        scheduledDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: 'pending'
      }),
      
      // Completion statistics
      Route.aggregate([
        { 
          $match: { 
            ...query,
            status: 'completed',
            startTime: { $exists: true },
            endTime: { $exists: true }
          } 
        },
        {
          $project: {
            duration: { $subtract: ['$endTime', '$startTime'] },
            distance: 1,
            collectedBins: 1,
            totalBins: 1
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            avgDistance: { $avg: '$distance' },
            totalDistance: { $sum: '$distance' },
            totalBinsCollected: { $sum: '$collectedBins' },
            completedRoutes: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format status counts
    const statusMap = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };
    statusCounts.forEach(item => {
      statusMap[item._id] = item.count;
    });

    // Format priority counts
    const priorityMap = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    priorityCounts.forEach(item => {
      priorityMap[item._id] = item.count;
    });

    const completionData = completionStats[0] || {
      avgDuration: 0,
      avgDistance: 0,
      totalDistance: 0,
      totalBinsCollected: 0,
      completedRoutes: 0
    };

    res.json({
      success: true,
      data: {
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        ...statusMap,
        byPriority: priorityMap,
        todayRoutes,
        upcomingRoutes,
        avgDuration: Math.round(completionData.avgDuration / 1000 / 60), // Convert to minutes
        avgDistance: Math.round(completionData.avgDistance * 10) / 10, // Round to 1 decimal
        totalDistance: Math.round(completionData.totalDistance * 10) / 10,
        totalBinsCollected: completionData.totalBinsCollected,
        completedRoutes: completionData.completedRoutes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route statistics',
      error: error.message
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
