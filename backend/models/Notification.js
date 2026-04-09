import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  awbNumber: {
    type: String,
    required: true,
    index: true
  },
  discrepancyType: {
    type: String,
    required: true,
    enum: [
      'COD_SHORT_REMITTANCE',
      'WEIGHT_DISPUTE',
      'PHANTOM_RTO_CHARGE',
      'OVERDUE_REMITTANCE',
      'DUPLICATE_SETTLEMENT'
    ]
  },
  expectedValue: {
    type: Number,
    required: true
  },
  actualValue: {
    type: Number,
    required: true
  },
  suggestedAction: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'RETRIED', 'DEAD_LETTER'],
    default: 'PENDING'
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date,
    default: null
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  webhookResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Index for querying by status
notificationSchema.index({ status: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
