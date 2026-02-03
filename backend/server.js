const express = require('express');
const cors = require('cors');
require('dotenv').config();
const scrapeRoutes = require('./routes/scrapeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'DevFlow LeetCode Scraper API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', scrapeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
