import CollectionRecord from '../models/CollectionRecord.model.js';
import Route from '../models/Route.model.js';

// @desc    Get all collection records
// @route   GET /api/collections
// @access  Private
export const getCollectionRecords = async (req, res) => {
  try {
    const { status, collector, route } = req.query;
    let query = {};

    if (status) query.status = status;
    if (collector) query.collector = collector;
    if (route) query.route = route;

    const records = await CollectionRecord.find(query)
      .populate('bin', 'binId location')
      .populate('collector', 'firstName lastName')
      .populate('route', 'routeName routeCode')
      .sort({ collectionDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create collection record
// @route   POST /api/collections
// @access  Private (Collector)
export const createCollectionRecord = async (req, res) => {
  try {
    req.body.collector = req.user.id;
    const record = await CollectionRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get routes
// @route   GET /api/collections/routes
// @access  Private
export const getRoutes = async (req, res) => {
  try {
    const { status, assignedCollector } = req.query;
    let query = {};

    if (status) query.status = status;
    if (assignedCollector) query.assignedCollector = assignedCollector;

    const routes = await Route.find(query)
      .populate('assignedCollector', 'firstName lastName phone')
      .populate('bins', 'binId location currentLevel')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create route
// @route   POST /api/collections/routes
// @access  Private (Authority, Operator)
export const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);

    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
