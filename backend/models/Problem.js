const mongoose = require('mongoose');
const slugify = require('slugify');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true
  },
  slug: {
    type: String
  },
  description: {
    type: String,
    required: [true, 'Problem description is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  source: {
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'gfg', 'codechef', 'custom'],
      default: 'custom'
    },
    url: String,
    problemId: String
  },
  constraints: String,
  inputFormat: String,
  outputFormat: String,
  sampleTestCases: [{
    input: String,
    output: String,
    explanation: String
  }],
  hiddenTestCases: [{
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  limits: {
    timeLimit: {
      type: Number,
      default: 2
    },
    memoryLimit: {
      type: Number,
      default: 256
    }
  },
  points: {
    type: Number,
    default: 100
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
problemSchema.index({ title: 1 });
problemSchema.index({ slug: 1 }, { unique: true });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ 'source.platform': 1 });
problemSchema.index({ tags: 1 });

// Generate slug before saving
problemSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// Update success rate
problemSchema.methods.updateSuccessRate = function() {
  if (this.stats.totalSubmissions > 0) {
    this.stats.successRate = Math.round(
      (this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100
    );
  } else {
    this.stats.successRate = 0;
  }
};

module.exports = mongoose.model('Problem', problemSchema);
