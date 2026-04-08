const mongoose = require('mongoose');
const User = require('../models/User');const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const asyncHandler = require('../utils/asyncHandler');

// ─── helpers ─────────────────────────────────────────────────────────────────

const getSubmissionCalendar = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const result = await Submission.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: since } } },
    {
      $addFields: {
        // Convert UTC to IST (UTC+5:30) by adding 5.5 hours in milliseconds
        istDate: { $add: ['$createdAt', 5.5 * 60 * 60 * 1000] }
      }
    },
    { 
      $group: { 
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$istDate' } }, 
        count: { $sum: 1 } 
      } 
    }
  ]);

  const calendar = {};
  result.forEach(r => { calendar[r._id] = r.count; });
  return calendar;
};

// ─── public ──────────────────────────────────────────────────────────────────

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    $or: [
      { rollNumber: req.params.username },
      { email: req.params.username },
      { _id: mongoose.Types.ObjectId.isValid(req.params.username) ? req.params.username : null }
    ]
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

  // All submissions for language breakdown
  const allSubmissions = await Submission.find({ userId: user._id })
    .select('language status createdAt');

  // Language breakdown
  const langCount = {};
  allSubmissions.forEach(s => { langCount[s.language] = (langCount[s.language] || 0) + 1; });

  // Verdict breakdown
  const verdictCount = {};
  allSubmissions.forEach(s => { verdictCount[s.status] = (verdictCount[s.status] || 0) + 1; });

  // Calendar
  const calendar = await getSubmissionCalendar(user._id);

  // Contest history — all contests user participated in with full details
  const ContestSubmission = require('../models/ContestSubmission');
  const ContestRegistration = require('../models/ContestRegistration');

  const registrations = await ContestRegistration.find({ userId: user._id })
    .populate('contestId', 'title slug startTime endTime type problems scoringType')
    .sort({ registeredAt: -1 });

  const contestHistory = await Promise.all(registrations.map(async (reg) => {
    if (!reg.contestId) return null;
    const contest = reg.contestId;

    // All submissions by user in this contest
    const subs = await ContestSubmission.find({ contestId: contest._id, userId: user._id })
      .populate('problemId', 'title slug difficulty');

    // Per-problem status
    const problemStatus = {};
    subs.forEach(s => {
      const pid = s.problemId?._id?.toString();
      if (!pid) return;
      if (!problemStatus[pid]) {
        problemStatus[pid] = { problem: s.problemId, status: s.status, attempts: 0, points: 0, timeTakenSec: s.timeTakenSec };
      }
      problemStatus[pid].attempts++;
      if (s.status === 'accepted') {
        problemStatus[pid].status = 'accepted';
        problemStatus[pid].points = s.points;
        problemStatus[pid].timeTakenSec = s.timeTakenSec;
      }
    });

    const solved = Object.values(problemStatus).filter(p => p.status === 'accepted').length;
    const totalPoints = Object.values(problemStatus).reduce((a, p) => a + (p.points || 0), 0);
    const attempted = Object.keys(problemStatus).length;
    const totalProblems = contest.problems?.length || 0;

    const now = Date.now();
    const contestStatus = now < new Date(contest.startTime) ? 'upcoming'
      : now < new Date(contest.endTime) ? 'live' : 'ended';

    return {
      contestId: contest._id,
      title: contest.title,
      slug: contest.slug,
      type: contest.type,
      startTime: contest.startTime,
      endTime: contest.endTime,
      contestStatus,
      solved,
      attempted,
      totalProblems,
      totalPoints,
      problemStatus: Object.values(problemStatus),
      registeredAt: reg.registeredAt
    };
  }));

  const validContestHistory = contestHistory.filter(Boolean);

  res.status(200).json({
    success: true,
    data: {
      user,
      diffBreakdown,
      recentSubmissions,
      calendar,
      langCount,
      verdictCount,
      totalSubmissions: allSubmissions.length,
      contestHistory: validContestHistory
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
