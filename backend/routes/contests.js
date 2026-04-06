const express = require('express');
const router = express.Router();

const {
  getContests, getContest, createContest, updateContest, deleteContest,
  togglePublish, registerForContest, submitInContest,
  getContestLeaderboard, getContestSubmissions
} = require('../controllers/contestController');

const { protect, authorize } = require('../middleware/auth');

const admin = [protect, authorize('admin', 'superadmin')];

// Optional auth middleware — attaches user if token present, doesn't fail if not
const optionalAuth = async (req, res, next) => {
  try {
    const { protect: protectFn } = require('../middleware/auth');
    if (req.headers.authorization?.startsWith('Bearer')) {
      return protectFn(req, res, next);
    }
  } catch {}
  next();
};

// Public
router.get('/', optionalAuth, getContests);
router.get('/:slug', getContest);

// Protected
router.post('/:id/register', protect, registerForContest);
router.post('/:slug/submit', protect, submitInContest);
router.get('/:slug/leaderboard', getContestLeaderboard);
router.get('/:slug/my-submissions', protect, getContestSubmissions);

// Admin
router.post('/', ...admin, createContest);
router.put('/:id', ...admin, updateContest);
router.delete('/:id', ...admin, deleteContest);
router.patch('/:id/publish', ...admin, togglePublish);

module.exports = router;
