const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: [String],
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    examples: [
      {
        input: String,
        output: String,
        explanation: String
      }
    ],
    adminSolution: {
      code: { type: String },
      language: String
    },
    timeLimit: { type: Number, default: 2000 },
    memoryLimit: { type: Number, default: 256 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalSubmissions: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    hints: [String]
  },
  { timestamps: true }
);

const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

problemSchema.pre('save', async function (next) {
  if (!this.isNew && !this.isModified('title')) return next();

  let slug = generateSlug(this.title);
  let exists = await mongoose.model('Problem').findOne({ slug, _id: { $ne: this._id } });
  while (exists) {
    slug = `${generateSlug(this.title)}-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await mongoose.model('Problem').findOne({ slug, _id: { $ne: this._id } });
  }
  this.slug = slug;
  next();
});

problemSchema.statics.updateAcceptanceRate = async function (problemId) {
  const problem = await this.findById(problemId);
  if (!problem) return;
  if (problem.totalSubmissions === 0) {
    problem.acceptanceRate = 0;
  } else {
    problem.acceptanceRate = (problem.totalAccepted / problem.totalSubmissions) * 100;
  }
  await problem.save();
};

module.exports = mongoose.model('Problem', problemSchema);
