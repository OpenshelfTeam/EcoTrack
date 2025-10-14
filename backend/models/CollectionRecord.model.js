import mongoose from 'mongoose';

const collectionRecordSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin',
    required: true
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectionDate: {
    type: Date,
    default: Date.now
  },
  wasteWeight: {
    type: Number, // in kilograms
    default: 0
  },
  wasteType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous', 'mixed'],
    default: 'general'
  },
  binLevelBefore: {
    type: Number,
    min: 0,
    max: 100
  },
  binLevelAfter: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['collected', 'partially-collected', 'missed', 'exception'],
    default: 'collected'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  images: [{
    url: String,
    type: String, // before, after, exception
    uploadedAt: Date
  }],
  exception: {
    reported: {
      type: Boolean,
      default: false
    },
    reason: String,
    description: String,
    resolvedAt: Date
  },
  notes: String,
  verificationCode: String
}, {
  timestamps: true
});

// Index for geospatial queries
collectionRecordSchema.index({ location: '2dsphere' });

const CollectionRecord = mongoose.model('CollectionRecord', collectionRecordSchema);

export default CollectionRecord;
