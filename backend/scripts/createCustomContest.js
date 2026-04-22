require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');

// ═══════════════════════════════════════════════════════════════
// CUSTOMIZE YOUR CONTEST HERE
// ═══════════════════════════════════════════════════════════════
const CONTEST_CONFIG = {
  title: 'Practice Contest - December 2024',
  description: 'A comprehensive coding contest covering various problem-solving techniques. Test your skills and compete with peers!',
  type: 'rated', // 'rated', 'unrated', or 'practice'
  
  // Contest timing (adjust as needed)
  // Option 1: Past contest (for testing with historical data)
  startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  duration: 180, // 3 hours in minutes
  
  // Option 2: Upcoming contest (uncomment to use)
  // startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  // duration: 120, // 2 hours
  
  // Option 3: Live contest (uncomment to use)
  // startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
  // duration: 120, // 2 hours total
  
  scoringType: 'points', // 'points' or 'icpc'
  
  // Problem selection
  problemCount: 5, // How many problems to include
  pointsPerProblem: [100, 200, 300, 400, 500], // Points for each problem
  
  rules: `Contest Rules:
1. Fair Play: All code must be your own work
2. Multiple Submissions: You can submit multiple times, best score counts
3. Time Penalty: Wrong submissions add penalty time
4. No External Help: Use of AI tools or external resources is prohibited during live contests
5. Respect Others: Maintain a respectful environment for all participants`,
  
  isPublished: true
};

const createCustomContest = async () => {
  try {
    console.log('\n🎯 Creating Custom Contest\n');
    console.log('='.repeat(70));

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════════════
    // 1. Get available problems
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Fetching available problems...');
    const allProblems = await Problem.find({ isPublished: true })
      .sort({ difficulty: 1, title: 1 })
      .limit(CONTEST_CONFIG.problemCount);
    
    if (allProblems.length === 0) {
      console.log('❌ No published problems found. Please create problems first.\n');
      console.log('💡 Run: node backend/scripts/createAdmin.js to set up initial data\n');
      process.exit(1);
    }

    if (allProblems.length < CONTEST_CONFIG.problemCount) {
      console.log(`⚠️  Only ${allProblems.length} problems available (requested ${CONTEST_CONFIG.problemCount})`);
      console.log('   Proceeding with available problems...\n');
    }

    console.log(`✅ Found ${allProblems.length} problems\n`);

    // ═══════════════════════════════════════════════════════════════
    // 2. Calculate contest times
    // ═══════════════════════════════════════════════════════════════
    const startTime = CONTEST_CONFIG.startTime;
    const endTime = new Date(startTime.getTime() + CONTEST_CONFIG.duration * 60 * 1000);
    const now = new Date();
    
    let status = 'upcoming';
    if (now >= endTime) status = 'ended';
    else if (now >= startTime) status = 'live';

    // ═══════════════════════════════════════════════════════════════
    // 3. Build contest data
    // ═══════════════════════════════════════════════════════════════
    const contestData = {
      title: CONTEST_CONFIG.title,
      description: CONTEST_CONFIG.description,
      type: CONTEST_CONFIG.type,
      startTime: startTime,
      endTime: endTime,
      duration: CONTEST_CONFIG.duration,
      scoringType: CONTEST_CONFIG.scoringType,
      problems: allProblems.map((p, index) => ({
        problemId: p._id,
        order: index + 1,
        label: String.fromCharCode(65 + index), // A, B, C, D, E...
        points: CONTEST_CONFIG.pointsPerProblem[index] || (index + 1) * 100
      })),
      rules: CONTEST_CONFIG.rules,
      isPublished: CONTEST_CONFIG.isPublished,
      registeredCount: 0
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. Display contest preview
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Contest Preview:\n');
    console.log(`   Title: ${contestData.title}`);
    console.log(`   Type: ${contestData.type.toUpperCase()}`);
    console.log(`   Scoring: ${contestData.scoringType.toUpperCase()}`);
    console.log(`   Duration: ${contestData.duration} minutes`);
    console.log(`   Start: ${startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   End: ${endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Status: ${status.toUpperCase()}`);
    console.log(`   Published: ${contestData.isPublished ? 'Yes' : 'No'}\n`);

    console.log('📚 Problems:\n');
    contestData.problems.forEach((p, i) => {
      const problem = allProblems[i];
      const diffColor = {
        Easy: '🟢',
        Medium: '🟡',
        Hard: '🔴'
      };
      console.log(`   ${p.label}. ${problem.title}`);
      console.log(`      ${diffColor[problem.difficulty] || '⚪'} ${problem.difficulty} | ${p.points} points`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Creating contest...\n');

    // ═══════════════════════════════════════════════════════════════
    // 5. Create the contest
    // ═══════════════════════════════════════════════════════════════
    const contest = await Contest.create(contestData);

    console.log('='.repeat(70));
    console.log('\n🎉 Contest Created Successfully!\n');
    console.log(`   Contest ID: ${contest._id}`);
    console.log(`   Slug: ${contest.slug}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   Direct URL: http://localhost:5000/contests/${contest.slug}\n`);

    console.log('💡 Next Steps:\n');
    if (status === 'upcoming') {
      console.log('   1. Contest is scheduled for future');
      console.log('   2. Users can register now');
      console.log('   3. Contest will start automatically at scheduled time\n');
    } else if (status === 'live') {
      console.log('   1. Contest is LIVE now!');
      console.log('   2. Users can register and start solving');
      console.log('   3. Leaderboard updates in real-time\n');
    } else {
      console.log('   1. Contest has ended (for testing purposes)');
      console.log('   2. You can view final standings');
      console.log('   3. Users can still practice the problems\n');
    }

    console.log('✨ Contest is ready!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Duplicate key error. A contest with this title may already exist.');
      console.error('   Try changing the title in CONTEST_CONFIG.\n');
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

createCustomContest();
