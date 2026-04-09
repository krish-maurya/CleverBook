import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  awbNumber: {
    type: String,
    required: true,
    index: true
  },
  settledCodAmount: {
    type: Number,
    required: true,
    min: 0
  },
  chargedWeight: {
    type: Number,
    required: true,
    min: 0
  },
  forwardCharge: {
    type: Number,
    required: true,
    min: 0
  },
  rtoCharge: {
    type: Number,
    required: true,
    min: 0
  },
  codHandlingFee: {
    type: Number,
    required: true,
    min: 0
  },
  settlementDate: {
    type: Date,
    default: null
  },
  batchId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['MATCHED', 'DISCREPANCY', 'PENDING_REVIEW'],
    default: 'PENDING_REVIEW'
  },
  discrepancyType: [{
    type: String,
    enum: [
      'COD_SHORT_REMITTANCE',
      'WEIGHT_DISPUTE',
      'PHANTOM_RTO_CHARGE',
      'OVERDUE_REMITTANCE',
      'DUPLICATE_SETTLEMENT'
    ]
  }],
  discrepancyDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for idempotency check
settlementSchema.index({ awbNumber: 1, batchId: 1 }, { unique: true });
settlementSchema.index({ status: 1 });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;
