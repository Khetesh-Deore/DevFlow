require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ContestSubmission = require('../models/ContestSubmission');

const recalculateContestPoints = async () => {
  try {
    console.log('\n🔄 Recalculating Contest Points for All Users\n');
    console.log('='.repeat(60));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Get all accepted contest submissions for this user
      const acceptedSubmissions = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true  // Only count first accepted submission per problem
      });

      // Calculate total contest points
      const totalContestPoints = acceptedSubmissions.reduce((sum, sub) => sum + (sub.points || 0), 0);

      if (totalContestPoints > 0) {
        // Update user's contest points
        user.stats.points = totalContestPoints;
        await user.save();
        
        console.log(`✅ ${user.name} (${user.rollNumber})`);
        console.log(`   Contest Points: ${totalContestPoints}`);
        console.log(`   Problems Solved in Contests: ${acceptedSubmissions.length}\n`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('='.repeat(60));
    console.log(`\n✨ Recalculation Complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users (no contest points)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

recalculateContestPoints();
