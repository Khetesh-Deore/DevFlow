require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');

const calculateMaxStreak = async () => {
  try {
    console.log('\n🔥 Calculating Max Streak for All Users\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    let updated = 0;

    for (const user of users) {
      // Get all accepted submissions that solved new problems
      const acceptedSubs = await Submission.find({
        userId: user._id,
        status: 'accepted'
      }).sort({ createdAt: 1 }).select('createdAt problemId');

      if (acceptedSubs.length === 0) {
        console.log(`⏭️  ${user.name} - No submissions, skipping`);
        continue;
      }

      // Track unique problems solved per day
      const solvedByDay = new Map();
      const seenProblems = new Set();

      acceptedSubs.forEach(sub => {
        const problemId = sub.problemId.toString();
        
        // Only count first AC for each problem
        if (!seenProblems.has(problemId)) {
          seenProblems.add(problemId);
          
          const istDate = new Date(sub.createdAt.getTime() + istOffset);
          const dateKey = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
          
          if (!solvedByDay.has(dateKey)) {
            solvedByDay.set(dateKey, []);
          }
          solvedByDay.get(dateKey).push(sub.createdAt);
        }
      });

      // Calculate max streak from solving days
      const sortedDays = Array.from(solvedByDay.keys()).sort();
      
      let maxStreak = 0;
      let currentStreak = 0;
      let prevDate = null;

      sortedDays.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);

        if (!prevDate) {
          currentStreak = 1;
        } else {
          const daysDiff = Math.floor((currentDate - prevDate) / 86400000);
          
          if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
          } else {
            // Gap - reset streak
            currentStreak = 1;
          }
        }

        maxStreak = Math.max(maxStreak, currentStreak);
        prevDate = currentDate;
      });

      // Update user's maxStreak
      const currentMaxStreak = user.stats.maxStreak || 0;
      const calculatedMaxStreak = Math.max(maxStreak, user.stats.streak || 0);

      if (calculatedMaxStreak !== currentMaxStreak) {
        user.stats.maxStreak = calculatedMaxStreak;
        await user.save();
        
        console.log(`✅ ${user.name} (${user.rollNumber})`);
        console.log(`   Solved on ${sortedDays.length} different days`);
        console.log(`   Max Streak: ${currentMaxStreak} → ${calculatedMaxStreak}`);
        console.log(`   Current Streak: ${user.stats.streak || 0}\n`);
        updated++;
      } else {
        console.log(`✓  ${user.name} - Max streak already correct (${calculatedMaxStreak})`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ Max Streak Calculation Complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Total: ${users.length} users\n`);

    // Show top streaks
    const topStreaks = await User.find({ 'stats.maxStreak': { $gt: 0 } })
      .sort({ 'stats.maxStreak': -1 })
      .limit(10)
      .select('name rollNumber stats.maxStreak stats.streak');

    if (topStreaks.length > 0) {
      console.log('🏆 Top 10 Max Streaks:\n');
      topStreaks.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (${u.rollNumber})`);
        console.log(`      Max: ${u.stats.maxStreak} days | Current: ${u.stats.streak} days\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

calculateMaxStreak();
