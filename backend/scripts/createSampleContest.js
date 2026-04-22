require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');

const createSampleContest = async () => {
  try {
    console.log('\n🎯 Creating Sample Contest\n');
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
    const allProblems = await Problem.find({ isPublished: true }).limit(5);
    
    if (allProblems.length === 0) {
      console.log('❌ No published problems found. Please create problems first.\n');
      process.exit(1);
    }

    console.log(`✅ Found ${allProblems.length} problems\n`);

    // ═══════════════════════════════════════════════════════════════
    // 2. Create contest data
    // ═══════════════════════════════════════════════════════════════
    const now = new Date();
    
    // Create a contest that ended recently (so it shows in history)
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endTime = new Date(startTime.getTime() + 120 * 60 * 1000); // 2 hours duration

    const contestData = {
      title: 'Weekly Coding Challenge #1',
      description: 'A practice contest to test your problem-solving skills. Solve as many problems as you can within the time limit.',
      type: 'rated',
      startTime: startTime,
      endTime: endTime,
      duration: 120, // 2 hours
      scoringType: 'points',
      problems: allProblems.map((p, index) => ({
        problemId: p._id,
        order: index + 1,
        label: String.fromCharCode(65 + index), // A, B, C, D, E
        points: (index + 1) * 100 // 100, 200, 300, 400, 500
      })),
      rules: `Contest Rules:
1. You can submit multiple times for each problem
2. Only your best submission counts
3. Penalty time is added for wrong submissions
4. Use of external resources is not allowed during live contests
5. Code must be your own work`,
      isPublished: true,
      registeredCount: 0
    };

    console.log('📝 Contest Details:');
    console.log(`   Title: ${contestData.title}`);
    console.log(`   Type: ${contestData.type}`);
    console.log(`   Duration: ${contestData.duration} minutes`);
    console.log(`   Start: ${startTime.toLocaleString('en-IN')}`);
    console.log(`   End: ${endTime.toLocaleString('en-IN')}`);
    console.log(`   Status: ended (for testing)`);
    console.log(`   Problems: ${contestData.problems.length}\n`);

    contestData.problems.forEach((p, i) => {
      const problem = allProblems[i];
      console.log(`   ${p.label}. ${problem.title} (${problem.difficulty}) - ${p.points} points`);
    });

    console.log('\n❓ Do you want to create this contest? (yes/no)');
    console.log('   Note: This will create a new contest in your database.\n');

    // Auto-create for script execution
    console.log('✅ Creating contest...\n');

    // ═══════════════════════════════════════════════════════════════
    // 3. Create the contest
    // ═══════════════════════════════════════════════════════════════
    const contest = await Contest.create(contestData);

    console.log('='.repeat(70));
    console.log('\n✅ Contest Created Successfully!\n');
    console.log(`   Contest ID: ${contest._id}`);
    console.log(`   Slug: ${contest.slug}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   URL: /contests/${contest.slug}\n`);

    console.log('💡 Next Steps:');
    console.log('   1. Visit the contest page to verify it works');
    console.log('   2. Register for the contest (if needed)');
    console.log('   3. Try submitting solutions to test the system\n');

    console.log('✨ Contest is ready to use!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

createSampleContest();
