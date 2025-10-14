import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentType: {
    type: String,
    enum: ['service-charge', 'penalty', 'installation-fee', 'maintenance-fee'],
    required: true
  },
  billingPeriod: {
    start: Date,
    end: Date
  },
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'debit-card', 'bank-transfer', 'mobile-payment', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentDetails: {
    cardLastFour: String,
    cardType: String,
    paymentGateway: String,
    gatewayTransactionId: String
  },
  invoice: {
    invoiceNumber: String,
    invoiceDate: Date,
    dueDate: Date,
    paidDate: Date
  },
  relatedBin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin'
  },
  description: String,
  failureReason: String,
  receiptUrl: String,
  metadata: {
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Auto-generate transaction ID
paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Payment').countDocuments();
    this.transactionId = `PAY${Date.now()}${String(count + 1).padStart(4, '0')}`;
    
    if (!this.invoice.invoiceNumber) {
      this.invoice.invoiceNumber = `INV${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
