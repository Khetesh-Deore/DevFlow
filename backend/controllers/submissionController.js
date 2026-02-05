const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const submissionQueue = require('../services/submissionQueue');

exports.submitSolution = async (req, res) => {
  try {
    const { contestId, problemId } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language required' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ success: false, message: 'Code too long (max 50KB)' });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Contest not active' });
    }

    if (!contest.isUserRegistered(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not registered for contest' });
    }

    const participant = contest.getParticipant(req.user._id);
    if (participant && participant.locked) {
      return res.status(403).json({ success: false, message: 'Submissions locked due to violations' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (!contest.questions.includes(problemId)) {
      return res.status(400).json({ success: false, message: 'Problem not in contest' });
    }

    const submission = await Submission.create({
      contestId,
      problemId,
      userId: req.user._id,
      code,
      language,
      status: 'pending',
      testCasesPassed: 0,
      totalTestCases: problem.hiddenTestCases.length,
      submittedAt: new Date()
    });

    await submissionQueue.addSubmission({
      submissionId: submission._id.toString(),
      code,
      language,
      problemId: problem._id.toString(),
      contestId: contest._id.toString(),
      userId: req.user._id.toString(),
      testCases: problem.hiddenTestCases,
      limits: problem.limits,
      points: problem.points
    });

    if (global.io) {
      global.io.to(`contest-${contestId}`).emit('new-submission', {
        submissionId: submission._id,
        userId: req.user._id,
        username: req.user.username,
        problemId,
        language,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      submissionId: submission._id,
      status: 'pending',
      message: 'Submission queued for execution'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'username profile.avatar')
      .populate('problemId', 'title difficulty points')
      .populate('contestId', 'title');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserSubmissions = async (req, res) => {
  try {
    const { contestId, problemId, status, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (contestId) query.contestId = contestId;
    if (problemId) query.problemId = problemId;
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .populate('problemId', 'title difficulty')
      .populate('contestId', 'title')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      submissions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestSubmissions = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const submissions = await Submission.find({ contestId })
      .populate('userId', 'username profile.avatar')
      .populate('problemId', 'title')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Submission.countDocuments({ contestId });

    res.status(200).json({
      success: true,
      submissions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
