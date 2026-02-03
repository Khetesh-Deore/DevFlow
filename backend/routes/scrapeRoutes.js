const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');

router.post('/leetcode/scrape', scrapeController.scrapeLeetCode);

module.exports = router;
