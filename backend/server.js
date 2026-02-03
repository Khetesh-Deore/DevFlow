const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const scrapeRoutes = require('./routes/scrapeRoutes');
const problemRoutes = require('./routes/problemRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'DevFlow Contest Platform API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', scrapeRoutes);
app.use('/api/problems', problemRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
