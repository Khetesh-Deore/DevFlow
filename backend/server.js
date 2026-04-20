require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const { errorHandler } = require('./middleware/errorHandler');
const { initContestSocket } = require('./sockets/contestSocket');
const connectDB = require('./config/db');
const dbCheck = require('./middleware/dbCheck');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://192.168.76.210:5173',
      'http://localhost:8080',
      'https://devflow26.vercel.app',
      'https://devflow-frontend-new-1063807782201.europe-west1.run.app',
      'https://devflow-frontend-1063807782201.asia-south1.run.app',
      'https://devflow26-1063807782201.asia-south1.run.app'
    ];
    if (
      allowed.includes(origin) ||
      origin.includes('ngrok') ||
      origin.includes('ngrok-free') ||
      origin.includes('vercel.app') ||
      origin.includes('run.app') ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/api/v1', apiLimiter);

app.use('/api/v1/auth', dbCheck, authRoutes);
app.use('/api/v1/users', dbCheck, userRoutes);
app.use('/api/v1/problems', dbCheck, problemRoutes);
app.use('/api/v1/submissions', dbCheck, submissionRoutes);
app.use('/api/v1/contests', dbCheck, contestRoutes);
app.use('/api/v1/admin', dbCheck, adminRoutes);

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      'https://devflow26.vercel.app',
      'https://devflow-frontend-new-1063807782201.europe-west1.run.app'
    ],
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
initContestSocket(io);

connectDB();

// Start contest reminder cron
const { startContestReminderCron } = require('./services/contestReminderService');
startContestReminderCron();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { io };
