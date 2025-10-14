import mongoose from 'mongoose';

const smartBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  rfidTag: {
    type: String,
    unique: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
    enum: ['available', 'assigned', 'in-transit', 'active', 'maintenance', 'damaged'],
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

const SmartBin = mongoose.model('SmartBin', smartBinSchema);

export default SmartBin;
