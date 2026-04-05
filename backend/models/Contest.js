const mongoose = require('mongoose');

const generateSlug = (title) =>
  title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const contestSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, unique: true },
    description: { type: String, default: '' },
    type:        { type: String, enum: ['rated', 'unrated', 'practice'], default: 'unrated' },
    startTime:   { type: Date, required: true },
    endTime:     { type: Date, required: true },
    duration:    { type: Number },
    isPublished: { type: Boolean, default: false },
    problems: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        order:     { type: Number },
        points:    { type: Number, default: 100 },
        label:     { type: String, default: '' }
      }
    ],
    scoringType:          { type: String, enum: ['points', 'icpc'], default: 'points' },
    penaltyMinutes:       { type: Number, default: 20 },
    rules:                { type: String, default: '' },
    registrationRequired: { type: Boolean, default: true },
    createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registeredCount:      { type: Number, default: 0 }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

contestSchema.virtual('status').get(function () {
  const now = Date.now();
  if (now < this.startTime.getTime()) return 'upcoming';
  if (now < this.endTime.getTime()) return 'live';
  return 'ended';
});

contestSchema.pre('save', async function (next) {
  // Auto-generate slug
  if (this.isNew || this.isModified('title')) {
    let slug = generateSlug(this.title);
    const exists = await mongoose.model('Contest').findOne({ slug, _id: { $ne: this._id } });
    if (exists) slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.slug = slug;
  }

  // Auto-calculate duration
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 60000);
  }

  next();
});

module.exports = mongoose.model('Contest', contestSchema);
