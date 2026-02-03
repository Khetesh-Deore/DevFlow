const scrapeService = require('../services/scrapeService');

exports.scrapeLeetCode = async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('leetcode.com/problems/')) {
    return res.status(400).json({ error: 'Invalid LeetCode problem URL' });
  }
  
  try {
    const output = await scrapeService.scrapeAndFormat(url);
    res.type('text/plain').send(output);
  } catch (error) {
    if (error.message === 'Problem not found') {
      return res.status(404).json({ error: 'Problem not found' });
    }
    if (error.message === 'Request timeout') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
};
