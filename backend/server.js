const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/database');
const scrapeRoutes = require('./routes/scrapeRoutes');
const problemRoutes = require('./routes/problemRoutes');
const sandboxRoutes = require('./routes/sandboxRoutes');
const automatedRoutes = require('./routes/automatedRoutes');
const authRoutes = require('./routes/authRoutes');
const contestRoutes = require('./routes/contestRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const violationRoutes = require('./routes/violationRoutes');
const { startCronJobs } = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);
}

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'DevFlow Contest Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api', submissionRoutes);
app.use('/api', violationRoutes);
app.use('/api', scrapeRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/automated', automatedRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ MongoDB: ${process.env.MONGODB_URI}`);
  startCronJobs();
});

// Socket.io setup (will be used for real-time features)
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Export io for use in other files
global.io = io;

// Socket.io connection handler (basic setup)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-contest', (data) => {
    const { contestId } = data;
    socket.join(`contest-${contestId}`);
    socket.contestId = contestId;
    
    const roomSize = io.sockets.adapter.rooms.get(`contest-${contestId}`)?.size || 0;
    io.to(`contest-${contestId}`).emit('participant-count', roomSize);
  });

  socket.on('join-admin-room', (contestId) => {
    socket.join(`admin-${contestId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.contestId) {
      const roomSize = io.sockets.adapter.rooms.get(`contest-${socket.contestId}`)?.size || 0;
      io.to(`contest-${socket.contestId}`).emit('participant-count', roomSize);
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
