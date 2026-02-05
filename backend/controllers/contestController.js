const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');

exports.createContest = async (req, res) => {
  try {
    const { title, description, customUrl, startTime, endTime, duration, questions, settings } = req.body;

    if (!title || !description || !startTime || !endTime || !duration) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingContest = await Contest.findOne({ customUrl });
    if (existingContest) {
      return res.status(400).json({ success: false, message: 'Contest URL already exists' });
    }

    const contest = await Contest.create({
      title,
      description,
      customUrl,
      createdBy: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      questions: questions || [],
      settings: settings || {},
      status: 'draft'
    });

    res.status(201).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllContests = async (req, res) => {
  try {
    const { status, visibility, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (visibility) query['settings.visibility'] = visibility;

    const contests = await Contest.find(query)
      .populate('createdBy', 'username email')
      .populate('questions', 'title difficulty points')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Contest.countDocuments(query);

    res.status(200).json({
      success: true,
      contests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('createdBy', 'username email profile')
      .populate('questions')
      .populate('participants.userId', 'username profile.avatar');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestByUrl = async (req, res) => {
  try {
    const contest = await Contest.findOne({ customUrl: req.params.customUrl })
      .populate('createdBy', 'username email profile')
      .populate('questions')
      .populate('participants.userId', 'username profile.avatar');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.status === 'live' || contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Cannot update live or ended contest' });
    }

    const allowedUpdates = ['title', 'description', 'startTime', 'endTime', 'duration', 'settings'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(contest, updates);
    await contest.save();

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.status === 'live') {
      return res.status(400).json({ success: false, message: 'Cannot delete live contest' });
    }

    await contest.deleteOne();

    res.status(200).json({ success: true, message: 'Contest deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerForContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Contest has ended' });
    }

    if (contest.isUserRegistered(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    contest.participants.push({
      userId: req.user._id,
      registeredAt: new Date(),
      score: 0,
      solvedQuestions: [],
      submissions: [],
      rank: 0,
      violations: [],
      locked: false
    });

    await contest.save();

    res.status(200).json({ success: true, message: 'Registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unregisterFromContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.status === 'live' || contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Cannot unregister from live or ended contest' });
    }

    contest.participants = contest.participants.filter(
      p => p.userId.toString() !== req.user._id.toString()
    );

    await contest.save();

    res.status(200).json({ success: true, message: 'Unregistered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addProblemToContest = async (req, res) => {
  try {
    const { problemId } = req.body;
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.status === 'live' || contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Cannot modify live or ended contest' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (contest.questions.includes(problemId)) {
      return res.status(400).json({ success: false, message: 'Problem already added' });
    }

    contest.questions.push(problemId);
    await contest.save();

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeProblemFromContest = async (req, res) => {
  try {
    const { problemId } = req.params;
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.status === 'live' || contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Cannot modify live or ended contest' });
    }

    contest.questions = contest.questions.filter(q => q.toString() !== problemId);
    await contest.save();

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestProblems = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('questions');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.status === 'draft' && contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Contest not accessible' });
    }

    res.status(200).json({ success: true, problems: contest.questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestParticipants = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('participants.userId', 'username email profile');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, participants: contest.participants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.publishContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one problem' });
    }

    contest.status = 'scheduled';
    await contest.save();

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contest.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Contest is not live' });
    }

    contest.status = 'ended';
    contest.endTime = new Date();
    await contest.save();

    if (global.io) {
      global.io.to(`contest-${contest._id}`).emit('contest-ended', {
        contestId: contest._id,
        reason: 'Ended by admin'
      });
    }

    res.status(200).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
