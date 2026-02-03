const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  type: { type: String, enum: ['sample', 'edge', 'random'], required: true },
  isHidden: { type: Boolean, default: false },
  description: { type: String }
});

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String },
  statement: { type: String, required: true },
  constraints: { type: String },
  examples: { type: String },
  platform: { type: String, required: true },
  originalUrl: { type: String, required: true },
  testCases: [testCaseSchema],
  timeLimit: { type: Number, default: 2000 },
  memoryLimit: { type: Number, default: 256000 },
  topics: [{ type: String }],
  companies: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

problemSchema.index({ platform: 1, originalUrl: 1 }, { unique: true });

module.exports = mongoose.model('Problem', problemSchema);
