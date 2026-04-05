const express = require('express');
const router = express.Router();

const {
  getProblems, getProblem, createProblem, updateProblem, deleteProblem,
  togglePublish, addTestCase, getTestCases, updateTestCase, deleteTestCase, getTags
} = require('../controllers/problemController');

const { protect, authorize } = require('../middleware/auth');

const admin = [protect, authorize('admin', 'superadmin')];

// Public
router.get('/tags', getTags);
router.get('/', getProblems);
router.get('/:slug', getProblem);

// Admin — get single problem by ID (includes draft + adminSolution)
router.get('/admin/:id', ...admin, async (req, res) => {
  const Problem = require('../models/Problem');
  const problem = await Problem.findById(req.params.id).select('+adminSolution.code');
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });
  res.status(200).json({ success: true, data: problem });
});

// Admin
router.post('/', ...admin, createProblem);
router.put('/:id', ...admin, updateProblem);
router.delete('/:id', ...admin, deleteProblem);
router.patch('/:id/publish', ...admin, togglePublish);

router.post('/:id/testcases', ...admin, addTestCase);
router.get('/:id/testcases', ...admin, getTestCases);
router.put('/:id/testcases/:tcId', ...admin, updateTestCase);
router.delete('/:id/testcases/:tcId', ...admin, deleteTestCase);

module.exports = router;
