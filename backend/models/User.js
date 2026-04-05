const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
    profilePic: { type: String, default: '' },
    batch: { type: String, default: '' },
    branch: { type: String, default: '' },
    stats: {
      totalSolved:        { type: Number, default: 0 },
      easySolved:         { type: Number, default: 0 },
      mediumSolved:       { type: Number, default: 0 },
      hardSolved:         { type: Number, default: 0 },
      totalSubmissions:   { type: Number, default: 0 },
      acceptedSubmissions:{ type: Number, default: 0 },
      points:             { type: Number, default: 0 },
      streak:             { type: Number, default: 0 },
      lastSolvedDate:     { type: Date }
    },
    solvedProblems:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    contestsParticipated:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contest' }],
    isVerified:            { type: Boolean, default: false },
    verifyToken:           { type: String, select: false },
    resetPasswordToken:    { type: String, select: false },
    resetPasswordExpire:   { type: Date,   select: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

userSchema.methods.getResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
