const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const asyncHandler = require('../utils/asyncHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalSubmissions, totalContests, problemStats] = await Promise.all([
    User.countDocuments(),
    Submission.countDocuments(),
    Contest.countDocuments(),
    Problem.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } },
          easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
          hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } }
        }
      }
    ])
  ]);

  const p = problemStats[0] || { total: 0, published: 0, easy: 0, medium: 0, hard: 0 };

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalSubmissions,
      totalContests,
      totalProblems: p.total,
      publishedProblems: p.published,
      draftProblems: p.total - p.published,
      easyProblems: p.easy,
      mediumProblems: p.medium,
      hardProblems: p.hard
    }
  });
});

exports.getAdminProblems = asyncHandler(async (req, res) => {
  const { search, difficulty, status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (difficulty) query.difficulty = difficulty;
  if (status === 'published') query.isPublished = true;
  if (status === 'draft') query.isPublished = false;
  if (search) query.title = { $regex: search, $options: 'i' };

  const total = await Problem.countDocuments(query);
  const problems = await Problem.find(query)
    .select('-adminSolution')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: problems.length,
    total,
    pages: Math.ceil(total / limit),
    data: problems
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
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

  res.status(200).json({ success: true, total, data: users });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.status(200).json({ success: true, data: user });
});

exports.getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find()
    .populate('userId', 'name email')
    .populate('problemId', 'title slug')
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json({ success: true, data: submissions });
});
