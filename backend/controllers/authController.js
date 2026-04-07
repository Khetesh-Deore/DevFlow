const crypto = require('crypto');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      batch: user.batch,
      branch: user.branch,
      stats: user.stats
    }
  });
};

exports.register = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name:       Joi.string().required(),
    email:      Joi.string().email().required(),
    password:   Joi.string().min(6).required(),
    rollNumber: Joi.string().required(),
    batch:      Joi.string().allow(''),
    branch:     Joi.string().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const { name, email, password, rollNumber, batch, branch } = req.body;

  const emailExists = await User.findOne({ email });
  if (emailExists) return res.status(400).json({ success: false, error: 'Email already registered' });

  const rollExists = await User.findOne({ rollNumber });
  if (rollExists) return res.status(400).json({ success: false, error: 'Roll number already registered' });

  const user = await User.create({ name, email, password, rollNumber, batch, branch });
  sendTokenResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  sendTokenResponse(user, 200, res);
});

exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -verifyToken -resetPasswordToken -resetPasswordExpire');
  res.status(200).json({ success: true, data: user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, error: 'No user found with that email' });

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`
    });

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});
