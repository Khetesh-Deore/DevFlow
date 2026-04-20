require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const fixStreaks = async () => {
  try {
    console.log('\n🔧 Fixing User Streaks\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to check\n`);

    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());

    let fixed = 0;
    let unchanged = 0;

    for (const user of users) {
      const currentStreak = user.stats.streak || 0;
      const lastSolvedDate = user.stats.lastSolvedDate;

      if (!lastSolvedDate) {
        // No last solved date - streak should be 0
        if (currentStreak > 0) {
          console.log(`👤 ${user.name} (${user.rollNumber})`);
          console.log(`   No lastSolvedDate but streak is ${currentStreak}`);
          console.log(`   ✅ Resetting to 0\n`);
          user.stats.streak = 0;
          await user.save();
          fixed++;
        } else {
          unchanged++;
        }
        continue;
      }

      const istLastSolved = new Date(lastSolvedDate.getTime() + istOffset);
      const lastDay = new Date(istLastSolved.getFullYear(), istLastSolved.getMonth(), istLastSolved.getDate());
      const daysDiff = Math.floor((today - lastDay) / 86400000);

      if (daysDiff > 1 && currentStreak > 0) {
        // Gap > 1 day - streak should be 0
        console.log(`👤 ${user.name} (${user.rollNumber})`);
        console.log(`   Last solved: ${daysDiff} days ago`);
        console.log(`   Current streak: ${currentStreak}`);
        console.log(`   ✅ Resetting to 0\n`);
        user.stats.streak = 0;
        await user.save();
        fixed++;
      } else if (daysDiff === 0 || daysDiff === 1) {
        // Streak is still valid
        if (currentStreak > 0) {
          console.log(`👤 ${user.name} (${user.rollNumber})`);
          console.log(`   Last solved: ${daysDiff === 0 ? 'today' : 'yesterday'}`);
          console.log(`   ✅ Streak ${currentStreak} is valid\n`);
        }
        unchanged++;
      } else {
        unchanged++;
      }
    }

    console.log('='.repeat(70));
    console.log(`\n✅ Streak Fix Complete!`);
    console.log(`   Fixed: ${fixed} users`);
    console.log(`   Unchanged: ${unchanged} users\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixStreaks();
