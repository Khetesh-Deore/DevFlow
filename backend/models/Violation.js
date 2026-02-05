const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  type: {
    type: String,
    enum: ['tab_switch', 'window_blur', 'copy_paste', 'fullscreen_exit', 'suspicious_activity'],
    required: true
  },
  violations: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  totalCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['warned', 'locked'],
    default: 'warned'
  }
}, {
  timestamps: true
});

// Indexes
violationSchema.index({ userId: 1, contestId: 1, type: 1 });
violationSchema.index({ contestId: 1, status: 1 });

// Update total count before saving
violationSchema.pre('save', function(next) {
  this.totalCount = this.violations.length;
  next();
});

module.exports = mongoose.model('Violation', violationSchema);
