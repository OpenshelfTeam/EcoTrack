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

    const { requestedBinType, preferredDeliveryDate, notes, address, street, city, province, postalCode, coordinates } = req.body;

    const br = await BinRequest.create({
      resident: resident._id,
      requestedBinType,
      preferredDeliveryDate,
      notes,
      address,
      street,
      city,
      province,
      postalCode,
      coordinates
    });

    // Create notification for operators
    const operators = await User.find({ role: { $in: ['operator', 'admin'] } });
    
    const addressText = address ? ` at ${address}` : '';
    
    for (const operator of operators) {
      await Notification.create({
        recipient: operator._id,
        type: 'bin-request',
        title: 'New Bin Request',
        message: `${resident.firstName} ${resident.lastName} has requested a ${requestedBinType} bin${addressText}`,
        priority: 'medium'
      });
    }

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
    
    const hasValidCoordinates = request.coordinates && 
                              request.coordinates.lat != null && 
                              request.coordinates.lng != null &&
                              !isNaN(request.coordinates.lat) && 
                              !isNaN(request.coordinates.lng) &&
                              request.coordinates.lat >= -90 && request.coordinates.lat <= 90 &&
                              request.coordinates.lng >= -180 && request.coordinates.lng <= 180;

    console.log('Has valid coordinates:', hasValidCoordinates);

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

    // Update request status to approved (bin will be created when delivery is completed)
    request.status = 'approved';
    request.paymentVerified = paymentVerified;
    await request.save();

    // Create delivery record (bin will be created when delivery is marked as delivered)
    const delivery = await Delivery.create({
      bin: null, // Will be set when bin is created on delivery completion
      resident: request.resident._id,
      scheduledDate: deliveryDate ? new Date(deliveryDate) : 
                   request.preferredDeliveryDate ? new Date(request.preferredDeliveryDate) : 
                   new Date()
    });

    console.log('approveAndAssignRequest: created delivery id=', delivery._id);

    // Store delivery info in request for later use
    request.deliveryId = delivery._id;
    await request.save();

    // Create notification for resident
    await Notification.create({
      recipient: request.resident._id,
      type: 'bin-delivered',
      title: 'Bin Request Approved',
      message: `Your ${request.requestedBinType} bin request has been approved. Delivery scheduled for ${new Date(delivery.scheduledDate).toLocaleDateString()}. Tracking: ${delivery.trackingNumber}`,
      priority: 'high'
    });

    res.status(200).json({ success: true, data: { request, delivery } });
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
      .limit(parseInt(limit))
      .sort('-createdAt');

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel bin request (resident only for pending requests)
export const cancelBinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await BinRequest.findById(requestId).populate('resident');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Bin request not found' });
    }

    // Check if user owns this request
    if (req.user.role === 'resident' && request.resident._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    // Only pending requests can be cancelled
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel request with status: ${request.status}` 
      });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify operators about cancellation
    const operators = await User.find({ role: { $in: ['operator', 'admin'] } });
    
    for (const operator of operators) {
      await Notification.create({
        recipient: operator._id,
        type: 'general',
        title: 'Bin Request Cancelled',
        message: `${request.resident.firstName} ${request.resident.lastName} cancelled their ${request.requestedBinType} bin request.`,
        priority: 'low'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Bin request cancelled successfully',
      data: request 
    });
  } catch (error) {
    console.error('Error cancelling bin request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm bin receipt - This is now handled automatically when delivery status is updated to 'delivered'
// This endpoint is kept for backwards compatibility but is optional
export const confirmBinReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await BinRequest.findById(requestId)
      .populate('resident')
      .populate('assignedBin');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Bin request not found' });
    }

    // Check if user owns this request
    if (req.user.role === 'resident' && request.resident._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this request' });
    }

    // Check if bin has already been delivered
    if (request.status === 'delivered' && request.assignedBin) {
      return res.status(200).json({ 
        success: true, 
        message: 'Your bin has already been delivered and is active!',
        data: { request } 
      });
    }

    // If status is still approved, delivery hasn't been completed yet
    if (request.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Your bin is still being delivered. Please wait for the collector to mark it as delivered.' 
      });
    }

    res.status(400).json({ 
      success: false, 
      message: 'Invalid request status' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
