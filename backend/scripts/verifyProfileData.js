require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const ContestSubmission = require('../models/ContestSubmission');

const verifyProfileData = async () => {
  try {
    console.log('\n🔍 Verifying Profile Data Integrity\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({ role: 'student' }).limit(10);
    console.log(`📊 Checking ${users.length} users...\n`);

    let totalIssues = 0;

    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.rollNumber})`);
      console.log('─'.repeat(70));

      const issues = [];

      // 1. Total Solved
      const actualSolved = user.solvedProblems.length;
      const statsSolved = user.stats.totalSolved || 0;
      if (actualSolved !== statsSolved) {
        issues.push(`❌ Total Solved: DB=${actualSolved}, Stats=${statsSolved}`);
      } else {
        console.log(`✅ Total Solved: ${actualSolved}`);
      }

      // 2. Difficulty Breakdown
      const solvedProblems = await Problem.find({ _id: { $in: user.solvedProblems } });
      const actualEasy = solvedProblems.filter(p => p.difficulty === 'Easy').length;
      const actualMedium = solvedProblems.filter(p => p.difficulty === 'Medium').length;
      const actualHard = solvedProblems.filter(p => p.difficulty === 'Hard').length;

      const statsEasy = user.stats.easySolved || 0;
      const statsMedium = user.stats.mediumSolved || 0;
      const statsHard = user.stats.hardSolved || 0;

      if (actualEasy !== statsEasy) {
        issues.push(`❌ Easy Solved: DB=${actualEasy}, Stats=${statsEasy}`);
      } else {
        console.log(`✅ Easy Solved: ${actualEasy}`);
      }

      if (actualMedium !== statsMedium) {
        issues.push(`❌ Medium Solved: DB=${actualMedium}, Stats=${statsMedium}`);
      } else {
        console.log(`✅ Medium Solved: ${actualMedium}`);
      }

      if (actualHard !== statsHard) {
        issues.push(`❌ Hard Solved: DB=${actualHard}, Stats=${statsHard}`);
      } else {
        console.log(`✅ Hard Solved: ${actualHard}`);
      }

      // 3. Total Submissions
      const actualTotalSubs = await Submission.countDocuments({ userId: user._id });
      const statsTotalSubs = user.stats.totalSubmissions || 0;
      if (actualTotalSubs !== statsTotalSubs) {
        issues.push(`❌ Total Submissions: DB=${actualTotalSubs}, Stats=${statsTotalSubs}`);
      } else {
        console.log(`✅ Total Submissions: ${actualTotalSubs}`);
      }

      // 4. Accepted Submissions
      const actualAccepted = await Submission.countDocuments({ userId: user._id, status: 'accepted' });
      const statsAccepted = user.stats.acceptedSubmissions || 0;
      if (actualAccepted !== statsAccepted) {
        issues.push(`❌ Accepted Submissions: DB=${actualAccepted}, Stats=${statsAccepted}`);
      } else {
        console.log(`✅ Accepted Submissions: ${actualAccepted}`);
      }

      // 5. Contest Points
      const contestSubs = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true
      });
      const actualPoints = contestSubs.reduce((sum, s) => sum + (s.points || 0), 0);
      const statsPoints = user.stats.points || 0;
      if (actualPoints !== statsPoints) {
        issues.push(`❌ Contest Points: DB=${actualPoints}, Stats=${statsPoints}`);
      } else {
        console.log(`✅ Contest Points: ${actualPoints}`);
      }

      // 6. Acceptance Rate
      const acceptanceRate = actualTotalSubs > 0
        ? ((actualAccepted / actualTotalSubs) * 100).toFixed(1)
        : '0.0';
      console.log(`✅ Acceptance Rate: ${acceptanceRate}%`);

      // 7. Streak
      console.log(`✅ Current Streak: ${user.stats.streak || 0} days`);
      if (user.stats.lastSolvedDate) {
        const daysSince = Math.floor((Date.now() - new Date(user.stats.lastSolvedDate)) / 86400000);
        console.log(`   Last solved: ${daysSince} days ago`);
      }

      // Summary
      if (issues.length > 0) {
        console.log(`\n⚠️  Found ${issues.length} issue(s):`);
        issues.forEach(issue => console.log(`   ${issue}`));
        totalIssues += issues.length;
      } else {
        console.log(`\n✅ All data is correct!`);
      }
    }

    console.log('\n' + '='.repeat(70));
    if (totalIssues > 0) {
      console.log(`\n⚠️  Total Issues Found: ${totalIssues}`);
      console.log(`\n💡 To fix issues, run:`);
      console.log(`   node scripts/recalculateUserStats.js`);
      console.log(`   node scripts/recalculateContestPoints.js`);
    } else {
      console.log(`\n✅ All profile data is accurate and working properly!`);
    }
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyProfileData();
