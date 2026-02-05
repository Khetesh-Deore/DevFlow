const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create', protect, authorize('admin'), problemController.createProblem);
router.post('/scrape', protect, authorize('admin'), problemController.scrapeProblem);
router.get('/', protect, problemController.getAllProblems);
router.get('/slug/:slug', protect, problemController.getProblemBySlug);
router.get('/:id', protect, problemController.getProblemById);
router.put('/:id', protect, authorize('admin'), problemController.updateProblem);
router.delete('/:id', protect, authorize('admin'), problemController.deleteProblem);

module.exports = router;
