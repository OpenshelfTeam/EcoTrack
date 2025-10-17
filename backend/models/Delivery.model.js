import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: {
    type: String,
    unique: true,
    uppercase: true
  },
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: Date,
  trackingNumber: String,
  status: {
    type: String,
    enum: ['scheduled', 'in-transit', 'delivered', 'failed', 'rescheduled'],
    default: 'scheduled'
  },
  deliveryTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attempts: [{
    date: Date,
    note: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  verificationCode: String,
  confirmedAt: Date,
  notes: String
}, { timestamps: true });

deliverySchema.pre('save', async function(next) {
  if (this.isNew && !this.deliveryId) {
    let deliveryId;
    let trackingNumber;
    let attempts = 0;
    do {
      const timestamp = Date.now();
      const count = attempts;
      deliveryId = `DLV${timestamp}${String(count + 1).padStart(4, '0')}`;
      trackingNumber = `TRK${timestamp}${String(count + 1).padStart(6, '0')}`;
      attempts++;
    } while ((await mongoose.model('Delivery').findOne({ $or: [{ deliveryId }, { trackingNumber }] })) && attempts < 100);
    
    if (attempts >= 100) {
      return next(new Error('Unable to generate unique delivery ID'));
    }
    
    this.deliveryId = deliveryId;
    this.trackingNumber = trackingNumber;
  }
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
