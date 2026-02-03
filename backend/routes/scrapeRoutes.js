const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');
const codeforcesController = require('../controllers/codeforcesController');

router.post('/leetcode/scrape', scrapeController.scrapeLeetCode);
router.post('/codeforces/scrape', codeforcesController.scrapeCodeforces);

module.exports = router;
