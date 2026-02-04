const express = require('express');
const router = express.Router();
const automatedController = require('../controllers/automatedController');

router.post('/execute', automatedController.automatedExecution);
router.post('/execute-by-id', automatedController.executeById);

module.exports = router;
