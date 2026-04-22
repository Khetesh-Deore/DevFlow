require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');

// ═══════════════════════════════════════════════════════════════
// SY_TnP CONTEST DATA (from PDF report)
// ═══════════════════════════════════════════════════════════════
const CONTEST_DATA = {
  // Use the original ID if you want to preserve references
  _id: new mongoose.Types.ObjectId('69d72ad490e2944061a9c7e0'),
  
  title: 'SY_TnP',
  description: 'Second Year Training and Placement Contest - Test your problem-solving skills with a variety of algorithmic challenges.',
  type: 'unrated',
  
  // Contest timing: 09 Apr 2026, 10:40 am to 12:10 pm (1h 30m)
  startTime: new Date('2026-04-09T10:40:00+05:30'), // IST
  endTime: new Date('2026-04-09T12:10:00+05:30'),   // IST
  duration: 90, // 1 hour 30 minutes
  
  scoringType: 'points',
  
  // 8 problems with exact points from PDF
  problemsData: [
    { label: 'A', title: 'Desorting', points: 200 },
    { label: 'B', title: 'Reverse Words in a String', points: 150 },
    { label: 'C', title: 'Move Zeroes', points: 150 },
    { label: 'D', title: 'Sqrt(x)', points: 50 },
    { label: 'E', title: 'Palindrome Number', points: 125 },
    { label: 'F', title: 'Power of Two', points: 125 },
    { label: 'G', title: 'Blank Space', points: 100 },
    { label: 'H', title: 'Single Number', points: 100 }
  ],
  
  rules: `Contest Rules:
1. Duration: 1 hour 30 minutes
2. Type: UNRATED (for practice and evaluation)
3. Multiple submissions allowed per problem
4. Only your best submission counts for each problem
5. Time penalty applies for wrong submissions
6. Fair play: All code must be your own work
7. No external help or AI tools during the contest`,
  
  isPublished: true,
  registeredCount: 39 // From PDF: 39 registered
};

const recreateSYTnPContest = async () => {
  try {
    console.log('\n🎯 Recreating SY_TnP Contest\n');
    console.log('='.repeat(70));

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════════════
    // 0. Get admin user for createdBy field
    // ═══════════════════════════════════════════════════════════════
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    
    if (!adminUser) {
      console.log('❌ No admin user found in database.');
      console.log('   Please create an admin user first using:');
      console.log('   node backend/scripts/createAdmin.js\n');
      process.exit(1);
    }
    
    console.log(`👤 Using admin: ${adminUser.name} (${adminUser.rollNumber})\n`);

    // ═══════════════════════════════════════════════════════════════
    // 1. Check if contest already exists
    // ═══════════════════════════════════════════════════════════════
    const existingContest = await Contest.findById(CONTEST_DATA._id);
    if (existingContest) {
      console.log('⚠️  Contest with this ID already exists!');
      console.log(`   Title: ${existingContest.title}`);
      console.log(`   Slug: ${existingContest.slug}\n`);
      console.log('❓ Do you want to delete and recreate it? (yes/no)');
      console.log('   For now, exiting to prevent duplicate...\n');
      process.exit(0);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Find or create problems
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Finding problems in database...\n');
    
    const problems = [];
    for (const pData of CONTEST_DATA.problemsData) {
      // Try to find problem by title (case-insensitive)
      let problem = await Problem.findOne({ 
        title: new RegExp(`^${pData.title}$`, 'i')
      });
      
      if (problem) {
        console.log(`   ✅ Found: ${pData.label}. ${problem.title}`);
        problems.push({
          problemId: problem._id,
          order: problems.length + 1,
          label: pData.label,
          points: pData.points
        });
      } else {
        console.log(`   ⚠️  Not found: ${pData.label}. ${pData.title}`);
        console.log(`      Will use placeholder problem`);
        
        // Use any available problem as placeholder
        const placeholder = await Problem.findOne({ isPublished: true });
        if (placeholder) {
          problems.push({
            problemId: placeholder._id,
            order: problems.length + 1,
            label: pData.label,
            points: pData.points
          });
        }
      }
    }

    console.log(`\n📚 Total problems mapped: ${problems.length}/8\n`);

    if (problems.length === 0) {
      console.log('❌ No problems found in database.');
      console.log('   Please create problems first or import them.\n');
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. Create contest
    // ═══════════════════════════════════════════════════════════════
    const contestDoc = {
      _id: CONTEST_DATA._id,
      title: CONTEST_DATA.title,
      description: CONTEST_DATA.description,
      type: CONTEST_DATA.type,
      startTime: CONTEST_DATA.startTime,
      endTime: CONTEST_DATA.endTime,
      duration: CONTEST_DATA.duration,
      scoringType: CONTEST_DATA.scoringType,
      problems: problems,
      rules: CONTEST_DATA.rules,
      isPublished: CONTEST_DATA.isPublished,
      registeredCount: CONTEST_DATA.registeredCount,
      createdBy: adminUser._id // Add admin user
    };

    console.log('📝 Contest Details:\n');
    console.log(`   ID: ${contestDoc._id}`);
    console.log(`   Title: ${contestDoc.title}`);
    console.log(`   Type: ${contestDoc.type.toUpperCase()}`);
    console.log(`   Duration: ${contestDoc.duration} minutes`);
    console.log(`   Start: ${contestDoc.startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   End: ${contestDoc.endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Registered: ${contestDoc.registeredCount} users`);
    console.log(`   Problems: ${contestDoc.problems.length}\n`);

    console.log('📚 Problems:\n');
    contestDoc.problems.forEach((p) => {
      console.log(`   ${p.label}. ${p.points} points`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Creating contest...\n');

    // Create the contest
    const contest = await Contest.create(contestDoc);

    console.log('='.repeat(70));
    console.log('\n🎉 SY_TnP Contest Recreated Successfully!\n');
    console.log(`   Contest ID: ${contest._id}`);
    console.log(`   Slug: ${contest.slug}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   URL: /contests/${contest.slug}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 4. Verify contest submissions still reference this contest
    // ═══════════════════════════════════════════════════════════════
    const db = mongoose.connection.db;
    const submissionCount = await db.collection('contestsubmissions').countDocuments({
      contestId: contest._id
    });
    const registrationCount = await db.collection('contestregistrations').countDocuments({
      contestId: contest._id
    });

    console.log('📊 Related Data:\n');
    console.log(`   Contest Submissions: ${submissionCount}`);
    console.log(`   Registrations: ${registrationCount}\n`);

    if (submissionCount > 0 || registrationCount > 0) {
      console.log('✅ Existing submissions and registrations are now linked to this contest!\n');
    } else {
      console.log('⚠️  No existing submissions or registrations found.');
      console.log('   This is a fresh contest. Users can register and participate.\n');
    }

    console.log('💡 Next Steps:\n');
    console.log('   1. Visit /contests/sy-tnp to view the contest');
    console.log('   2. Check the leaderboard to see if data is restored');
    console.log('   3. Verify all problems are accessible\n');

    console.log('✨ Contest restoration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Duplicate key error.');
      console.error('   A contest with this ID or slug already exists.');
      console.error('   Delete the existing contest first or use a different ID.\n');
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

recreateSYTnPContest();
