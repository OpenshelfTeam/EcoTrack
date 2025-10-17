import mongoose from 'mongoose';

const smartBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    unique: true,
    uppercase: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values
  },
  rfidTag: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  capacity: {
    type: Number,
    default: 100, // in liters
    required: true
  },
  currentLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  binType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'in-transit', 'active', 'maintenance', 'damaged', 'full', 'inactive'],
    default: 'available'
  },
  lastEmptied: {
    type: Date,
    default: null
  },
  deliveryDate: {
    type: Date,
    default: null
  },
  activationDate: {
    type: Date,
    default: null
  },
  sensorData: {
    batteryLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    temperature: Number,
    lastUpdate: Date
  },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
smartBinSchema.index({ location: '2dsphere' });

// Generate unique bin ID before saving
smartBinSchema.pre('save', async function(next) {
  if (!this.binId) {
    const count = await mongoose.model('SmartBin').countDocuments();
    this.binId = `BIN${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const SmartBin = mongoose.model('SmartBin', smartBinSchema);

export default SmartBin;
