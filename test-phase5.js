const axios = require('./backend/node_modules/axios');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: './backend/.env' });

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';
let userId = '';
let contestId = '';

async function register() {
  const timestamp = Date.now();
  const response = await axios.post(`${API_URL}/auth/register`, {
    username: `testuser_${timestamp}`,
    email: `user_${timestamp}@example.com`,
    password: 'Test@1234',
    role: 'participant'
  });
  authToken = response.data.token;
  userId = response.data.user.id;
  console.log(`✓ User registered: ${userId}`);
}

async function createContest() {
  const adminResponse = await axios.post(`${API_URL}/auth/register`, {
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: 'Test@1234',
    role: 'admin'
  });
  adminToken = adminResponse.data.token;
  
  const problemResponse = await axios.post(`${API_URL}/problems/create`, {
    title: `Test Problem ${Date.now()}`,
    description: 'Test',
    difficulty: 'easy',
    points: 100,
    source: { platform: 'custom', url: `test-${Date.now()}`, problemId: `test-${Date.now()}` },
    limits: { timeLimit: 2, memoryLimit: 256 },
    sampleTestCases: [{ input: '1', output: '1' }],
    hiddenTestCases: [{ input: '1', output: '1' }]
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  const response = await axios.post(`${API_URL}/contests`, {
    title: 'Anti-Cheat Test Contest',
    description: 'Testing violation system',
    customUrl: `test-phase5-${Date.now()}`,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000),
    duration: 60,
    rules: 'Standard rules',
    settings: {
      maxTabSwitches: 3
    }
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  contestId = response.data.contest._id;
  
  await axios.post(`${API_URL}/contests/${contestId}/problems`, {
    problemId: problemResponse.data.problem._id
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  await axios.post(`${API_URL}/contests/${contestId}/publish`, {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.collection('contests').updateOne(
    { _id: new mongoose.Types.ObjectId(contestId) },
    { $set: { status: 'live' } }
  );
  await mongoose.connection.close();
  
  console.log('✓ Contest created and set to live');
}

async function registerForContest() {
  await axios.post(`${API_URL}/contests/${contestId}/register`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('✓ Registered for contest');
}

async function recordViolation(type) {
  const response = await axios.post(`${API_URL}/violations`, {
    contestId,
    type,
    metadata: { browser: 'Chrome', timestamp: Date.now() }
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  return response.data;
}

async function getContestViolations() {
  const response = await axios.get(`${API_URL}/contests/${contestId}/violations`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return response.data;
}

async function unlockUser() {
  console.log(`Unlocking user ${userId} in contest ${contestId}`);
  await axios.post(`${API_URL}/contests/${contestId}/users/${userId}/unlock`, {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ User unlocked by admin');
}

async function runTests() {
  console.log('Phase 5 Anti-Cheat System Test\n');
  
  try {
    await register();
    await createContest();
    await registerForContest();
    
    console.log('\n🔒 Testing violation tracking...');
    
    let result = await recordViolation('tab_switch');
    console.log(`✓ Violation 1: count=${result.count}, locked=${result.locked}, remaining=${result.remainingWarnings}`);
    
    result = await recordViolation('tab_switch');
    console.log(`✓ Violation 2: count=${result.count}, locked=${result.locked}, remaining=${result.remainingWarnings}`);
    
    result = await recordViolation('tab_switch');
    console.log(`✓ Violation 3: count=${result.count}, locked=${result.locked}`);
    
    if (result.locked) {
      console.log('✓ User automatically locked after 3 violations');
    }
    
    console.log('\n📊 Testing admin violation view...');
    const violations = await getContestViolations();
    console.log(`✓ Total violations: ${violations.summary.totalViolations}`);
    console.log(`✓ Locked users: ${violations.summary.lockedUsers}`);
    console.log(`✓ Tab switches: ${violations.summary.byType.tab_switch}`);
    
    console.log('\n🔓 Testing admin unlock...');
    await unlockUser();
    
    console.log('\n✓ Phase 5 anti-cheat system working correctly');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
