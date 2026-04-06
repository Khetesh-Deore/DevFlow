const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const asyncHandler = require('../utils/asyncHandler');

exports.getProblems = asyncHandler(async (req, res) => {
  const { difficulty, tags, search, page = 1, limit = 20 } = req.query;

  const query = { isPublished: true };
  if (difficulty) query.difficulty = difficulty;
  if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };
  if (search) query.title = { $regex: search, $options: 'i' };

  const total = await Problem.countDocuments(query);
  const problems = await Problem.find(query)
    .select('-adminSolution -description')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();
  if (req.user) {
    const solvedSet = new Set(req.user.solvedProblems.map(id => id.toString()));
    problems.forEach(p => {
      p.isSolved = solvedSet.has(p._id.toString());
    });
  }

  res.status(200).json({
    success: true,
    count: problems.length,
    total,
    pages: Math.ceil(total / limit),
    data: problems
  });
});

exports.getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug, isPublished: true })
    .select({ adminSolution: 0 })
    .lean();

  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  const sampleTestCases = await TestCase.find({ problemId: problem._id, isSample: true })
    .select('input expectedOutput explanation')
    .sort({ order: 1 });

  res.status(200).json({ success: true, data: { ...problem, sampleTestCases } });
});

exports.createProblem = asyncHandler(async (req, res) => {
  const {
    title, description, difficulty, tags, inputFormat, outputFormat,
    constraints, examples, timeLimit, memoryLimit, hints, adminSolution
  } = req.body;

  const problem = await Problem.create({
    title, description, difficulty, tags, inputFormat, outputFormat,
    constraints, examples, timeLimit, memoryLimit, hints, adminSolution,
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, data: problem });
});

exports.updateProblem = asyncHandler(async (req, res) => {
  let problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  Object.assign(problem, req.body);
  await problem.save();

  res.status(200).json({ success: true, data: problem });
});

exports.deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  await TestCase.deleteMany({ problemId: problem._id });
  await problem.deleteOne();

  res.status(200).json({ success: true, message: 'Problem deleted' });
});

exports.togglePublish = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  problem.isPublished = !problem.isPublished;
  await problem.save();

  res.status(200).json({ success: true, data: problem });
});

exports.addTestCase = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });

  const { input, expectedOutput, isSample, explanation, order } = req.body;
  if (!input || !expectedOutput) {
    return res.status(400).json({ success: false, error: 'Input and expectedOutput are required' });
  }

  const testCase = await TestCase.create({
    problemId: problem._id,
    input,
    expectedOutput,
    isSample: isSample || false,
    explanation: explanation || '',
    order: order || 0
  });

  res.status(201).json({ success: true, data: testCase });
});

exports.getTestCases = asyncHandler(async (req, res) => {
  const testCases = await TestCase.find({ problemId: req.params.id })
    .sort({ isSample: -1, order: 1 });

  res.status(200).json({ success: true, count: testCases.length, data: testCases });
});

exports.updateTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findOneAndUpdate(
    { _id: req.params.tcId, problemId: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!testCase) return res.status(404).json({ success: false, error: 'Test case not found' });

  res.status(200).json({ success: true, data: testCase });
});

exports.deleteTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findOne({ _id: req.params.tcId, problemId: req.params.id });
  if (!testCase) return res.status(404).json({ success: false, error: 'Test case not found' });

  await testCase.deleteOne();
  res.status(200).json({ success: true, message: 'Test case deleted' });
});

exports.getTags = asyncHandler(async (req, res) => {
  const tags = await Problem.distinct('tags', { isPublished: true });
  res.status(200).json({ success: true, data: tags.sort() });
});
