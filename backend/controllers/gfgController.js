const gfgService = require('../services/gfgService');

exports.scrapeGFG = async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('geeksforgeeks.org/problems/')) {
    return res.status(400).json({ error: 'Invalid GeeksforGeeks problem URL' });
  }
  
  try {
    const output = await gfgService.scrapeAndFormat(url);
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
