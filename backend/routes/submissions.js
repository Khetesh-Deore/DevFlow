const express = require('express');
const router = express.Router();

const {
  submitCode, runCode, getSubmission, getMySubmissions, getAllSubmissions
} = require('../controllers/submissionController');

const { protect, authorize } = require('../middleware/auth');

router.post('/run', protect, runCode);
router.post('/', protect, submitCode);
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllSubmissions);
router.get('/', protect, getMySubmissions);
router.get('/:id', protect, getSubmission);

module.exports = router;
