require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ContestSubmission = require('../models/ContestSubmission');

const recalculateContestPoints = async () => {
  try {
    console.log('\n🔄 Recalculating Contest Points for All Users\n');
    console.log('='.repeat(60));

    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 Database: ${dbName}\n`);

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database. Please check:');
      console.log('   1. Database connection is correct');
      console.log('   2. Users collection exists');
      console.log('   3. You have created at least one user\n');
      process.exit(0);
    }

    // Get total contest submissions
    const totalContestSubs = await ContestSubmission.countDocuments();
    const acceptedContestSubs = await ContestSubmission.countDocuments({ status: 'accepted' });
    console.log(`📝 Contest Submissions: ${totalContestSubs} total, ${acceptedContestSubs} accepted\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Get all accepted contest submissions for this user
      const acceptedSubmissions = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true  // Only count first accepted submission per problem
      }).populate('problemId', 'title').populate('contestId', 'title');

      // Calculate total contest points
      const totalContestPoints = acceptedSubmissions.reduce((sum, sub) => sum + (sub.points || 0), 0);

      // Always update, even if 0 (to reset incorrect values)
      const oldPoints = user.stats?.points || 0;
      if (!user.stats) user.stats = {};
      user.stats.points = totalContestPoints;
      await user.save();

      if (totalContestPoints > 0 || oldPoints !== totalContestPoints) {
        console.log(`✅ ${user.name} (${user.rollNumber})`);
        console.log(`   Old Points: ${oldPoints} → New Points: ${totalContestPoints}`);
        console.log(`   Contest Problems Solved: ${acceptedSubmissions.length}`);
        if (acceptedSubmissions.length > 0) {
          console.log(`   Contests:`);
          const contestMap = {};
          acceptedSubmissions.forEach(sub => {
            const contestTitle = sub.contestId?.title || 'Unknown';
            if (!contestMap[contestTitle]) contestMap[contestTitle] = [];
            contestMap[contestTitle].push({
              problem: sub.problemId?.title || 'Unknown',
              points: sub.points || 0
            });
          });
          Object.entries(contestMap).forEach(([contest, problems]) => {
            console.log(`     - ${contest}:`);
            problems.forEach(p => {
              console.log(`       • ${p.problem} (+${p.points} pts)`);
            });
          });
        }
        console.log();
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('='.repeat(60));
    console.log(`\n✨ Recalculation Complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users (no changes)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

recalculateContestPoints();
