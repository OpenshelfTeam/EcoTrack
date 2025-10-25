import Delivery from '../models/Delivery.model.js';
import SmartBin from '../models/SmartBin.model.js';
import User from '../models/User.model.js';

export const createDelivery = async (req, res) => {
  try {
    const { binId, residentId, scheduledDate } = req.body;
    const bin = await SmartBin.findById(binId);
    const resident = await User.findById(residentId || req.user._id);

    if (!bin) return res.status(404).json({ success: false, message: 'Bin not found' });
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });

    const delivery = await Delivery.create({
      bin: bin._id,
      resident: resident._id,
      scheduledDate: scheduledDate || new Date()
    });

    bin.status = 'in-transit';
    await bin.save();

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const delivery = await Delivery.findById(id).populate('resident');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    // Authorization check: Only assigned collector or admin/operator can update
    const isAssignedCollector = delivery.deliveryTeam && delivery.deliveryTeam.toString() === req.user._id.toString();
    const isAdminOrOperator = ['admin', 'operator'].includes(req.user.role);
    
    if (!isAssignedCollector && !isAdminOrOperator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the assigned collector can update this delivery' 
      });
    }

    delivery.status = status || delivery.status;
    if (note) delivery.attempts.push({ date: new Date(), note, performedBy: req.user._id });
    
    if (status === 'delivered') {
      delivery.confirmedAt = new Date();
      
      // Find the corresponding bin request
      const BinRequest = (await import('../models/BinRequest.model.js')).default;
      const SmartBin = (await import('../models/SmartBin.model.js')).default;
      const Notification = (await import('../models/Notification.model.js')).default;
      
      const binRequest = await BinRequest.findOne({ 
        resident: delivery.resident._id, 
        status: 'approved',
        deliveryId: delivery._id 
      });

      console.log('updateDeliveryStatus: delivery._id=', delivery._id);
      console.log('updateDeliveryStatus: binRequest found=', !!binRequest);

      if (!binRequest) {
        console.log('No bin request found for delivery:', delivery._id, 'resident:', delivery.resident._id);
      }

      if (binRequest) {
        // Create the actual bin now that delivery is completed
        const validBinTypes = ['general', 'recyclable', 'organic', 'hazardous'];
        const binType = validBinTypes.includes(binRequest.requestedBinType) ? binRequest.requestedBinType : 'general';
        
        const bin = await SmartBin.create({
          binType: binType,
          capacity: binType === 'hazardous' ? 80 : 
                    binType === 'organic' ? 100 : 120, // Default capacities
          currentLevel: 0,
          status: 'active', // Bin is immediately active when delivered
          assignedTo: delivery.resident._id,
          createdBy: req.user._id, // Collector who delivered
          deliveryDate: delivery.scheduledDate,
          activationDate: new Date(),
          location: {
            type: 'Point',
            coordinates: binRequest.coordinates && 
                        typeof binRequest.coordinates.lat === 'number' && 
                        typeof binRequest.coordinates.lng === 'number' &&
                        binRequest.coordinates.lat >= -90 && binRequest.coordinates.lat <= 90 &&
                        binRequest.coordinates.lng >= -180 && binRequest.coordinates.lng <= 180
              ? [binRequest.coordinates.lng, binRequest.coordinates.lat]
              : [0, 0],
            address: binRequest.address
          }
        });

        // Update delivery with bin reference
        delivery.bin = bin._id;
        
        // Update bin request with assigned bin
        binRequest.assignedBin = bin._id;
        binRequest.status = 'delivered'; // Mark request as completed
        await binRequest.save();

        // Create notification for resident
        await Notification.create({
          recipient: delivery.resident._id,
          type: 'bin-activated',
          title: 'Bin Delivered and Activated',
          message: `Your ${binType} bin has been delivered and is now active. You can start using it immediately.`,
          priority: 'high'
        });
      }
    }

    await delivery.save();
    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmReceipt = async (req, res) => {
  try {
    const { id } = req.params; // delivery id
    const delivery = await Delivery.findById(id).populate('bin resident');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    delivery.status = 'delivered';
    delivery.confirmedAt = new Date();
    await delivery.save();

    // If a bin document is linked, update its status. otherwise skip.
    if (delivery.bin) {
      try {
        const binDoc = await SmartBin.findById(delivery.bin);
        if (binDoc) {
          binDoc.status = 'active';
          binDoc.activationDate = new Date();
          await binDoc.save();
        } else {
          console.log('confirmReceipt: linked bin not found for delivery', delivery._id);
        }
      } catch (err) {
        console.error('Error updating linked bin on confirmReceipt:', err.message);
      }
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveries = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.resident = req.user._id;
    if (req.user.role === 'collector') filter.deliveryTeam = req.user._id; // Collectors see only their deliveries
    const deliveries = await Delivery.find(filter).populate('bin resident deliveryTeam').sort('-createdAt');
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reassign collector to delivery (operator/admin only)
export const reassignCollector = async (req, res) => {
  try {
    const { id } = req.params; // delivery id
    const { collectorId } = req.body;

    // Only operators and admins can reassign
    if (!['operator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only operators and admins can reassign deliveries' 
      });
    }

    const delivery = await Delivery.findById(id).populate('resident');
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Validate new collector
    const collector = await User.findById(collectorId);
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector not found' });
    }
    if (collector.role !== 'collector') {
      return res.status(400).json({ success: false, message: 'User must be a collector' });
    }

    const oldCollector = delivery.deliveryTeam;
    delivery.deliveryTeam = collector._id;
    await delivery.save();

    // Notify new collector
    const Notification = (await import('../models/Notification.model.js')).default;
    await Notification.create({
      recipient: collector._id,
      type: 'general',
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver a bin to ${delivery.resident.firstName} ${delivery.resident.lastName}. Scheduled: ${new Date(delivery.scheduledDate).toLocaleDateString()}. Tracking: ${delivery.trackingNumber}`,
      priority: 'high'
    });

    // Notify old collector if there was one
    if (oldCollector) {
      await Notification.create({
        recipient: oldCollector,
        type: 'general',
        title: 'Delivery Reassigned',
        message: `The delivery to ${delivery.resident.firstName} ${delivery.resident.lastName} (Tracking: ${delivery.trackingNumber}) has been reassigned to another collector.`,
        priority: 'medium'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Collector reassigned successfully',
      data: delivery 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
