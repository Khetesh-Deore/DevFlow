require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const CONTEST_ID = '69d72ad490e2944061a9c7e0';

const restoreContest = async () => {
  try {
    console.log('\n🔄 Attempting to Restore Deleted Contest\n');
    console.log('='.repeat(70));
    console.log(`Contest ID: ${CONTEST_ID}\n`);

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ═══════════════════════════════════════════════════════════════
    // 1. Check if contest exists in contests collection
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Searching in contests collection...');
    const contest = await db.collection('contests').findOne({ 
      _id: new mongoose.Types.ObjectId(CONTEST_ID) 
    });

    if (contest) {
      console.log('✅ Contest found in database!');
      console.log(`   Title: ${contest.title}`);
      console.log(`   Slug: ${contest.slug}`);
      console.log(`   Status: ${contest.status || 'N/A'}`);
      console.log(`   Problems: ${contest.problems?.length || 0}`);
      console.log('\n⚠️  Contest still exists in database. No restoration needed.\n');
      process.exit(0);
    }

    console.log('❌ Contest not found in contests collection.\n');

    // ═══════════════════════════════════════════════════════════════
    // 2. Check related data (submissions, registrations)
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Checking for related data...\n');

    const contestSubmissions = await db.collection('contestsubmissions').find({
      contestId: new mongoose.Types.ObjectId(CONTEST_ID)
    }).toArray();

    const registrations = await db.collection('contestregistrations').find({
      contestId: new mongoose.Types.ObjectId(CONTEST_ID)
    }).toArray();

    console.log(`   Contest Submissions: ${contestSubmissions.length}`);
    console.log(`   Registrations: ${registrations.length}\n`);

    if (contestSubmissions.length === 0 && registrations.length === 0) {
      console.log('❌ No related data found. Contest cannot be recovered.\n');
      console.log('💡 The contest was permanently deleted and cannot be restored.');
      console.log('   You will need to recreate it manually.\n');
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. Try to reconstruct contest from related data
    // ═══════════════════════════════════════════════════════════════
    console.log('🔧 Attempting to reconstruct contest from related data...\n');

    // Get unique problem IDs from submissions
    const problemIds = [...new Set(contestSubmissions.map(s => s.problemId?.toString()))];
    
    // Get problem details
    const problems = await db.collection('problems').find({
      _id: { $in: problemIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    // Get user details from registrations
    const userIds = registrations.map(r => r.userId);
    const users = await db.collection('users').find({
      _id: { $in: userIds }
    }).toArray();

    console.log('📊 Recovered Information:');
    console.log(`   Problems: ${problems.length}`);
    problems.forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.title} (${p.difficulty})`);
    });
    console.log(`   Registered Users: ${users.length}`);
    console.log(`   Total Submissions: ${contestSubmissions.length}\n`);

    // Get earliest and latest submission times to estimate contest duration
    const submissionTimes = contestSubmissions.map(s => new Date(s.createdAt).getTime());
    const earliestSubmission = new Date(Math.min(...submissionTimes));
    const latestSubmission = new Date(Math.max(...submissionTimes));

    console.log('⏰ Estimated Contest Timeline:');
    console.log(`   First Submission: ${earliestSubmission.toLocaleString('en-IN')}`);
    console.log(`   Last Submission: ${latestSubmission.toLocaleString('en-IN')}`);
    console.log(`   Duration: ${Math.round((latestSubmission - earliestSubmission) / 60000)} minutes\n`);

    // ═══════════════════════════════════════════════════════════════
    // 4. Create restoration data
    // ═══════════════════════════════════════════════════════════════
    console.log('⚠️  MANUAL RESTORATION REQUIRED\n');
    console.log('The contest was permanently deleted. To restore it, you need to:');
    console.log('\n1. Create a new contest in the admin panel with these details:');
    console.log(`   - Title: [RECOVERED] Contest ${CONTEST_ID.slice(-6)}`);
    console.log(`   - Type: rated (or appropriate type)`);
    console.log(`   - Start Time: ${earliestSubmission.toISOString()}`);
    console.log(`   - End Time: ${latestSubmission.toISOString()}`);
    console.log(`   - Duration: ${Math.round((latestSubmission - earliestSubmission) / 60000)} minutes`);
    console.log('\n2. Add these problems to the contest:');
    problems.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} (${p.slug}) - ${p.difficulty}`);
    });
    console.log('\n3. The submissions and registrations are still in the database.');
    console.log('   They reference the old contest ID, so they won\'t appear in the new contest.\n');

    // ═══════════════════════════════════════════════════════════════
    // 5. Offer to create a recovery JSON file
    // ═══════════════════════════════════════════════════════════════
    const recoveryData = {
      contestId: CONTEST_ID,
      problems: problems.map(p => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty
      })),
      registeredUsers: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        rollNumber: u.rollNumber
      })),
      submissionCount: contestSubmissions.length,
      estimatedStartTime: earliestSubmission.toISOString(),
      estimatedEndTime: latestSubmission.toISOString(),
      estimatedDuration: Math.round((latestSubmission - earliestSubmission) / 60000)
    };

    const fs = require('fs');
    const recoveryFile = `contest_recovery_${CONTEST_ID}.json`;
    fs.writeFileSync(recoveryFile, JSON.stringify(recoveryData, null, 2));
    
    console.log(`💾 Recovery data saved to: ${recoveryFile}\n`);
    console.log('='.repeat(70));
    console.log('\n❌ Contest cannot be automatically restored.');
    console.log('   Please recreate it manually using the information above.\n');

    process.exit(1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

restoreContest();
