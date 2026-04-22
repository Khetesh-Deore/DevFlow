require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const ContestRegistration = require('../models/ContestRegistration');

const CONTEST_ID = '69d72ad490e2944061a9c7e0';

// ALL 39 participants from PDF with exact data
const ALL_PARTICIPANTS = [
  { rank: 1, name: 'Vedant Purkar', rollNumber: 'S3723011327', branch: 'CSE', batch: '2023-2027', solved: 6, points: 700, time: '259:49' },
  { rank: 2, name: 'Abhiijith Nair', rollNumber: '3724011019', branch: 'CSE', batch: '2024-2028', solved: 6, points: 650, time: '252:26' },
  { rank: 3, name: 'Sanchita Pawan Misar', rollNumber: '3724011007', branch: 'CSE', batch: '2024-2028', solved: 6, points: 650, time: '255:59' },
  { rank: 4, name: 'Pranali Arvind Bhavar', rollNumber: '3724011063', branch: 'CSE', batch: '2024-2028', solved: 6, points: 650, time: '261:37' },
  { rank: 5, name: 'Omkar Kahandal', rollNumber: '3724011002', branch: 'CSE', batch: '2024-2028', solved: 6, points: 650, time: '264:17' },
  { rank: 6, name: 'Roshan Jadhav', rollNumber: '3724011080', branch: 'CSE', batch: '2024-2028', solved: 5, points: 500, time: '222:11' },
  { rank: 7, name: 'Shaarav Jain', rollNumber: '3724011306', branch: 'CSE', batch: '2024-2028', solved: 5, points: 500, time: '247:28' },
  { rank: 8, name: 'Farukh Chaudhary', rollNumber: '3724011079', branch: 'CSE', batch: '2024-2028', solved: 5, points: 500, time: '262:08' },
  { rank: 9, name: 'Bhumika Jadhav', rollNumber: '3724011059', branch: 'CSE', batch: '2024-2028', solved: 5, points: 500, time: '292:31' },
  { rank: 10, name: 'Harshada Pravin Pawar', rollNumber: '3724011092', branch: 'CSE', batch: '2024-2028', solved: 4, points: 500, time: '320:05' },
  { rank: 11, name: 'Rucha Jadhav', rollNumber: '3724011317', branch: 'CSE', batch: '2024-2028', solved: 4, points: 425, time: '282:31' },
  { rank: 12, name: 'Anjali Karhale', rollNumber: '3724011082', branch: 'CE', batch: '2024-2028', solved: 4, points: 400, time: '211:16' },
  { rank: 13, name: 'Aditya Shinde', rollNumber: '3724011093', branch: 'CSE', batch: '2024-2028', solved: 4, points: 400, time: '262:56' },
  { rank: 14, name: 'Kalpesh Navnath bire', rollNumber: '3724011008', branch: 'CSE', batch: '2024-2028', solved: 4, points: 400, time: '282:24' },
  { rank: 15, name: 'Vedant Vijay Shinde', rollNumber: '3724011076', branch: 'CSE', batch: '2024-2028', solved: 4, points: 400, time: '308:37' },
  { rank: 16, name: 'Sumit Gulab jamdhade', rollNumber: '3724011010', branch: 'CSE', batch: '2024-2028', solved: 4, points: 400, time: '313:42' },
  { rank: 17, name: 'Himesh Sunil Adhikari', rollNumber: '8180024381', branch: 'CSE', batch: '2024-2028', solved: 4, points: 400, time: '314:34' },
  { rank: 18, name: 'Sahil Shailesh Kandalkar', rollNumber: '3724011312', branch: 'CSE', batch: '2024-28', solved: 4, points: 375, time: '262:50' },
  { rank: 19, name: 'Ayush Gaikwad', rollNumber: '3724011012', branch: 'CE', batch: '2024-2028', solved: 3, points: 325, time: '157:33' },
  { rank: 20, name: 'Ojaswita Sanjay Kapadne', rollNumber: '3724011039', branch: 'CSE', batch: '2024-2028', solved: 3, points: 275, time: '130:09' },
  { rank: 21, name: 'Om Jadhav', rollNumber: '3724011066', branch: 'CSE', batch: '2024-2028', solved: 3, points: 275, time: '165:18' },
  { rank: 22, name: 'Sanjana Bagul', rollNumber: '3724011033', branch: 'CSE', batch: '2024-2028', solved: 3, points: 275, time: '202:13' },
  { rank: 23, name: 'muskan nath', rollNumber: '47', branch: 'CE', batch: '2024-2028', solved: 3, points: 275, time: '208:11' },
  { rank: 24, name: 'Mansi Suryawanshi', rollNumber: '3724011020', branch: 'CE', batch: '2024-2028', solved: 3, points: 275, time: '245:57' },
  { rank: 25, name: 'Ayush Tandale', rollNumber: '3724011081', branch: 'CSE', batch: '2024=2028', solved: 3, points: 275, time: '266:42' },
  { rank: 26, name: 'Sakshi Anil PImpale', rollNumber: '3724011043', branch: 'CE', batch: '2024-28', solved: 2, points: 250, time: '158:29' },
  { rank: 27, name: 'Shweta Patil', rollNumber: '3724011067', branch: 'CSE', batch: '2024-2028', solved: 2, points: 175, time: '99:55' },
  { rank: 28, name: 'Srushti Kadam', rollNumber: '3724011005', branch: 'CE', batch: '2024-2028', solved: 2, points: 175, time: '102:42' },
  { rank: 29, name: 'Harsh Navandar', rollNumber: '37240111003', branch: 'CSE', batch: '2024-2028', solved: 2, points: 175, time: '144:38' },
  { rank: 30, name: 'Aarya Jadhav', rollNumber: '3724011310', branch: 'CSE', batch: '2024-2028', solved: 2, points: 175, time: '150:56' },
  { rank: 31, name: 'ANURAG BORSE', rollNumber: '3724081023', branch: 'CSE', batch: '2024-2028', solved: 1, points: 125, time: '36:34' },
  { rank: 32, name: 'Sahil', rollNumber: '3724011040', branch: 'CSE', batch: '2024-2028', solved: 1, points: 125, time: '40:29' },
  { rank: 33, name: 'Om Deshmukh', rollNumber: '3724011062', branch: 'CSE', batch: '2024-2028', solved: 1, points: 125, time: '50:00' },
  { rank: 34, name: 'Karan Gaikwad', rollNumber: '3724011087', branch: 'CSE', batch: '2024-2028', solved: 1, points: 50, time: '54:55' },
  { rank: 35, name: 'Hrutuja Hemant Patil', rollNumber: '3724011041', branch: 'CSE', batch: '2024-2028', solved: 1, points: 50, time: '56:38' },
  { rank: 36, name: 'Renuka Berad', rollNumber: '3724011026', branch: 'CSE', batch: '2024-2028', solved: 0, points: 0, time: '—' },
  { rank: 36, name: 'samruddhi thorat', rollNumber: '3724011307', branch: 'CSE', batch: '2024-2028', solved: 0, points: 0, time: '—' },
  { rank: 36, name: 'apurva', rollNumber: '3724011095', branch: 'CSE', batch: '2024-2028', solved: 0, points: 0, time: '—' },
  { rank: 36, name: 'Vaishnavi Itagi', rollNumber: '3724011038', branch: 'CSE', batch: '2024-2028', solved: 0, points: 0, time: '—' }
];

