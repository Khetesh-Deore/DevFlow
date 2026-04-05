const mongoose = require('mongoose');

const contestSubmissionSchema = new mongoose.Schema({
  contestId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  submissionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  status:          { type: String },
  points:          { type: Number, default: 0 },
  timeTakenSec:    { type: Number },
  attemptNumber:   { type: Number, default: 1 },
  penaltyMinutes:  { type: Number, default: 0 },
  isFirstAccepted: { type: Boolean, default: false },
  submittedAt:     { type: Date, default: Date.now }
});

contestSubmissionSchema.index({ contestId: 1, userId: 1 });
contestSubmissionSchema.index({ contestId: 1, problemId: 1, userId: 1 });

module.exports = mongoose.model('ContestSubmission', contestSubmissionSchema);
