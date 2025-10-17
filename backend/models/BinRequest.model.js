import mongoose from 'mongoose';

const binRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    uppercase: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedBinType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous'],
    required: true
  },
  preferredDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  assignedBin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin',
    default: null
  },
  paymentVerified: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

// Auto-generate requestId
binRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestId) {
    const count = await mongoose.model('BinRequest').countDocuments();
    this.requestId = `BR${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const BinRequest = mongoose.model('BinRequest', binRequestSchema);

export default BinRequest;