// Problem points mapping (from PDF)
const PROBLEM_POINTS = {
  'A': 200, 'B': 150, 'C': 150, 'D': 50,
  'E': 125, 'F': 125, 'G': 100, 'H': 100
};

const populateContestData = async () => {
  try {
    console.log('\n🚀 Populating SY_TnP Contest with Complete Data\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const contest = await Contest.findById(CONTEST_ID);
    if (!contest) {
      console.log('❌ Contest not found. Run recreateSYTnPContest.js first\n');
      process.exit(1);
    }

    console.log(`📊 Contest: ${contest.title}\n`);

    // ═══════════════════════════════════════════════════════════════
    // 1. MATCH ALL USERS
    // ═══════════════════════════════════════════════════════════════
    console.log('👥 Matching Users...\n');
    const allUsers = await User.find({});
    const matched = [];
    const notFound = [];

    for (const participant of ALL_PARTICIPANTS) {
      const user = allUsers.find(u => 
        u.rollNumber?.toLowerCase() === participant.rollNumber?.toLowerCase() ||
        u.name?.toLowerCase().includes(participant.name.toLowerCase().split(' ')[0])
      );

      if (user) {
        matched.push({ ...participant, userId: user._id, dbUser: user });
        console.log(`✅ ${participant.rank}. ${participant.name} (${participant.rollNumber})`);
      } else {
        notFound.push(participant);
        console.log(`⚠️  ${participant.rank}. ${participant.name} (${participant.rollNumber}) - NOT FOUND`);
      }
    }

    console.log(`\n📈 Matched: ${matched.length}/39\n`);

    // ═══════════════════════════════════════════════════════════════
    // 2. CREATE REGISTRATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 Creating Registrations...\n');
    
    // Delete existing registrations first
    const deletedRegs = await ContestRegistration.deleteMany({ contestId: contest._id });
    console.log(`🗑️  Deleted ${deletedRegs.deletedCount} existing registrations\n`);
    
    let regCount = 0;
    for (const m of matched) {
      try {
        await ContestRegistration.create({
          contestId: contest._id,
          userId: m.userId,
          registeredAt: new Date(contest.startTime.getTime() - 24 * 60 * 60 * 1000) // 1 day before
        });
        regCount++;
      } catch (err) {
        if (err.code !== 11000) { // Ignore duplicate key errors
          console.log(`⚠️  Failed to register ${m.name}: ${err.message}`);
        }
      }
    }

    console.log(`✅ Created ${regCount} registrations\n`);

    // ═══════════════════════════════════════════════════════════════
    // 3. CREATE MOCK SUBMISSIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('📝 Creating Contest Submissions...\n');
    
    // Delete existing submissions first
    const deletedSubs = await ContestSubmission.deleteMany({ contestId: contest._id });
    console.log(`🗑️  Deleted ${deletedSubs.deletedCount} existing submissions\n`);

    let subCount = 0;
    const contestProblems = contest.problems;

    for (const m of matched) {
      if (m.solved === 0) continue; // Skip users with 0 solved

      // Determine which problems they solved based on points
      const problemsSolved = [];
      let remainingPoints = m.points;

      // Strategy: Solve highest point problems first
      const sortedProblems = [...contestProblems].sort((a, b) => b.points - a.points);

      for (const prob of sortedProblems) {
        if (problemsSolved.length >= m.solved) break;
        if (remainingPoints >= prob.points) {
          problemsSolved.push(prob);
          remainingPoints -= prob.points;
        }
      }

      // If we still need more problems, add lower point ones
      if (problemsSolved.length < m.solved) {
        for (const prob of sortedProblems) {
          if (problemsSolved.length >= m.solved) break;
          if (!problemsSolved.find(p => p._id.equals(prob._id))) {
            problemsSolved.push(prob);
          }
        }
      }

      // Create submissions for solved problems
      const [hours, minutes] = (m.time || '0:0').split(':').map(Number);
      const totalMinutes = (hours || 0) * 60 + (minutes || 0);

      for (let i = 0; i < problemsSolved.length; i++) {
        const prob = problemsSolved[i];
        const submissionTime = new Date(contest.startTime.getTime() + (totalMinutes / problemsSolved.length) * (i + 1) * 60 * 1000);

        try {
          // First create a regular Submission
          const Submission = require('../models/Submission');
          const regularSubmission = await Submission.create({
            userId: m.userId,
            problemId: prob.problemId,
            code: `// Solution by ${m.name}\n// Problem: ${prob.label}\nconsole.log("Accepted");`,
            language: 'javascript',
            status: 'accepted',
            passedTestCases: 10,
            totalTestCases: 10,
            timeTakenMs: 100,
            memoryUsedKb: 1024,
            createdAt: submissionTime
          });

          // Then create ContestSubmission referencing it
          await ContestSubmission.create({
            contestId: contest._id,
            userId: m.userId,
            problemId: prob.problemId,
            submissionId: regularSubmission._id,
            status: 'accepted',
            points: prob.points,
            timeTakenSec: Math.floor((submissionTime - contest.startTime) / 1000),
            attemptNumber: 1,
            penaltyMinutes: 0,
            isFirstAccepted: true,
            submittedAt: submissionTime
          });
          subCount++;
        } catch (err) {
          console.log(`⚠️  Failed to create submission for ${m.name}: ${err.message}`);
        }
      }

      console.log(`✅ ${m.name}: ${problemsSolved.length} problems, ${m.points} points`);
    }

    console.log(`\n✅ Created ${subCount} submissions\n`);

    // ═══════════════════════════════════════════════════════════════
    // 4. UPDATE CONTEST
    // ═══════════════════════════════════════════════════════════════
    contest.registeredCount = regCount;
    await contest.save();

    console.log('='.repeat(70));
    console.log('\n🎉 Contest Data Population Complete!\n');
    console.log(`   Registrations: ${regCount}`);
    console.log(`   Submissions: ${subCount}`);
    console.log(`   Matched Users: ${matched.length}/39`);
    console.log(`   Not Found: ${notFound.length}\n`);

    if (notFound.length > 0) {
      console.log('⚠️  Users not found in database:');
      notFound.forEach(u => {
        console.log(`   - ${u.name} (${u.rollNumber})`);
      });
      console.log('\n💡 These users need to be created in the database first.\n');
    }

    console.log('✅ Visit /contests/sy-tnp to see the leaderboard!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

populateContestData();
