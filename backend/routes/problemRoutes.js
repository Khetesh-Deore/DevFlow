const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');

router.post('/create', problemController.createProblem);
router.get('/:id', problemController.getProblem);
router.post('/:id/submit', problemController.submitSolution);
router.get('/', problemController.listProblems);

module.exports = router;
