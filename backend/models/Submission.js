const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    code:     { type: String, required: true },
    language: { type: String, enum: ['python', 'cpp', 'c', 'java', 'javascript'], required: true },
    status: {
      type: String,
      enum: [
        'pending', 'running', 'accepted', 'wrong_answer',
        'time_limit_exceeded', 'runtime_error', 'compilation_error', 'memory_limit_exceeded'
      ],
      default: 'pending'
    },
    testCaseResults: [
      {
        testCaseId:  String,
        status:      String,
        timeTakenMs: Number,
        memoryUsedKb:Number,
        stdout:      String,
        stderr:      String,
        expected:    String,
        got:         String,
        input:       String,
        isSample:    Boolean
      }
    ],
    passedTestCases: { type: Number, default: 0 },
    totalTestCases:  { type: Number, default: 0 },
    timeTakenMs:     { type: Number, default: 0 },
    memoryUsedKb:    { type: Number, default: 0 },
    compileError:    { type: String, default: '' },
    contestId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', default: null },
    submittedAt:     { type: Date, default: Date.now }
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ problemId: 1, status: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
