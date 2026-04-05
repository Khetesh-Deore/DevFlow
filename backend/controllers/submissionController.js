const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { executeCode } = require('../services/judgeService');

const processSubmission = async (submission, problem, userId) => {
  try {
    const testCases = await TestCase.find({ problemId: problem._id }).sort({ isSample: -1, order: 1 });

    submission.status = 'running';
    submission.totalTestCases = testCases.length;
    await submission.save();

    const judgePayload = {
      code: submission.code,
      language: submission.language,
      testcases: testCases.map(tc => ({
        id: tc._id.toString(),
        input: tc.input,
        expected_output: tc.expectedOutput
      })),
      time_limit: problem.timeLimit,
      memory_limit: problem.memoryLimit,
      mode: 'submit'
    };

    const judgeResult = await executeCode(judgePayload);

    submission.status = judgeResult.overall_status;
    submission.passedTestCases = judgeResult.passed;
    submission.compileError = judgeResult.compile_error || '';
    submission.testCaseResults = (judgeResult.results || []).map(r => ({
      testCaseId: r.testcase_id,
      status: r.status,
      timeTakenMs: r.time_taken_ms,
      memoryUsedKb: r.memory_used_kb,
      stdout: r.stdout,
      stderr: r.stderr,
      expected: r.expected,
      got: r.got
    }));

    const times = (judgeResult.results || []).map(r => r.time_taken_ms || 0);
    submission.timeTakenMs = times.length ? Math.max(...times) : 0;

    await submission.save();

    // Update problem stats
    await Problem.findByIdAndUpdate(problem._id, { $inc: { totalSubmissions: 1 } });

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.totalSubmissions': 1 } });

    if (judgeResult.overall_status === 'accepted') {
      await Problem.findByIdAndUpdate(problem._id, { $inc: { totalAccepted: 1 } });
      await Problem.updateAcceptanceRate(problem._id);

      const user = await User.findById(userId);
      const alreadySolved = user.solvedProblems.some(id => id.toString() === problem._id.toString());

      if (!alreadySolved) {
        const diffMap = { Easy: 'easySolved', Medium: 'mediumSolved', Hard: 'hardSolved' };
        await User.findByIdAndUpdate(userId, {
          $addToSet: { solvedProblems: problem._id },
          $inc: {
            'stats.totalSolved': 1,
            [`stats.${diffMap[problem.difficulty]}`]: 1
          }
        });
      }
    }
  } catch (err) {
    submission.status = 'runtime_error';
    submission.compileError = err.message;
    await submission.save();
  }
};

exports.submitCode = asyncHandler(async (req, res) => {
  const { code, language, problemId, contestId } = req.body;

  if (!code || !language || !problemId) {
    return res.status(400).json({ success: false, error: 'code, language, and problemId are required' });
  }

  const problem = await Problem.findOne({ _id: problemId, isPublished: true });
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  const submission = await Submission.create({
    userId: req.user.id,
    problemId,
    code,
    language,
    status: 'pending',
    contestId: contestId || null
  });

  res.status(202).json({ success: true, submissionId: submission._id });

  setImmediate(() => processSubmission(submission, problem, req.user.id));
});

exports.runCode = asyncHandler(async (req, res) => {
  const { code, language, input = '' } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, error: 'code and language are required' });
  }

  const judgeResult = await executeCode({
    code,
    language,
    testcases: [{ id: 'custom', input, expected_output: '' }],
    time_limit: 5000,
    memory_limit: 256,
    mode: 'run'
  });

  const r = judgeResult.results?.[0] || {};
  res.status(200).json({
    success: true,
    data: {
      status: judgeResult.overall_status,
      stdout: r.stdout || '',
      stderr: r.stderr || '',
      timeTakenMs: r.time_taken_ms || 0,
      compileError: judgeResult.compile_error || ''
    }
  });
});

exports.getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

  const isOwner = submission.userId.toString() === req.user.id.toString();
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: submission });
});

exports.getMySubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.query;
  if (!problemId) return res.status(400).json({ success: false, error: 'problemId is required' });

  const submissions = await Submission.find({ userId: req.user.id, problemId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({ success: true, data: submissions });
});

exports.getAllSubmissions = asyncHandler(async (req, res) => {
  const { userId, problemId, status, language, page = 1, limit = 20 } = req.query;
  const query = {};
  if (userId) query.userId = userId;
  if (problemId) query.problemId = problemId;
  if (status) query.status = status;
  if (language) query.language = language;

  const total = await Submission.countDocuments(query);
  const submissions = await Submission.find(query)
    .populate('userId', 'name email')
    .populate('problemId', 'title slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, pages: Math.ceil(total / limit), data: submissions });
});
