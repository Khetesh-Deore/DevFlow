const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['python', 'cpp', 'c', 'java', 'javascript']
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'AC', 'WA', 'TLE', 'RE', 'CE'],
    default: 'pending'
  },
  verdict: String,
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memoryUsed: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  testCaseResults: [{
    testCaseId: mongoose.Schema.Types.ObjectId,
    passed: Boolean,
    executionTime: Number,
    memoryUsed: Number,
    output: String,
    expectedOutput: String,
    error: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes
submissionSchema.index({ userId: 1, contestId: 1, submittedAt: -1 });
submissionSchema.index({ contestId: 1, problemId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ userId: 1, problemId: 1 });

// Method to check if submission is accepted
submissionSchema.methods.isAccepted = function() {
  return this.status === 'AC';
};

// Method to calculate score percentage
submissionSchema.methods.getScorePercentage = function() {
  if (this.totalTestCases === 0) return 0;
  return Math.round((this.testCasesPassed / this.totalTestCases) * 100);
};

module.exports = mongoose.model('Submission', submissionSchema);
