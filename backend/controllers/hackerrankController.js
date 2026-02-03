const hackerrankService = require('../services/hackerrankService');

exports.scrapeHackerrank = async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('hackerrank.com/challenges/')) {
    return res.status(400).json({ error: 'Invalid HackerRank problem URL' });
  }
  
  try {
    const output = await hackerrankService.scrapeAndFormat(url);
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
