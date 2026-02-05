const mongoose = require('mongoose');
const slugify = require('slugify');

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Contest description is required']
  },
  customUrl: {
    type: String,
    unique: true,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'live', 'ended'],
    default: 'draft'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    solvedQuestions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    }],
    submissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission'
    }],
    rank: {
      type: Number,
      default: 0
    },
    violations: [{
      type: {
        type: String,
        enum: ['tab_switch', 'window_blur', 'copy_paste', 'fullscreen_exit', 'suspicious_activity']
      },
      timestamp: Date,
      count: {
        type: Number,
        default: 1
      }
    }],
    locked: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    maxTabSwitches: {
      type: Number,
      default: 3
    },
    enableProctoring: {
      type: Boolean,
      default: true
    },
    disableCopyPaste: {
      type: Boolean,
      default: true
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
contestSchema.index({ customUrl: 1 });
contestSchema.index({ status: 1, startTime: -1 });
contestSchema.index({ createdBy: 1 });
contestSchema.index({ 'participants.userId': 1 });

// Generate custom URL before saving
contestSchema.pre('save', function(next) {
  if (this.isNew && !this.customUrl) {
    this.customUrl = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// Validate end time is after start time
contestSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }
  next();
});

// Method to check if user is registered
contestSchema.methods.isUserRegistered = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

// Method to get participant
contestSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.userId.toString() === userId.toString());
};

// Method to check if contest is active
contestSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'live' && now >= this.startTime && now <= this.endTime;
};

module.exports = mongoose.model('Contest', contestSchema);
