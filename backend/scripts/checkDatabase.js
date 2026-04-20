require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

const checkDatabase = async () => {
  try {
    console.log('\n🔍 Database Diagnostic Check\n');
    console.log('='.repeat(60));

    // Check connection string
    console.log('📡 MongoDB URI:', process.env.MONGO_URI ? 'Found' : 'NOT FOUND');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections in database:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log();

    // Count documents
    const userCount = await User.countDocuments();
    const contestCount = await Contest.countDocuments();
    const contestSubCount = await ContestSubmission.countDocuments();
    const submissionCount = await Submission.countDocuments();
    const problemCount = await Problem.countDocuments();

    console.log('📊 Document Counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Problems: ${problemCount}`);
    console.log(`   Contests: ${contestCount}`);
    console.log(`   Contest Submissions: ${contestSubCount}`);
    console.log(`   Regular Submissions: ${submissionCount}`);
    console.log();

    // Sample users
    if (userCount > 0) {
      console.log('👥 Sample Users:');
      const sampleUsers = await User.find().limit(5).select('name rollNumber email stats');
      sampleUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.rollNumber})`);
        console.log(`     Email: ${u.email}`);
        console.log(`     Points: ${u.stats?.points || 0}`);
        console.log(`     Solved: ${u.stats?.totalSolved || 0}`);
      });
      console.log();
    }

    // Sample contests
    if (contestCount > 0) {
      console.log('🏆 Sample Contests:');
      const sampleContests = await Contest.find().limit(3).select('title slug startTime endTime');
      sampleContests.forEach(c => {
        try {
          const status = c.status || 'unknown';
          console.log(`   - ${c.title} (${c.slug}) - ${status}`);
        } catch (err) {
          console.log(`   - ${c.title} (${c.slug}) - [error getting status]`);
        }
      });
      console.log();
    }

    // Contest submissions breakdown
    if (contestSubCount > 0) {
      console.log('📝 Contest Submissions Breakdown:');
      const acceptedCount = await ContestSubmission.countDocuments({ status: 'accepted' });
      const firstAcceptedCount = await ContestSubmission.countDocuments({ 
        status: 'accepted', 
        isFirstAccepted: true 
      });
      console.log(`   Total: ${contestSubCount}`);
      console.log(`   Accepted: ${acceptedCount}`);
      console.log(`   First Accepted: ${firstAcceptedCount}`);
      
      // Sample contest submissions
      const sampleSubs = await ContestSubmission.find({ status: 'accepted' })
        .limit(3)
        .populate('userId', 'name rollNumber')
        .populate('problemId', 'title')
        .populate('contestId', 'title');
      
      if (sampleSubs.length > 0) {
        console.log('\n   Sample Accepted Submissions:');
        sampleSubs.forEach(s => {
          console.log(`   - ${s.userId?.name || 'Unknown'} solved ${s.problemId?.title || 'Unknown'}`);
          console.log(`     Contest: ${s.contestId?.title || 'Unknown'}`);
          console.log(`     Points: ${s.points || 0}`);
          console.log(`     First Accepted: ${s.isFirstAccepted ? 'Yes' : 'No'}`);
        });
      }
      console.log();
    }

    console.log('='.repeat(60));
    console.log('✨ Diagnostic Complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDatabase();
