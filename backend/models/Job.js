import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  runAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['RUNNING', 'COMPLETED', 'FAILED'],
    default: 'RUNNING'
  },
  totalProcessed: {
    type: Number,
    default: 0
  },
  discrepanciesFound: {
    type: Number,
    default: 0
  },
  errors: [{
    type: String
  }],
  completedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in milliseconds
    default: null
  }
}, {
  timestamps: true
});

// Index for fetching recent jobs
jobSchema.index({ runAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
