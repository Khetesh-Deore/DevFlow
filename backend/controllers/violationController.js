const Violation = require('../models/Violation');
const Contest = require('../models/Contest');

exports.recordViolation = async (req, res) => {
  try {
    const { contestId, type, metadata } = req.body;

    if (!['tab_switch', 'window_blur', 'copy_paste', 'fullscreen_exit', 'suspicious_activity'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid violation type' });
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

    let violation = await Violation.findOne({
      userId: req.user._id,
      contestId,
      type
    });

    if (!violation) {
      violation = await Violation.create({
        userId: req.user._id,
        contestId,
        type,
        violations: [{
          timestamp: new Date(),
          metadata: metadata || {}
        }],
        totalCount: 1
      });
    } else {
      violation.violations.push({
        timestamp: new Date(),
        metadata: metadata || {}
      });
      violation.totalCount += 1;
      await violation.save();
    }

    const maxAllowed = contest.settings.maxTabSwitches || 3;
    const shouldLock = violation.totalCount >= maxAllowed;

    if (shouldLock && violation.status !== 'locked') {
      violation.status = 'locked';
      await violation.save();

      const participant = contest.getParticipant(req.user._id);
      if (participant) {
        participant.locked = true;
        await contest.save();
      }

      if (global.io) {
        global.io.to(`user-${req.user._id}`).emit('submissions-locked', {
          reason: 'Too many violations',
          type,
          count: violation.totalCount
        });

        global.io.to(`admin-${contestId}`).emit('user-locked', {
          userId: req.user._id,
          username: req.user.username,
          contestId,
          type,
          count: violation.totalCount
        });
      }

      return res.status(200).json({
        success: true,
        locked: true,
        message: 'Submissions locked due to violations',
        count: violation.totalCount,
        maxAllowed
      });
    }

    if (global.io) {
      global.io.to(`user-${req.user._id}`).emit('violation-warning', {
        type,
        count: violation.totalCount,
        maxAllowed,
        remainingWarnings: maxAllowed - violation.totalCount
      });

      global.io.to(`admin-${contestId}`).emit('violation-alert', {
        userId: req.user._id,
        username: req.user.username,
        type,
        count: violation.totalCount,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      locked: false,
      count: violation.totalCount,
      maxAllowed,
      remainingWarnings: maxAllowed - violation.totalCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContestViolations = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const violations = await Violation.find({ contestId })
      .populate('userId', 'username email profile.avatar')
      .sort({ totalCount: -1, updatedAt: -1 })
      .lean();

    const summary = {
      totalViolations: violations.reduce((sum, v) => sum + v.totalCount, 0),
      lockedUsers: violations.filter(v => v.status === 'locked').length,
      byType: {
        tab_switch: 0,
        window_blur: 0,
        copy_paste: 0,
        fullscreen_exit: 0,
        suspicious_activity: 0
      }
    };

    violations.forEach(v => {
      if (summary.byType[v.type] !== undefined) {
        summary.byType[v.type] += v.totalCount;
      }
    });

    res.status(200).json({
      success: true,
      violations,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserViolations = async (req, res) => {
  try {
    const { contestId } = req.params;

    const violations = await Violation.find({
      userId: req.user._id,
      contestId
    }).lean();

    res.status(200).json({
      success: true,
      violations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlockUser = async (req, res) => {
  try {
    const { contestId, userId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Violation.updateMany(
      { userId, contestId },
      { $set: { status: 'warned' } }
    );

    const participant = contest.getParticipant(userId);
    if (participant) {
      participant.locked = false;
      await contest.save();
    }

    if (global.io) {
      global.io.to(`user-${userId}`).emit('submissions-unlocked', {
        message: 'Submissions unlocked by admin'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unlocked successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
