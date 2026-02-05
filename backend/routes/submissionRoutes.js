const express = require('express');
const router = express.Router();
const {
  submitSolution,
  getSubmission,
  getUserSubmissions,
  getContestSubmissions
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/contests/:contestId/problems/:problemId/submit', protect, submitSolution);
router.get('/submissions/:id', protect, getSubmission);
router.get('/submissions', protect, getUserSubmissions);
router.get('/contests/:contestId/submissions', protect, authorize('admin'), getContestSubmissions);

module.exports = router;
