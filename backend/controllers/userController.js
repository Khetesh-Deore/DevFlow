const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const asyncHandler = require('../utils/asyncHandler');

// ─── helpers ─────────────────────────────────────────────────────────────────

const getSubmissionCalendar = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const result = await Submission.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'accepted', createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
  ]);

  const calendar = {};
  result.forEach(r => { calendar[r._id] = r.count; });
  return calendar;
};

// ─── public ──────────────────────────────────────────────────────────────────

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    $or: [{ rollNumber: req.params.username }, { email: req.params.username }]
  }).select('name rollNumber batch branch profilePic stats createdAt solvedProblems');

  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  // Difficulty breakdown
  const solvedProblems = await Problem.find({ _id: { $in: user.solvedProblems } }).select('difficulty');
  const diffBreakdown = { easy: 0, medium: 0, hard: 0 };
  solvedProblems.forEach(p => {
    if (p.difficulty === 'Easy') diffBreakdown.easy++;
    else if (p.difficulty === 'Medium') diffBreakdown.medium++;
    else if (p.difficulty === 'Hard') diffBreakdown.hard++;
  });

  // Recent accepted submissions
  const recentSubmissions = await Submission.find({ userId: user._id, status: 'accepted' })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('problemId', 'title slug difficulty')
    .select('status language createdAt problemId');

  // Calendar
  const calendar = await getSubmissionCalendar(user._id);

  res.status(200).json({
    success: true,
    data: {
      user,
      diffBreakdown,
      recentSubmissions,
      calendar
    }
  });
});

exports.getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { batch, branch, page = 1, limit = 50 } = req.query;
  const query = { role: 'student' };
  if (batch) query.batch = batch;
  if (branch) query.branch = branch;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('name rollNumber batch branch profilePic stats')
    .sort({ 'stats.totalSolved': -1, 'stats.points': -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const ranked = users.map((u, i) => ({
    ...u.toObject(),
    rank: (page - 1) * Number(limit) + i + 1
  }));

  res.status(200).json({ success: true, total, pages: Math.ceil(total / limit), data: ranked });
});

// ─── protected ───────────────────────────────────────────────────────────────

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'batch', 'branch', 'profilePic'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Both passwords are required' });
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password updated' });
});

// ─── admin ───────────────────────────────────────────────────────────────────

exports.getAdminStats = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers, totalProblems, totalSubmissions, acceptedSubmissions,
    totalContests, submissionsToday, recentSubmissions, topSolvers,
    languageBreakdown, allContests
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Problem.countDocuments({ isPublished: true }),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'accepted' }),
    Contest.countDocuments(),
    Submission.countDocuments({ createdAt: { $gte: todayStart } }),
    Submission.find().sort({ createdAt: -1 }).limit(10)
      .populate('userId', 'name email').populate('problemId', 'title slug'),
    User.find({ role: 'student' }).sort({ 'stats.totalSolved': -1 }).limit(5)
      .select('name rollNumber stats'),
    Submission.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Contest.find().select('startTime endTime title').lean()
  ]);

  const now = Date.now();
  const activeContests = allContests.filter(c =>
    now >= new Date(c.startTime) && now < new Date(c.endTime)
  ).length;

  res.status(200).json({
    success: true,
    data: {
      totalUsers, totalProblems, totalSubmissions, acceptedSubmissions,
      totalContests, activeContests, submissionsToday,
      recentSubmissions, topSolvers, languageBreakdown
    }
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 30 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { rollNumber: { $regex: search, $options: 'i' } }
  ];

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, pages: Math.ceil(total / limit), data: users });
});

exports.changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.status(200).json({ success: true, data: user });
});
