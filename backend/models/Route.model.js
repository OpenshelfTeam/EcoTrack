import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  routeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  area: {
    type: String,
    required: true
  },
  bins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin'
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    start: String,
    end: String
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startTime: Date,
  endTime: Date,
  totalBins: {
    type: Number,
    default: 0
  },
  collectedBins: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  optimized: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Index for common queries
routeSchema.index({ assignedCollector: 1, scheduledDate: -1 });
routeSchema.index({ status: 1, scheduledDate: -1 });
routeSchema.index({ area: 1 });

const Route = mongoose.model('Route', routeSchema);

export default Route;
