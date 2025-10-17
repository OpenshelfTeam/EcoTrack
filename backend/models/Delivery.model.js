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
    const count = await mongoose.model('Delivery').countDocuments();
    this.deliveryId = `DLV${Date.now()}${String(count + 1).padStart(4, '0')}`;
    this.trackingNumber = `TRK${Date.now()}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
