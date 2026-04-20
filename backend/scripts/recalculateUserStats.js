require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const ContestSubmission = require('../models/ContestSubmission');

const recalculateUserStats = async () => {
  try {
    console.log('\n🔄 Recalculating All User Stats\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      console.log(`\n👤 Processing: ${user.name} (${user.rollNumber})`);

      // Get all submissions
      const allSubmissions = await Submission.find({ userId: user._id });
      const acceptedSubmissions = allSubmissions.filter(s => s.status === 'accepted');

      // Get unique solved problems
      const uniqueSolvedIds = [...new Set(acceptedSubmissions.map(s => s.problemId.toString()))];
      const solvedProblems = await Problem.find({ _id: { $in: uniqueSolvedIds } });

      // Calculate difficulty breakdown
      const easySolved = solvedProblems.filter(p => p.difficulty === 'Easy').length;
      const mediumSolved = solvedProblems.filter(p => p.difficulty === 'Medium').length;
      const hardSolved = solvedProblems.filter(p => p.difficulty === 'Hard').length;
      const totalSolved = solvedProblems.length;

      // Calculate contest points
      const contestSubs = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true
      });
      const contestPoints = contestSubs.reduce((sum, s) => sum + (s.points || 0), 0);

      // Calculate streak (keep existing if valid, otherwise reset)
      let streak = user.stats.streak || 0;
      let maxStreak = user.stats.maxStreak || 0;
      let lastSolvedDate = user.stats.lastSolvedDate;

      if (lastSolvedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDay = new Date(lastSolvedDate);
        lastDay.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - lastDay) / 86400000);

        // Reset streak if more than 1 day has passed
        if (daysDiff > 1) {
          streak = 0;
        }
      }

      // Ensure maxStreak is at least as high as current streak
      maxStreak = Math.max(maxStreak, streak);

      // Update user stats
      user.stats = {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        totalSubmissions: allSubmissions.length,
        acceptedSubmissions: acceptedSubmissions.length,
        points: contestPoints,
        streak,
        maxStreak,
        lastSolvedDate
      };

      user.solvedProblems = uniqueSolvedIds.map(id => mongoose.Types.ObjectId(id));

      await user.save();

      console.log(`   ✅ Updated:`);
      console.log(`      Total Solved: ${totalSolved} (E:${easySolved}, M:${mediumSolved}, H:${hardSolved})`);
      console.log(`      Submissions: ${allSubmissions.length} (${acceptedSubmissions.length} accepted)`);
      console.log(`      Contest Points: ${contestPoints}`);
      console.log(`      Streak: ${streak} days (Max: ${maxStreak} days)`);

      updated++;
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ Recalculation Complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users\n`);

    // Verify
    console.log('🔍 Running verification...\n');
    const sampleUser = await User.findOne({ role: 'student' });
    if (sampleUser) {
      console.log(`Sample User: ${sampleUser.name}`);
      console.log(`  Stats:`, sampleUser.stats);
      console.log(`  Solved Problems: ${sampleUser.solvedProblems.length}`);
    }

    console.log('\n✨ All user stats have been recalculated!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

recalculateUserStats();
