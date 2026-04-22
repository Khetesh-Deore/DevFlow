require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const ContestSubmission = require('../models/ContestSubmission');
const ContestRegistration = require('../models/ContestRegistration');

const CONTEST_ID = '69d72ad490e2944061a9c7e0';

// Reference data from PDF
const REFERENCE_PARTICIPANTS = [
  { name: 'Vedant Purkar', rollNumber: 'S3723011327', rank: 1, solved: 6, points: 700 },
  { name: 'Abhiijith Nair', rollNumber: '3724011019', rank: 2, solved: 6, points: 650 },
  { name: 'Sanchita Pawan Misar', rollNumber: '3724011007', rank: 3, solved: 6, points: 650 },
  { name: 'Pranali Arvind Bhavar', rollNumber: '3724011063', rank: 4, solved: 6, points: 650 },
  { name: 'Omkar Kahandal', rollNumber: '3724011002', rank: 5, solved: 6, points: 650 },
  // Add more as needed...
];

const analyzeAndLinkContestData = async () => {
  try {
    console.log('\n🔍 Analyzing Database & Linking Contest Data\n');
    console.log('='.repeat(70));
    console.log(`Target Contest ID: ${CONTEST_ID}\n`);

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ═══════════════════════════════════════════════════════════════
    // 1. ANALYZE CONTEST
    // ═══════════════════════════════════════════════════════════════
    console.log('📊 STEP 1: Analyzing Contest\n');
    const contest = await Contest.findById(CONTEST_ID);
    
    if (!contest) {
      console.log('❌ Contest not found with ID:', CONTEST_ID);
      console.log('   Please run: node backend/scripts/recreateSYTnPContest.js first\n');
      process.exit(1);
    }

    console.log(`✅ Contest Found: ${contest.title}`);
    console.log(`   Slug: ${contest.slug}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   Problems: ${contest.problems.length}`);
    console.log(`   Registered Count: ${contest.registeredCount}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 2. ANALYZE USERS
    // ═══════════════════════════════════════════════════════════════
    console.log('👥 STEP 2: Analyzing Users\n');
    const allUsers = await User.find({});
    console.log(`Total Users in Database: ${allUsers.length}\n`);

    // Match users from reference data
    const matchedUsers = [];
    const unmatchedUsers = [];

    for (const refUser of REFERENCE_PARTICIPANTS) {
      const user = allUsers.find(u => 
        u.rollNumber === refUser.rollNumber || 
        u.name.toLowerCase().includes(refUser.name.toLowerCase())
      );
      
      if (user) {
        matchedUsers.push({
          ...refUser,
          userId: user._id,
          dbName: user.name,
          dbRollNumber: user.rollNumber
        });
        console.log(`✅ Matched: ${refUser.name} (${refUser.rollNumber}) → ${user.name} (${user.rollNumber})`);
      } else {
        unmatchedUsers.push(refUser);
        console.log(`⚠️  Not Found: ${refUser.name} (${refUser.rollNumber})`);
      }
    }

    console.log(`\n📈 Match Summary:`);
    console.log(`   Matched: ${matchedUsers.length}/${REFERENCE_PARTICIPANTS.length}`);
    console.log(`   Unmatched: ${unmatchedUsers.length}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 3. ANALYZE EXISTING SUBMISSIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 STEP 3: Analyzing Existing Contest Submissions\n');
    
    const existingSubmissions = await ContestSubmission.find({
      contestId: new mongoose.Types.ObjectId(CONTEST_ID)
    }).populate('userId', 'name rollNumber').populate('problemId', 'title');

    console.log(`Existing Submissions for this Contest: ${existingSubmissions.length}\n`);

    if (existingSubmissions.length > 0) {
      console.log('Sample Submissions:');
      existingSubmissions.slice(0, 5).forEach(sub => {
        console.log(`   - ${sub.userId?.name || 'Unknown'} → ${sub.problemId?.title || 'Unknown'}`);
        console.log(`     Status: ${sub.status}, Points: ${sub.points || 0}`);
      });
      console.log();
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. ANALYZE REGISTRATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 STEP 4: Analyzing Contest Registrations\n');
    
    const existingRegistrations = await ContestRegistration.find({
      contestId: new mongoose.Types.ObjectId(CONTEST_ID)
    }).populate('userId', 'name rollNumber');

    console.log(`Existing Registrations: ${existingRegistrations.length}\n`);

    if (existingRegistrations.length > 0) {
      console.log('Registered Users:');
      existingRegistrations.slice(0, 10).forEach(reg => {
        console.log(`   - ${reg.userId?.name || 'Unknown'} (${reg.userId?.rollNumber || 'N/A'})`);
      });
      console.log();
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CREATE MISSING REGISTRATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('🔧 STEP 5: Creating Missing Registrations\n');

    let registrationsCreated = 0;
    const registeredUserIds = new Set(existingRegistrations.map(r => r.userId?._id?.toString()));

    for (const matchedUser of matchedUsers) {
      if (!registeredUserIds.has(matchedUser.userId.toString())) {
        try {
          await ContestRegistration.create({
            contestId: new mongoose.Types.ObjectId(CONTEST_ID),
            userId: matchedUser.userId,
            registeredAt: contest.startTime // Register at contest start time
          });
          console.log(`✅ Registered: ${matchedUser.dbName} (${matchedUser.dbRollNumber})`);
          registrationsCreated++;
        } catch (err) {
          console.log(`❌ Failed to register: ${matchedUser.dbName} - ${err.message}`);
        }
      }
    }

    console.log(`\n📊 Registrations Created: ${registrationsCreated}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 6. UPDATE CONTEST REGISTERED COUNT
    // ═══════════════════════════════════════════════════════════════
    const totalRegistrations = await ContestRegistration.countDocuments({
      contestId: new mongoose.Types.ObjectId(CONTEST_ID)
    });

    contest.registeredCount = totalRegistrations;
    await contest.save();

    console.log(`✅ Updated contest registeredCount: ${totalRegistrations}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 7. VERIFY PROBLEMS
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 STEP 6: Verifying Contest Problems\n');

    for (const cp of contest.problems) {
      const problem = await Problem.findById(cp.problemId);
      if (problem) {
        console.log(`✅ ${cp.label}. ${problem.title} (${cp.points} pts)`);
      } else {
        console.log(`❌ ${cp.label}. Problem not found (ID: ${cp.problemId})`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. GENERATE SUMMARY REPORT
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 FINAL SUMMARY REPORT\n');
    console.log('='.repeat(70));
    
    console.log('\n🏆 Contest Information:');
    console.log(`   ID: ${contest._id}`);
    console.log(`   Title: ${contest.title}`);
    console.log(`   Slug: ${contest.slug}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   Type: ${contest.type}`);
    console.log(`   Duration: ${contest.duration} minutes`);
    console.log(`   Problems: ${contest.problems.length}`);
    
    console.log('\n👥 Participants:');
    console.log(`   Total Registered: ${totalRegistrations}`);
    console.log(`   Matched from PDF: ${matchedUsers.length}`);
    console.log(`   New Registrations Created: ${registrationsCreated}`);
    
    console.log('\n📝 Submissions:');
    console.log(`   Total Contest Submissions: ${existingSubmissions.length}`);
    console.log(`   Accepted: ${existingSubmissions.filter(s => s.status === 'accepted').length}`);
    
    console.log('\n✅ Data Linking Status:');
    if (totalRegistrations >= 39) {
      console.log(`   ✅ Registration target met (${totalRegistrations}/39)`);
    } else {
      console.log(`   ⚠️  Registration target not met (${totalRegistrations}/39)`);
      console.log(`      ${39 - totalRegistrations} users still need to be registered`);
    }
    
    if (existingSubmissions.length > 0) {
      console.log(`   ✅ Contest has ${existingSubmissions.length} submissions`);
    } else {
      console.log(`   ⚠️  No submissions found for this contest`);
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Visit /contests/sy-tnp to view the contest');
    console.log('   2. Check leaderboard to verify rankings');
    console.log('   3. Verify all problems are accessible');
    console.log('   4. Test submission functionality\n');

    console.log('✨ Analysis and linking complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

analyzeAndLinkContestData();
