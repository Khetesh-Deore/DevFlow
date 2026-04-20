require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');

const testStreakFeature = async () => {
  try {
    console.log('\n🔥 Testing Streak Feature\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get users with streaks
    const users = await User.find({ 'stats.streak': { $gt: 0 } }).limit(10);
    console.log(`📊 Found ${users.length} users with active streaks\n`);

    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());

    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.rollNumber})`);
      console.log('─'.repeat(70));

      const currentStreak = user.stats.streak || 0;
      const lastSolvedDate = user.stats.lastSolvedDate;

      console.log(`   Current Streak: ${currentStreak} days`);

      if (lastSolvedDate) {
        const istLastSolved = new Date(lastSolvedDate.getTime() + istOffset);
        const lastDay = new Date(istLastSolved.getFullYear(), istLastSolved.getMonth(), istLastSolved.getDate());
        const daysDiff = Math.floor((today - lastDay) / 86400000);

        console.log(`   Last Solved: ${lastSolvedDate.toISOString()}`);
        console.log(`   Last Solved (IST): ${istLastSolved.toISOString()}`);
        console.log(`   Days Since Last Solve: ${daysDiff}`);

        if (daysDiff === 0) {
          console.log(`   ✅ Solved today - Streak is active`);
        } else if (daysDiff === 1) {
          console.log(`   ⚠️  Solved yesterday - Streak will continue if solved today`);
        } else if (daysDiff > 1) {
          console.log(`   ❌ Gap of ${daysDiff} days - Streak should be reset to 0`);
          // Reset streak
          user.stats.streak = 0;
          await user.save();
          console.log(`   ✅ Streak reset to 0`);
        }

        // Get recent accepted submissions
        const recentSubs = await Submission.find({
          userId: user._id,
          status: 'accepted'
        }).sort({ createdAt: -1 }).limit(5).select('createdAt problemId');

        if (recentSubs.length > 0) {
          console.log(`\n   Recent Accepted Submissions (IST):`);
          recentSubs.forEach((sub, i) => {
            const istDate = new Date(sub.createdAt.getTime() + istOffset);
            const dateStr = istDate.toISOString().split('T')[0];
            const timeStr = istDate.toTimeString().split(' ')[0];
            console.log(`     ${i + 1}. ${dateStr} ${timeStr}`);
          });
        }
      } else {
        console.log(`   ⚠️  No lastSolvedDate recorded`);
      }
    }

    // Test streak calculation logic
    console.log('\n' + '='.repeat(70));
    console.log('\n🧪 Testing Streak Calculation Logic\n');

    const testCases = [
      { lastSolved: 0, current: 0, expected: 1, desc: 'First solve ever' },
      { lastSolved: 0, current: 5, expected: 5, desc: 'Same day solve' },
      { lastSolved: 1, current: 5, expected: 6, desc: 'Consecutive day solve' },
      { lastSolved: 2, current: 5, expected: 1, desc: 'Gap of 2 days - reset' },
      { lastSolved: 7, current: 10, expected: 1, desc: 'Gap of 7 days - reset' }
    ];

    testCases.forEach(tc => {
      const istNow = new Date(now.getTime() + istOffset);
      const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
      const lastDay = new Date(today.getTime() - (tc.lastSolved * 86400000));
      const daysDiff = Math.floor((today - lastDay) / 86400000);

      let newStreak = 1;
      if (tc.lastSolved === 0 && tc.current > 0) {
        newStreak = tc.current; // Same day
      } else if (daysDiff === 0) {
        newStreak = tc.current || 1;
      } else if (daysDiff === 1) {
        newStreak = (tc.current || 0) + 1;
      } else {
        newStreak = 1;
      }

      const passed = newStreak === tc.expected;
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${tc.desc}`);
      console.log(`   Last solved: ${tc.lastSolved} days ago, Current: ${tc.current}, Expected: ${tc.expected}, Got: ${newStreak}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Streak Feature Test Complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testStreakFeature();
