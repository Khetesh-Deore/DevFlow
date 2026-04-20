require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');

const calculateStreaks = async () => {
  try {
    console.log('\n🔥 Calculating User Streaks\n');
    console.log('='.repeat(70));

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let updated = 0;

    for (const user of users) {
      // Get all accepted submissions
      const acceptedSubmissions = await Submission.find({
        userId: user._id,
        status: 'accepted'
      }).sort({ createdAt: 1 }); // oldest first

      if (acceptedSubmissions.length === 0) {
        console.log(`⚪ ${user.name} (${user.rollNumber}) - No accepted submissions`);
        continue;
      }

      // Get unique dates when user solved problems (IST timezone)
      const solvedDates = acceptedSubmissions
        .map(s => {
          const date = new Date(s.createdAt);
          // Convert to IST (UTC+5:30)
          date.setMinutes(date.getMinutes() + 330);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .filter((date, index, self) => self.indexOf(date) === index) // unique dates
        .sort((a, b) => a - b); // oldest to newest

      // ═══════════════════════════════════════════════════════════════
      // Calculate MAX STREAK from history
      // ═══════════════════════════════════════════════════════════════
      let currentStreakInHistory = 1;
      let maxStreak = 1;

      for (let i = 1; i < solvedDates.length; i++) {
        const daysDiff = Math.floor((solvedDates[i] - solvedDates[i - 1]) / 86400000);
        
        if (daysDiff === 1) {
          // Consecutive day
          currentStreakInHistory++;
          maxStreak = Math.max(maxStreak, currentStreakInHistory);
        } else if (daysDiff > 1) {
          // Streak broken
          currentStreakInHistory = 1;
        }
        // If daysDiff === 0, same day, don't change streak
      }

      // ═══════════════════════════════════════════════════════════════
      // Calculate CURRENT ACTIVE STREAK
      // ═══════════════════════════════════════════════════════════════
      const lastDate = new Date(solvedDates[solvedDates.length - 1]);
      const today = new Date();
      today.setMinutes(today.getMinutes() + 330); // IST
      today.setHours(0, 0, 0, 0);
      
      const daysSinceLastSolved = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

      let currentStreak = 0;

      if (daysSinceLastSolved === 0 || daysSinceLastSolved === 1) {
        // Active streak (solved today or yesterday)
        currentStreak = 1;
        // Count backwards to find streak length
        for (let i = solvedDates.length - 2; i >= 0; i--) {
          const daysDiff = Math.floor((solvedDates[i + 1] - solvedDates[i]) / 86400000);
          if (daysDiff === 1) {
            currentStreak++;
          } else if (daysDiff > 1) {
            break;
          }
        }
      } else {
        // Streak broken (more than 1 day since last solve)
        currentStreak = 0;
      }

      // ═══════════════════════════════════════════════════════════════
      // Set last solved date (convert back from IST to UTC for storage)
      // ═══════════════════════════════════════════════════════════════
      const lastSolvedDate = new Date(solvedDates[solvedDates.length - 1]);
      lastSolvedDate.setMinutes(lastSolvedDate.getMinutes() - 330);

      // ═══════════════════════════════════════════════════════════════
      // Update user
      // ═══════════════════════════════════════════════════════════════
      if (!user.stats) user.stats = {};
      user.stats.streak = currentStreak;
      user.stats.maxStreak = maxStreak;
      user.stats.lastSolvedDate = lastSolvedDate;
      await user.save();

      // Display
      const statusIcon = currentStreak > 0 ? '🔥' : '⚪';
      const statusText = currentStreak > 0 ? 'ACTIVE' : 'BROKEN';
      
      console.log(`${statusIcon} ${user.name} (${user.rollNumber})`);
      console.log(`   Current Streak: ${currentStreak} days [${statusText}]`);
      console.log(`   Max Streak: ${maxStreak} days`);
      console.log(`   Last Solved: ${lastSolvedDate.toLocaleDateString('en-IN')} (${daysSinceLastSolved} days ago)`);
      console.log(`   Total Solved Days: ${solvedDates.length}`);
      console.log();

      updated++;
    }

    console.log('='.repeat(70));
    console.log(`\n✅ Streak Calculation Complete!`);
    console.log(`   Updated: ${updated} users\n`);

    // Show top streaks
    console.log('🏆 Top 5 Current Streaks:\n');
    const topStreaks = await User.find({ role: 'student' })
      .sort({ 'stats.streak': -1 })
      .limit(5)
      .select('name rollNumber stats.streak stats.maxStreak');

    topStreaks.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.rollNumber})`);
      console.log(`      Current: ${u.stats?.streak || 0} days`);
      console.log(`      Max: ${u.stats?.maxStreak || 0} days`);
    });

    console.log('\n🏆 Top 5 Max Streaks:\n');
    const topMaxStreaks = await User.find({ role: 'student' })
      .sort({ 'stats.maxStreak': -1 })
      .limit(5)
      .select('name rollNumber stats.streak stats.maxStreak');

    topMaxStreaks.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.rollNumber})`);
      console.log(`      Max: ${u.stats?.maxStreak || 0} days`);
      console.log(`      Current: ${u.stats?.streak || 0} days`);
    });

    console.log('\n✨ All streaks have been calculated!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

calculateStreaks();
