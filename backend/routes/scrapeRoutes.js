const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');
const codeforcesController = require('../controllers/codeforcesController');
const hackerrankController = require('../controllers/hackerrankController');

router.post('/leetcode/scrape', scrapeController.scrapeLeetCode);
router.post('/codeforces/scrape', codeforcesController.scrapeCodeforces);
router.post('/hackerrank/scrape', hackerrankController.scrapeHackerrank);

module.exports = router;
