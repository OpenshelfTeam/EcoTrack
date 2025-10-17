import BinRequest from '../models/BinRequest.model.js';
import User from '../models/User.model.js';
import SmartBin from '../models/SmartBin.model.js';
import Delivery from '../models/Delivery.model.js';
import Notification from '../models/Notification.model.js';
import Payment from '../models/Payment.model.js';

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
    
    console.log('Approve request received:', {
      requestId,
      binId,
      deliveryDate,
      body: req.body
    });

    const request = await BinRequest.findById(requestId).populate('resident');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Bin request not found' });
    }
    
    console.log('Request found:', {
      id: request._id,
      status: request.status,
      resident: request.resident._id
    });

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    // Check payment verification (look for completed payment) - Optional check
    const payment = await Payment.findOne({
      user: request.resident._id,
      status: 'completed',
      paymentType: { $in: ['installation-fee', 'service-charge'] }
    });

    // Mark payment verification status
    const paymentVerified = !!payment;
    
    // Log for debugging
    if (!payment) {
      console.log(`Warning: No payment found for user ${request.resident._id}. Proceeding without payment verification.`);
    }

    // Find an available bin matching type if binId not provided
    let bin;
    if (binId) {
      bin = await SmartBin.findById(binId);
      if (!bin) {
        return res.status(404).json({ success: false, message: 'Specified bin not found' });
      }
      if (bin.status !== 'available') {
        return res.status(400).json({ success: false, message: 'Specified bin is not available' });
      }
    } else {
      bin = await SmartBin.findOne({ binType: request.requestedBinType, status: 'available' });
    }

    if (!bin) {
      return res.status(400).json({
        success: false,
        message: `No available bins of type '${request.requestedBinType}' found in inventory. Please add bins or try a different type.`
      });
    }

    // Link bin and mark assigned
    bin.assignedTo = request.resident._id;
    bin.status = 'assigned';
    bin.deliveryDate = deliveryDate || request.preferredDeliveryDate || new Date();
    await bin.save();

    // Update request
    request.status = 'approved';
    request.assignedBin = bin._id;
    request.paymentVerified = paymentVerified;
    await request.save();

    // Create delivery record
    const delivery = await Delivery.create({
      bin: bin._id,
      resident: request.resident._id,
      scheduledDate: bin.deliveryDate
    });

    // Create notification for resident
    await Notification.create({
      recipient: request.resident._id,
      type: 'bin-delivered',
      title: 'Bin Request Approved',
      message: `Your ${request.requestedBinType} bin request has been approved. Delivery scheduled for ${new Date(bin.deliveryDate).toLocaleDateString()}. Tracking: ${delivery.trackingNumber}`,
      priority: 'high'
    });

    await bin.populate('assignedTo', 'firstName lastName email phone address');

    res.status(200).json({ success: true, data: { request, bin, delivery } });
  } catch (error) {
    console.error('Error approving bin request:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
