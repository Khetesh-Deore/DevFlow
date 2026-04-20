require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ContestSubmission = require('../models/ContestSubmission');
const Contest = require('../models/Contest');

const testContestPoints = async () => {
  try {
    console.log('\n🧪 Testing Contest Points System\n');
    console.log('='.repeat(60));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users with contest submissions
    const usersWithSubmissions = await ContestSubmission.distinct('userId');
    console.log(`📊 Found ${usersWithSubmissions.length} users with contest submissions\n`);

    for (const userId of usersWithSubmissions) {
      const user = await User.findById(userId);
      if (!user) continue;

      // Get all accepted contest submissions (first accepted only)
      const acceptedSubmissions = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true
      }).populate('contestId', 'title').populate('problemId', 'title');

      const totalPoints = acceptedSubmissions.reduce((sum, sub) => sum + (sub.points || 0), 0);

      console.log(`👤 ${user.name} (${user.rollNumber})`);
      console.log(`   Current Points in Profile: ${user.stats.points || 0}`);
      console.log(`   Calculated Contest Points: ${totalPoints}`);
      console.log(`   Problems Solved in Contests: ${acceptedSubmissions.length}`);
      
      if (acceptedSubmissions.length > 0) {
        console.log(`   Breakdown:`);
        acceptedSubmissions.forEach(sub => {
          console.log(`     - ${sub.problemId?.title || 'Unknown'} (${sub.contestId?.title || 'Unknown'}): ${sub.points} points`);
        });
      }
      
      if (user.stats.points !== totalPoints) {
        console.log(`   ⚠️  MISMATCH! Profile shows ${user.stats.points}, should be ${totalPoints}`);
      } else {
        console.log(`   ✅ Points are correct!`);
      }
      console.log();
    }

    console.log('='.repeat(60));
    console.log('\n💡 To fix mismatches, run: node scripts/recalculateContestPoints.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testContestPoints();
