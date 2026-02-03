const codeforcesService = require('../services/codeforcesService');

exports.scrapeCodeforces = async (req, res) => {
	const { url } = req.body;

	if (!url || !url.includes('codeforces.com/problemset/problem/')) {
		return res.status(400).json({ error: 'Invalid Codeforces problem URL' });
	}

	try {
		const output = await codeforcesService.scrapeAndFormat(url);
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
