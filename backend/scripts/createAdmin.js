require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const existing = await User.findOne({ email: 'admin@college.edu' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@kkwagh.edu.in',
    password: 'Admin@123devflow',
    rollNumber: 'ADMIN001',
    role: 'superadmin',
    isVerified: true,
    batch: 'N/A',
    branch: 'N/A'
  });

  console.log('Superadmin created:', admin.email);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
