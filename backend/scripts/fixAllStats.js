require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const ContestSubmission = require('../models/ContestSubmission');
const Contest = require('../models/Contest'); // Add this import

const fixAllStats = async () => {
  try {
    console.log('\n🔧 Fixing All User Stats & Contest Points\n');
    console.log('='.repeat(70));

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 Database: ${dbName}\n`);

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database.\n');
      process.exit(0);
    }

    // Get counts
    const totalProblems = await Problem.countDocuments();
    const totalContestSubs = await ContestSubmission.countDocuments();
    const totalRegularSubs = await Submission.countDocuments();
    
    console.log(`📝 Database Stats:`);
    console.log(`   Problems: ${totalProblems}`);
    console.log(`   Regular Submissions: ${totalRegularSubs}`);
    console.log(`   Contest Submissions: ${totalContestSubs}\n`);

    let updated = 0;

    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.rollNumber})`);

      // ═══════════════════════════════════════════════════════════════
      // 1. REGULAR PROBLEM STATS
      // ═══════════════════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════════════════
      // 2. CONTEST POINTS
      // ═══════════════════════════════════════════════════════════════
      const contestSubs = await ContestSubmission.find({
        userId: user._id,
        status: 'accepted',
        isFirstAccepted: true
      }).populate('contestId', 'title').populate('problemId', 'title');

      const contestPoints = contestSubs.reduce((sum, s) => sum + (s.points || 0), 0);

      // ═══════════════════════════════════════════════════════════════
      // 3. STREAK CALCULATION (based on actual submission dates)
      // ═══════════════════════════════════════════════════════════════
      let streak = 0;
      let maxStreak = 0;
      let lastSolvedDate = null;

      if (acceptedSubmissions.length > 0) {
        // Get all unique dates when user solved problems (IST timezone)
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

        if (solvedDates.length > 0) {
          // Calculate max streak from history
          let currentStreak = 1;
          maxStreak = 1;

          for (let i = 1; i < solvedDates.length; i++) {
            const daysDiff = Math.floor((solvedDates[i] - solvedDates[i - 1]) / 86400000);
            
            if (daysDiff === 1) {
              // Consecutive day
              currentStreak++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else if (daysDiff > 1) {
              // Streak broken
              currentStreak = 1;
            }
            // If daysDiff === 0, same day, don't change streak
          }

          // Calculate current active streak
          const lastDate = new Date(solvedDates[solvedDates.length - 1]);
          const today = new Date();
          today.setMinutes(today.getMinutes() + 330); // IST
          today.setHours(0, 0, 0, 0);
          
          const daysSinceLastSolved = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

          if (daysSinceLastSolved === 0 || daysSinceLastSolved === 1) {
            // Active streak (solved today or yesterday)
            streak = 1;
            // Count backwards to find streak length
            for (let i = solvedDates.length - 2; i >= 0; i--) {
              const daysDiff = Math.floor((solvedDates[i + 1] - solvedDates[i]) / 86400000);
              if (daysDiff === 1) {
                streak++;
              } else if (daysDiff > 1) {
                break;
              }
            }
          } else {
            // Streak broken (more than 1 day since last solve)
            streak = 0;
          }

          // Set last solved date (convert back from IST to UTC for storage)
          lastSolvedDate = new Date(solvedDates[solvedDates.length - 1]);
          lastSolvedDate.setMinutes(lastSolvedDate.getMinutes() - 330);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 4. UPDATE USER
      // ═══════════════════════════════════════════════════════════════
      if (!user.stats) user.stats = {};
      
      user.stats.totalSolved = totalSolved;
      user.stats.easySolved = easySolved;
      user.stats.mediumSolved = mediumSolved;
      user.stats.hardSolved = hardSolved;
      user.stats.totalSubmissions = allSubmissions.length;
      user.stats.acceptedSubmissions = acceptedSubmissions.length;
      user.stats.points = contestPoints;
      user.stats.streak = streak;
      user.stats.maxStreak = maxStreak;
      user.stats.lastSolvedDate = lastSolvedDate;

      user.solvedProblems = uniqueSolvedIds.map(id => new mongoose.Types.ObjectId(id));

      await user.save();

      // ═══════════════════════════════════════════════════════════════
      // 5. DISPLAY RESULTS
      // ═══════════════════════════════════════════════════════════════
      console.log(`   ✅ Updated:`);
      console.log(`      Problems: ${totalSolved} (E:${easySolved} M:${mediumSolved} H:${hardSolved})`);
      console.log(`      Submissions: ${allSubmissions.length} total, ${acceptedSubmissions.length} accepted`);
      console.log(`      Contest Points: ${contestPoints} (from ${contestSubs.length} problems)`);
      console.log(`      Streak: ${streak} days (Max: ${maxStreak})`);

      if (contestSubs.length > 0) {
        console.log(`      Contest Breakdown:`);
        const contestMap = {};
        contestSubs.forEach(sub => {
          const contestTitle = sub.contestId?.title || 'Unknown Contest';
          if (!contestMap[contestTitle]) contestMap[contestTitle] = [];
          contestMap[contestTitle].push({
            problem: sub.problemId?.title || 'Unknown',
            points: sub.points || 0
          });
        });
        Object.entries(contestMap).forEach(([contest, problems]) => {
          const totalPts = problems.reduce((sum, p) => sum + p.points, 0);
          console.log(`         ${contest}: ${problems.length} problems, ${totalPts} pts`);
        });
      }

      updated++;
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ Fix Complete!`);
    console.log(`   Updated: ${updated} users\n`);

    // ═══════════════════════════════════════════════════════════════
    // VERIFICATION
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Verification:\n');
    const topUsers = await User.find({ role: 'student' })
      .sort({ 'stats.points': -1 })
      .limit(5)
      .select('name rollNumber stats');

    console.log('Top 5 Users by Contest Points:');
    topUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.rollNumber})`);
      console.log(`      Points: ${u.stats?.points || 0}`);
      console.log(`      Solved: ${u.stats?.totalSolved || 0}`);
    });

    console.log('\n✨ All stats have been fixed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

fixAllStats();
