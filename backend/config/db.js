const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 60000);

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting) return;

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file');
    return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'devflow',
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 120000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      family: 4  // Force IPv4
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    isConnecting = false;
    setTimeout(connectDB, 10000);
    return;
  }
  isConnecting = false;
};

mongoose.connection.on('disconnected', () => {
  if (!process.env.MONGO_URI) return;
  console.warn('MongoDB disconnected. Reconnecting...');
  isConnecting = false;
  setTimeout(connectDB, 10000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

module.exports = connectDB;
