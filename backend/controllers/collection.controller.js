import CollectionRecord from '../models/CollectionRecord.model.js';
import Route from '../models/Route.model.js';
import SmartBin from '../models/SmartBin.model.js';

// @desc    Get all collection records with filtering
// @route   GET /api/collections
// @access  Private
export const getCollectionRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      collector,
      route,
      wasteType,
      startDate,
      endDate,
      sortBy = 'collectionDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (collector) query.collector = collector;
    if (route) query.route = route;
    if (wasteType) query.wasteType = wasteType;
    
    if (startDate || endDate) {
      query.collectionDate = {};
      if (startDate) query.collectionDate.$gte = new Date(startDate);
      if (endDate) query.collectionDate.$lte = new Date(endDate);
    }

    if (req.user.role === 'collector') {
      query.collector = req.user._id;
    } else if (req.user.role === 'resident') {
      query.resident = req.user._id;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const records = await CollectionRecord.find(query)
      .populate('bin', 'binId location binType status')
      .populate('collector', 'firstName lastName email phone')
      .populate('resident', 'firstName lastName email')
      .populate('route', 'routeName routeCode area scheduledDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CollectionRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single collection record
// @route   GET /api/collections/:id
// @access  Private
export const getCollectionRecord = async (req, res) => {
  try {
    const record = await CollectionRecord.findById(req.params.id)
      .populate('bin', 'binId location binType status capacity')
      .populate('collector', 'firstName lastName email phone')
      .populate('resident', 'firstName lastName email phone')
      .populate('route', 'routeName routeCode area scheduledDate');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Collection record not found' });
    }

    if (req.user.role === 'collector' && record.collector._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'resident' && record.resident && record.resident._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create collection record
// @route   POST /api/collections
// @access  Private (Collector)
export const createCollectionRecord = async (req, res) => {
  try {
    const {
      route: routeId,
      bin: binId,
      wasteWeight,
      wasteType,
      binLevelBefore,
      binLevelAfter,
      status,
      notes,
      verificationCode,
      location,
      exceptionReported,
      exceptionReason,
      exceptionDescription
    } = req.body;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const bin = await SmartBin.findById(binId).populate('createdBy');
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    // Prepare exception data if reported
    const exceptionData = exceptionReported === 'true' || exceptionReported === true ? {
      reported: true,
      reason: exceptionReason || 'Unknown',
      description: exceptionDescription || '',
    } : {
      reported: false
    };

    const record = await CollectionRecord.create({
      route: routeId,
      bin: binId,
      collector: req.user._id,
      resident: bin.createdBy ? bin.createdBy._id : null,
      collectionDate: new Date(),
      wasteWeight: wasteWeight || 0,
      wasteType: wasteType || bin.binType,
      binLevelBefore: binLevelBefore !== undefined ? binLevelBefore : bin.currentLevel,
      binLevelAfter: binLevelAfter !== undefined ? binLevelAfter : 0,
      status: status || 'collected',
      location: location || bin.location,
      notes,
      verificationCode,
      exception: exceptionData
    });

    // Update bin status based on collection type
    if (status === 'collected') {
      bin.currentLevel = binLevelAfter !== undefined ? binLevelAfter : 0;
      bin.lastEmptied = new Date();
      await bin.save();
      
      route.collectedBins = (route.collectedBins || 0) + 1;
      await route.save();
    } else if (status === 'exception') {
      // Mark bin as needing attention
      bin.status = 'maintenance-required';
      await bin.save();
    }

    const populatedRecord = await CollectionRecord.findById(record._id)
      .populate('bin', 'binId location binType')
      .populate('collector', 'firstName lastName email')
      .populate('resident', 'firstName lastName email')
      .populate('route', 'routeName routeCode');

    res.status(201).json({ success: true, data: populatedRecord, message: 'Collection recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update collection record
// @route   PUT /api/collections/:id
// @access  Private
export const updateCollectionRecord = async (req, res) => {
  try {
    const record = await CollectionRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Collection record not found' });
    }

    if (req.user.role === 'collector' && record.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { wasteWeight, wasteType, binLevelAfter, status, notes, exception } = req.body;

    if (wasteWeight !== undefined) record.wasteWeight = wasteWeight;
    if (wasteType) record.wasteType = wasteType;
    if (binLevelAfter !== undefined) record.binLevelAfter = binLevelAfter;
    if (status) record.status = status;
    if (notes !== undefined) record.notes = notes;
    if (exception) record.exception = { ...record.exception, ...exception };

    await record.save();

    const updatedRecord = await CollectionRecord.findById(record._id)
      .populate('bin', 'binId location binType')
      .populate('collector', 'firstName lastName email')
      .populate('resident', 'firstName lastName email')
      .populate('route', 'routeName routeCode');

    res.json({ success: true, data: updatedRecord, message: 'Collection record updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete collection record
// @route   DELETE /api/collections/:id
// @access  Private (Authority, Admin)
export const deleteCollectionRecord = async (req, res) => {
  try {
    const record = await CollectionRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Collection record not found' });
    }

    await record.deleteOne();
    res.json({ success: true, message: 'Collection record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get collection statistics
// @route   GET /api/collections/stats
// @access  Private
export const getCollectionStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'collector') query.collector = req.user._id;

    const [statusCounts, wasteTypeCounts, todayCollections, weekCollections, totalWeight] = await Promise.all([
      CollectionRecord.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      CollectionRecord.aggregate([
        { $match: query },
        { $group: { _id: '$wasteType', count: { $sum: 1 }, totalWeight: { $sum: '$wasteWeight' } } }
      ]),
      CollectionRecord.countDocuments({
        ...query,
        collectionDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      CollectionRecord.countDocuments({
        ...query,
        collectionDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      CollectionRecord.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$wasteWeight' } } }
      ])
    ]);

    const statusMap = { collected: 0, 'partially-collected': 0, missed: 0, exception: 0 };
    statusCounts.forEach(item => { statusMap[item._id] = item.count; });

    const wasteTypeMap = {};
    wasteTypeCounts.forEach(item => {
      wasteTypeMap[item._id] = { count: item.count, weight: Math.round(item.totalWeight * 10) / 10 };
    });

    res.json({
      success: true,
      data: {
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        ...statusMap,
        byWasteType: wasteTypeMap,
        todayCollections,
        weekCollections,
        totalWeightCollected: totalWeight[0] ? Math.round(totalWeight[0].total * 10) / 10 : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get collection schedule
// @route   GET /api/collections/schedule
// @access  Private
export const getCollectionSchedule = async (req, res) => {
  try {
    const { startDate, endDate, collector } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date required' });
    }

    const query = {
      scheduledDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (req.user.role === 'collector') {
      query.assignedCollector = req.user._id;
    } else if (collector) {
      query.assignedCollector = collector;
    }

    const routes = await Route.find(query)
      .populate('assignedCollector', 'firstName lastName email')
      .populate('bins', 'binId location currentLevel binType')
      .sort({ scheduledDate: 1 });

    const schedule = {};
    routes.forEach(route => {
      const dateKey = route.scheduledDate.toISOString().split('T')[0];
      if (!schedule[dateKey]) schedule[dateKey] = [];
      schedule[dateKey].push(route);
    });

    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get routes
// @route   GET /api/collections/routes
// @access  Private
export const getRoutes = async (req, res) => {
  try {
    const { status, assignedCollector } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedCollector) query.assignedCollector = assignedCollector;

    const routes = await Route.find(query)
      .populate('assignedCollector', 'firstName lastName phone')
      .populate('bins', 'binId location currentLevel')
      .sort({ scheduledDate: -1 });

    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create route
// @route   POST /api/collections/routes
// @access  Private (Authority, Operator)
export const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
