const Problem = require('../models/Problem');
const scrapeService = require('../services/scrapeService');
const testCaseGeneratorService = require('../services/testCaseGeneratorService');

exports.createProblem = async (req, res) => {
  try {
    const { title, description, difficulty, constraints, inputFormat, outputFormat, sampleTestCases, hiddenTestCases, limits, points, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const problem = await Problem.create({
      title,
      description,
      difficulty: difficulty || 'medium',
      constraints,
      inputFormat,
      outputFormat,
      sampleTestCases: sampleTestCases || [],
      hiddenTestCases: hiddenTestCases || [],
      limits: limits || { timeLimit: 2, memoryLimit: 256 },
      points: points || 100,
      tags: tags || [],
      createdBy: req.user._id,
      source: { platform: 'custom' }
    });

    res.status(201).json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scrapeProblem = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL required' });
    }

    const scrapedData = await scrapeService.scrapeProblem(url);

    if (!scrapedData) {
      return res.status(400).json({ success: false, message: 'Failed to scrape problem' });
    }

    const aiTestCases = await testCaseGeneratorService.generateTestCases(
      scrapedData.title,
      scrapedData.description,
      scrapedData.constraints
    );

    const problem = await Problem.create({
      ...scrapedData,
      hiddenTestCases: aiTestCases || [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProblems = async (req, res) => {
  try {
    const { difficulty, platform, tags, page = 1, limit = 20 } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (platform) query['source.platform'] = platform;
    if (tags) query.tags = { $in: tags.split(',') };

    const problems = await Problem.find(query)
      .select('-hiddenTestCases')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Problem.countDocuments(query);

    res.status(200).json({
      success: true,
      problems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .select('-hiddenTestCases')
      .populate('createdBy', 'username email');

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.status(200).json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug })
      .select('-hiddenTestCases')
      .populate('createdBy', 'username email');

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.status(200).json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowedUpdates = ['title', 'description', 'difficulty', 'constraints', 'inputFormat', 'outputFormat', 'sampleTestCases', 'hiddenTestCases', 'limits', 'points', 'tags'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(problem, updates);
    await problem.save();

    res.status(200).json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await problem.deleteOne();

    res.status(200).json({ success: true, message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
