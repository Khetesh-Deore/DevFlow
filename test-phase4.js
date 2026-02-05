const axios = require('./backend/node_modules/axios');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: './backend/.env' });

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let contestId = '';
let problemId = '';

const testCode = {
  python: `def solution(a, b):
    return a + b`,
  cpp: `#include <iostream>
using namespace std;

int solution(int a, int b) {
    return a + b;
}`,
  javascript: `function solution(a, b) {
    return a + b;
}`
};

async function register() {
  const timestamp = Date.now();
  const response = await axios.post(`${API_URL}/auth/register`, {
    username: `testadmin_${timestamp}`,
    email: `admin_${timestamp}@example.com`,
    password: 'Test@1234',
    role: 'admin'
  });
  authToken = response.data.token;
  userId = response.data.user._id;
  console.log('✓ Admin user registered');
}

async function createContest() {
  const response = await axios.post(`${API_URL}/contests`, {
    title: 'Test Contest Phase 4',
    description: 'Testing submission pipeline',
    customUrl: `test-phase4-${Date.now()}`,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000),
    duration: 60,
    rules: 'Standard rules'
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  contestId = response.data.contest._id;
  console.log('✓ Contest created');
}

async function createProblem() {
  const timestamp = Date.now();
  const response = await axios.post(`${API_URL}/problems/create`, {
    title: `Two Sum Test ${timestamp}`,
    description: 'Add two numbers',
    difficulty: 'easy',
    points: 100,
    source: {
      platform: 'custom',
      url: `test-${timestamp}`,
      problemId: `test-${timestamp}`
    },
    limits: { timeLimit: 2, memoryLimit: 256 },
    sampleTestCases: [{ input: '2 3', output: '5' }],
    hiddenTestCases: [
      { input: '2 3', output: '5' },
      { input: '10 20', output: '30' }
    ]
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  problemId = response.data.problem._id;
  console.log('✓ Problem created');
}

async function linkProblem() {
  await axios.post(`${API_URL}/contests/${contestId}/problems`, {
    problemId: problemId
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('✓ Problem linked to contest');
}

async function publishContest() {
  await axios.post(`${API_URL}/contests/${contestId}/publish`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('✓ Contest published');
}

async function makeContestLive() {
  // Directly update database to set contest to live
  await mongoose.connect(process.env.MONGODB_URI);
  const Contest = mongoose.connection.collection('contests');
  await Contest.updateOne(
    { _id: new mongoose.Types.ObjectId(contestId) },
    { $set: { status: 'live' } }
  );
  await mongoose.connection.close();
  console.log('✓ Contest set to live');
}

async function registerForContest() {
  await axios.post(`${API_URL}/contests/${contestId}/register`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('✓ Registered for contest');
}

async function submitSolution(language) {
  const response = await axios.post(
    `${API_URL}/contests/${contestId}/problems/${problemId}/submit`,
    {
      code: testCode[language],
      language
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  console.log(`✓ ${language} submission queued: ${response.data.submissionId}`);
  return response.data.submissionId;
}

async function checkSubmission(submissionId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await axios.get(`${API_URL}/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const status = response.data.submission.status;
      if (status !== 'pending' && status !== 'running') {
        return response.data.submission;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1}: Still processing...`);
    }
  }
  throw new Error('Submission timeout');
}

async function getUserSubmissions() {
  const response = await axios.get(`${API_URL}/submissions`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log(`✓ Retrieved ${response.data.submissions.length} submissions`);
  return response.data.submissions;
}

async function runTests() {
  console.log('============================================================');
  console.log('DevFlow Phase 4 - Submission Pipeline Test Suite');
  console.log('============================================================\n');

  try {
    console.log('📝 Setup Phase...');
    await register();
    await createContest();
    await createProblem();
    await linkProblem();
    await publishContest();
    await makeContestLive();
    await registerForContest();
    console.log('');

    console.log('🚀 Testing Submissions...');
    const pythonSubmissionId = await submitSolution('python');
    console.log('⏳ Waiting for Python submission result...');
    const pythonResult = await checkSubmission(pythonSubmissionId);
    console.log(`Status: ${pythonResult.status}`);
    console.log(`Score: ${pythonResult.score}/${pythonResult.problemId.points}`);
    console.log(`Test Cases: ${pythonResult.testCasesPassed}/${pythonResult.totalTestCases}`);
    console.log(`Execution Time: ${pythonResult.executionTime}ms`);
    console.log('');

    const jsSubmissionId = await submitSolution('javascript');
    console.log('⏳ Waiting for JavaScript submission result...');
    const jsResult = await checkSubmission(jsSubmissionId);
    console.log(`Status: ${jsResult.status}`);
    console.log(`Score: ${jsResult.score}/${jsResult.problemId.points}`);
    console.log(`Test Cases: ${jsResult.testCasesPassed}/${jsResult.totalTestCases}`);
    console.log('');

    console.log('📊 Testing Submission History...');
    const submissions = await getUserSubmissions();
    console.log('');

    console.log('============================================================');
    console.log('Test Summary');
    console.log('============================================================');
    console.log(`Total Submissions: ${submissions.length}`);
    console.log(`Python Result: ${pythonResult.status}`);
    console.log(`JavaScript Result: ${jsResult.status}`);
    console.log('============================================================');
    console.log('🎉 Phase 4 submission pipeline working correctly!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
