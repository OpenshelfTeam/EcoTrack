import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'collection-service',
      'bin-quality',
      'collector-behavior',
      'payment-system',
      'app-experience',
      'suggestion',
      'complaint',
      'other'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['route', 'bin', 'collection', 'collector', 'payment']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'acknowledged', 'addressed', 'closed'],
    default: 'submitted'
  },
  response: {
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    message: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: String,
    type: String,
    uploadedAt: Date
  }],
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
