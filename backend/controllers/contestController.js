const Contest = require('../models/Contest');
const ContestRegistration = require('../models/ContestRegistration');
const ContestSubmission = require('../models/ContestSubmission');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { executeCode } = require('../services/judgeService');
const { computeLeaderboard } = require('../services/leaderboardService');

// Parse datetime-local string as IST (UTC+5:30)
const parseIST = (dtStr) => {
  if (!dtStr) return undefined;
  // If already ISO with Z or offset, return as-is
  if (dtStr.includes('Z') || dtStr.includes('+')) return new Date(dtStr);
  // Treat as IST: subtract 5h30m to get UTC
  return new Date(new Date(dtStr).getTime() - (5.5 * 60 * 60 * 1000));
};

// ─── helpers ────────────────────────────────────────────────────────────────

const getContestStatus = (contest) => {
  const now = Date.now();
  if (now < new Date(contest.startTime)) return 'upcoming';
  if (now < new Date(contest.endTime)) return 'live';
  return 'ended';
};

// ─── public ─────────────────────────────────────────────────────────────────

exports.getContests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);

  // Admins see all contests, users only see published
  const query = isAdmin ? {} : { isPublished: true };

  const contests = await Contest.find(query).sort({ startTime: -1 }).lean();

  const withStatus = contests.map(c => ({
    ...c,
    status: getContestStatus(c)
  }));

  const filtered = status && status !== 'all'
    ? withStatus.filter(c => c.status === status)
    : withStatus;

  res.status(200).json({ success: true, data: filtered });
});

exports.getContest = asyncHandler(async (req, res) => {
  const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);

  const contest = await Contest.findOne({ slug: req.params.slug })
    .populate('problems.problemId', 'title slug difficulty tags')
    .lean();

  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });
  if (!contest.isPublished && !isAdmin) return res.status(404).json({ success: false, error: 'Contest not found' });

  const status = getContestStatus(contest);

  // Hide problems if upcoming
  if (status === 'upcoming' && !isAdmin) {
    contest.problems = [];
  }

  let isRegistered = false;
  if (req.user) {
    const reg = await ContestRegistration.findOne({ contestId: contest._id, userId: req.user.id });
    isRegistered = !!reg;
  }

  res.status(200).json({ success: true, data: { ...contest, status }, isRegistered });
});

// ─── admin ───────────────────────────────────────────────────────────────────

exports.createContest = asyncHandler(async (req, res) => {
  const { title, description, type, startTime, endTime, problems = [],
    scoringType, penaltyMinutes, rules, registrationRequired } = req.body;

  const start = parseIST(startTime);
  const end = parseIST(endTime);

  if (end <= start) {
    return res.status(400).json({ success: false, error: 'endTime must be after startTime' });
  }

  for (const p of problems) {
    const exists = await Problem.findById(p.problemId);
    if (!exists) return res.status(400).json({ success: false, error: `Problem ${p.problemId} not found` });
  }

  const contest = await Contest.create({
    title, description, type, startTime: start, endTime: end, problems,
    scoringType, penaltyMinutes, rules, registrationRequired,
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, data: contest });
});

exports.updateContest = asyncHandler(async (req, res) => {
  if (req.body.problems) {
    for (const p of req.body.problems) {
      const exists = await Problem.findById(p.problemId);
      if (!exists) return res.status(400).json({ success: false, error: `Problem ${p.problemId} not found` });
    }
  }

  const contest = await Contest.findById(req.params.id);
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  if (req.body.startTime) req.body.startTime = parseIST(req.body.startTime);
  if (req.body.endTime) req.body.endTime = parseIST(req.body.endTime);

  Object.assign(contest, req.body);
  await contest.save();

  res.status(200).json({ success: true, data: contest });
});

exports.deleteContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  await Promise.all([
    ContestRegistration.deleteMany({ contestId: contest._id }),
    ContestSubmission.deleteMany({ contestId: contest._id }),
    contest.deleteOne()
  ]);

  res.status(200).json({ success: true, message: 'Contest deleted' });
});

exports.togglePublish = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });
  contest.isPublished = !contest.isPublished;
  await contest.save();
  res.status(200).json({ success: true, data: contest });
});

// ─── registration ────────────────────────────────────────────────────────────

exports.registerForContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  const status = getContestStatus(contest);
  if (status === 'ended') return res.status(400).json({ success: false, error: 'Contest has ended' });

  const existing = await ContestRegistration.findOne({ contestId: contest._id, userId: req.user.id });
  if (existing) return res.status(400).json({ success: false, error: 'Already registered' });

  await ContestRegistration.create({ contestId: contest._id, userId: req.user.id });
  await Contest.findByIdAndUpdate(contest._id, { $inc: { registeredCount: 1 } });
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { contestsParticipated: contest._id } });

  res.status(200).json({ success: true, message: 'Registered successfully' });
});

// ─── contest submission ───────────────────────────────────────────────────────

