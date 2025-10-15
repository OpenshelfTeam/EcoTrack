import mongoose from 'mongoose';

const pickupRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    uppercase: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wasteType: {
    type: String,
    enum: ['bulk', 'hazardous', 'electronic', 'construction', 'organic', 'recyclable', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'items', 'bags', 'cubic meters'],
      default: 'items'
    }
  },
  images: [{
    type: String // URLs to uploaded images
  }],
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  preferredDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'scheduled', 'in-progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: null
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
pickupRequestSchema.index({ 'pickupLocation.coordinates': '2dsphere' });

// Index for efficient queries
pickupRequestSchema.index({ requestedBy: 1, status: 1 });
pickupRequestSchema.index({ assignedCollector: 1, status: 1 });
pickupRequestSchema.index({ status: 1, preferredDate: 1 });

// Generate unique request ID before saving
pickupRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    const count = await mongoose.model('PickupRequest').countDocuments();
    this.requestId = `PKP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Add status change to history
pickupRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);

export default PickupRequest;
