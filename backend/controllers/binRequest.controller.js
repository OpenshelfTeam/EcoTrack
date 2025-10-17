import BinRequest from '../models/BinRequest.model.js';
import User from '../models/User.model.js';
import SmartBin from '../models/SmartBin.model.js';

// Create a new bin request (resident)
export const createBinRequest = async (req, res) => {
  try {
    const resident = await User.findById(req.user._id);
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });

    const { requestedBinType, preferredDeliveryDate, notes } = req.body;

    const br = await BinRequest.create({
      resident: resident._id,
      requestedBinType,
      preferredDeliveryDate,
      notes
    });

    res.status(201).json({ success: true, data: br });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Operator approves request and assigns bin
export const approveAndAssignRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // BinRequest ID
    const { binId, deliveryDate } = req.body; // SmartBin _id or binId

    const request = await BinRequest.findById(requestId).populate('resident');
    if (!request) return res.status(404).json({ success: false, message: 'Bin request not found' });

    // Find an available bin matching type if binId not provided
    let bin;
    if (binId) {
      bin = await SmartBin.findById(binId);
    } else {
      bin = await SmartBin.findOne({ binType: request.requestedBinType, status: 'available' });
    }

    if (!bin) return res.status(400).json({ success: false, message: 'Requested bin type not available' });

    // Link bin and mark assigned
    bin.assignedTo = request.resident._id;
    bin.status = 'assigned';
    bin.deliveryDate = deliveryDate || request.preferredDeliveryDate || new Date();
    await bin.save();

    request.status = 'approved';
    request.assignedBin = bin._id;
    request.paymentVerified = true; // Placeholder: verify payment in real flow
    await request.save();

    await bin.populate('assignedTo', 'firstName lastName email phone address');

    res.status(200).json({ success: true, data: { request, bin } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get requests (operator/admin/resident own)
export const getRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role === 'resident') filter.resident = req.user._id;

    const requests = await BinRequest.find(filter)
      .populate('resident', 'firstName lastName email phone address')
      .populate('assignedBin')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
