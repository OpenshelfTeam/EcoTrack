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

    delivery.bin.status = 'active';
    delivery.bin.activationDate = new Date();
    await delivery.bin.save();

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveries = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.resident = req.user._id;
    const deliveries = await Delivery.find(filter).populate('bin resident').sort('-createdAt');
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
