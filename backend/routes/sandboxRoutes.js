const express = require('express');
const router = express.Router();
const sandboxService = require('../services/sandboxService');

router.post('/run', sandboxService.runCode);

module.exports = router;
