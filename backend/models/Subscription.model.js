import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // One subscription per user
  },
  plan: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic'
  },
  monthlyCharge: {
    type: Number,
    required: true,
    default: 25.00  // Base monthly charge
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: {
    type: Date
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank-transfer', 'cash', 'online'],
      default: 'card'
    },
    details: String  // e.g., "Visa ending in 4242"
  },
  billingHistory: [{
    date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded']
    },
    paymentId: String,
    notes: String
  }],
  autoRenew: {
    type: Boolean,
    default: true
  },
  features: {
    maxBins: {
      type: Number,
      default: 2
    },
    maxPickupsPerMonth: {
      type: Number,
      default: 4
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Method to check if subscription is due for payment
subscriptionSchema.methods.isDueForPayment = function() {
  return this.nextBillingDate <= new Date() && this.status === 'active';
};

// Method to process monthly payment
subscriptionSchema.methods.processPayment = async function(paymentDetails) {
  this.billingHistory.push({
    date: new Date(),
    amount: this.monthlyCharge,
    status: paymentDetails.success ? 'paid' : 'failed',
    paymentId: paymentDetails.paymentId,
    notes: paymentDetails.notes
  });

  if (paymentDetails.success) {
    this.lastPaymentDate = new Date();
    this.nextBillingDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    this.status = 'active';
  } else {
    // Suspend after 3 failed payments
    const recentFailures = this.billingHistory.filter(
      h => h.status === 'failed' && 
      h.date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    ).length;
    
    if (recentFailures >= 3) {
      this.status = 'suspended';
    }
  }

  return this.save();
};

// Static method to get active subscriptions due for billing
subscriptionSchema.statics.getDueSubscriptions = function() {
  return this.find({
    status: 'active',
    nextBillingDate: { $lte: new Date() }
  }).populate('user', 'firstName lastName email phone');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
