import SmartBin from '../models/SmartBin.model.js';

// @desc    Get all smart bins
// @route   GET /api/smart-bins
// @access  Private
export const getSmartBins = async (req, res) => {
  try {
    const { status, binType, assignedTo } = req.query;
    let query = {};

    if (status) query.status = status;
    if (binType) query.binType = binType;
    if (assignedTo) query.assignedTo = assignedTo;

    const bins = await SmartBin.find(query).populate('assignedTo', 'firstName lastName email phone');

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
// @access  Private (Operator, Admin)
export const createSmartBin = async (req, res) => {
  try {
    const bin = await SmartBin.create(req.body);

    res.status(201).json({
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
    const { userId } = req.body;
    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Smart bin not found'
      });
    }

    bin.assignedTo = userId;
    bin.status = 'assigned';
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
