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
    const delivery = await Delivery.findById(id).populate('bin resident');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    delivery.status = status || delivery.status;
    if (note) delivery.attempts.push({ date: new Date(), note, performedBy: req.user._id });
    if (status === 'delivered') {
      delivery.confirmedAt = new Date();
      delivery.bin.status = 'active';
      delivery.bin.activationDate = new Date();
      await delivery.bin.save();
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
