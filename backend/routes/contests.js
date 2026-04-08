const express = require('express');
const router = express.Router();

const {
  getContests, getContest, createContest, updateContest, deleteContest,
  togglePublish, registerForContest, submitInContest,
  getContestLeaderboard, getContestSubmissions, getContestReport
} = require('../controllers/contestController');

const { protect, authorize } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiter');

const admin = [protect, authorize('admin', 'superadmin')];

const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization?.startsWith('Bearer')) {
      return protect(req, res, next);
    }
  } catch {}
  next();
};

// IMPORTANT: specific routes MUST come before /:slug to avoid conflicts
router.get('/', optionalAuth, getContests);

// Admin routes
router.post('/', ...admin, createContest);
router.put('/:id', ...admin, updateContest);
router.delete('/:id', ...admin, deleteContest);
router.patch('/:id/publish', ...admin, togglePublish);
router.post('/:id/register', protect, registerForContest);

// Slug-based specific routes — MUST be before /:slug
router.get('/:slug/leaderboard', getContestLeaderboard);
router.get('/:slug/my-submissions', protect, getContestSubmissions);
router.get('/:slug/report', ...admin, getContestReport);
router.post('/:slug/submit', protect, submissionLimiter, submitInContest);

// Generic slug route — LAST
router.get('/:slug', optionalAuth, getContest);

module.exports = router;
