const express = require('express');
const router = express.Router();

const {
  submitCode, runCode, getSubmission, getMySubmissions,
  getAllSubmissions, getSubmissionHistory
} = require('../controllers/submissionController');

const { protect, authorize } = require('../middleware/auth');
const { submissionLimiter, runLimiter } = require('../middleware/rateLimiter');

router.post('/run', protect, runLimiter, runCode);
router.post('/', protect, submissionLimiter, submitCode);
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllSubmissions);
router.get('/history', protect, getSubmissionHistory);
router.get('/', protect, getMySubmissions);
router.get('/:id', protect, getSubmission);

module.exports = router;
