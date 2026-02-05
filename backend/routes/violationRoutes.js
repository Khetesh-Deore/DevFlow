const express = require('express');
const router = express.Router();
const {
  recordViolation,
  getContestViolations,
  getUserViolations,
  unlockUser
} = require('../controllers/violationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/violations', protect, recordViolation);
router.get('/contests/:contestId/violations', protect, authorize('admin'), getContestViolations);
router.get('/contests/:contestId/violations/me', protect, getUserViolations);
router.post('/contests/:contestId/users/:userId/unlock', protect, authorize('admin'), unlockUser);

module.exports = router;