const processContestSubmission = async (submission, contest, problem, contestProblem, userId, io) => {
  try {
    const testCases = await TestCase.find({ problemId: problem._id }).sort({ isSample: -1, order: 1 });

    submission.status = 'running';
    submission.totalTestCases = testCases.length;
    await submission.save();

    const judgeResult = await executeCode({
      code: submission.code,
      language: submission.language,
      testcases: testCases.map(tc => ({ id: tc._id.toString(), input: tc.input, expected_output: tc.expectedOutput })),
      time_limit: problem.timeLimit,
      memory_limit: problem.memoryLimit,
      mode: 'submit'
    });

    submission.status = judgeResult.overall_status;
    submission.passedTestCases = judgeResult.passed;
    submission.compileError = judgeResult.compile_error || '';
    submission.testCaseResults = (judgeResult.results || []).map(r => ({
      testCaseId: r.testcase_id, status: r.status, timeTakenMs: r.time_taken_ms,
      memoryUsedKb: r.memory_used_kb, stdout: r.stdout, stderr: r.stderr,
      expected: r.expected, got: r.got
    }));
    submission.timeTakenMs = Math.max(...(judgeResult.results || []).map(r => r.time_taken_ms || 0), 0);
    await submission.save();

    const timeTakenSec = Math.floor((submission.submittedAt - contest.startTime) / 1000);

    const attemptCount = await ContestSubmission.countDocuments({
      contestId: contest._id, userId, problemId: problem._id
    });

    const penalty = judgeResult.overall_status !== 'accepted'
      ? (attemptCount * contest.penaltyMinutes)
      : 0;

    const points = judgeResult.overall_status === 'accepted' ? contestProblem.points : 0;

    await ContestSubmission.create({
      contestId: contest._id,
      userId,
      problemId: problem._id,
      submissionId: submission._id,
      status: judgeResult.overall_status,
      points,
      timeTakenSec,
      attemptNumber: attemptCount + 1,
      penaltyMinutes: penalty,
      isFirstAccepted: judgeResult.overall_status === 'accepted' && attemptCount === 0,
      submittedAt: submission.submittedAt
    });

    if (judgeResult.overall_status === 'accepted') {
      if (io) io.to(`contest:${contest._id}`).emit('leaderboard:update', { userId, problemId: problem._id });
    }

    await Problem.findByIdAndUpdate(problem._id, { $inc: { totalSubmissions: 1 } });
    if (judgeResult.overall_status === 'accepted') {
      await Problem.findByIdAndUpdate(problem._id, { $inc: { totalAccepted: 1 } });
      await Problem.updateAcceptanceRate(problem._id);
    }
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

  } catch (err) {
    submission.status = 'runtime_error';
    submission.compileError = err.message;
    await submission.save();
  }
};

exports.submitInContest = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body;
  const { slug } = req.params;

  const contest = await Contest.findOne({ slug });
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  const status = getContestStatus(contest);
  if (status !== 'live') return res.status(403).json({ success: false, error: 'Contest is not live' });

  const reg = await ContestRegistration.findOne({ contestId: contest._id, userId: req.user.id });
  if (!reg) return res.status(403).json({ success: false, error: 'You are not registered for this contest' });

  const contestProblem = contest.problems.find(p => p.problemId.toString() === problemId);
  if (!contestProblem) return res.status(404).json({ success: false, error: 'Problem not in this contest' });

  const alreadyAC = await ContestSubmission.findOne({
    contestId: contest._id, userId: req.user.id, problemId, status: 'accepted'
  });
  if (alreadyAC) return res.status(400).json({ success: false, error: 'You already solved this problem' });

  const problem = await Problem.findById(problemId);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  const submission = await Submission.create({
    userId: req.user.id, problemId, code, language,
    status: 'pending', contestId: contest._id
  });

  res.status(202).json({ success: true, submissionId: submission._id });

  const io = req.app.get('io');
  setImmediate(() => processContestSubmission(submission, contest, problem, contestProblem, req.user.id, io));
});

// ─── leaderboard ─────────────────────────────────────────────────────────────

exports.getContestLeaderboard = asyncHandler(async (req, res) => {
  const contest = await Contest.findOne({ slug: req.params.slug });
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  const leaderboard = await computeLeaderboard(contest);
  res.status(200).json({ success: true, data: leaderboard });
});

exports.getContestReport = asyncHandler(async (req, res) => {
  const ContestSubmission = require('../models/ContestSubmission');
  const ContestRegistration = require('../models/ContestRegistration');

  // Try finding by slug OR by _id
  const contest = await Contest.findOne({
    $or: [
      { slug: req.params.slug },
      ...(require('mongoose').Types.ObjectId.isValid(req.params.slug) ? [{ _id: req.params.slug }] : [])
    ]
  }).populate('problems.problemId', 'title difficulty');

  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  const leaderboard = await computeLeaderboard(contest);

  const registrations = await ContestRegistration.find({ contestId: contest._id });
  const totalRegistered = registrations.length;

  // Count unique participants (users who submitted at least once)
  const uniqueParticipants = await ContestSubmission.distinct('userId', { contestId: contest._id });

  const problemStats = [];
  for (const p of contest.problems) {
    const pid = p.problemId?._id;
    if (!pid) continue;
    const [solvers, attempts] = await Promise.all([
      ContestSubmission.countDocuments({ contestId: contest._id, problemId: pid, status: 'accepted' }),
      ContestSubmission.countDocuments({ contestId: contest._id, problemId: pid })
    ]);
    problemStats.push({
      title: p.problemId?.title || 'Unknown',
      label: p.label || String(p.order),
      points: p.points,
      solvers,
      attempts
    });
  }

  res.status(200).json({
    success: true,
    data: {
      contest: {
        title: contest.title,
        slug: contest.slug,
        type: contest.type,
        startTime: contest.startTime,
        endTime: contest.endTime,
        duration: contest.duration,
        totalRegistered,
        totalParticipants: uniqueParticipants.length,
        totalProblems: contest.problems.length
      },
      problemStats,
      leaderboard
    }
  });
});

exports.getContestSubmissions = asyncHandler(async (req, res) => {
  const contest = await Contest.findOne({ slug: req.params.slug });
  if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });

  const submissions = await ContestSubmission.find({ contestId: contest._id, userId: req.user.id })
    .populate('problemId', 'title slug')
    .sort({ submittedAt: -1 });

  res.status(200).json({ success: true, data: submissions });
});
