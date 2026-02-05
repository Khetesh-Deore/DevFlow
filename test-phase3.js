const axios = require('./backend/node_modules/axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let userToken = '';
let contestId = '';
let problemId = '';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

const tests = {
  async registerAdmin() {
    log('\n1. Register Admin User', 'blue');
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'admin_' + Date.now(),
        email: `admin_${Date.now()}@test.com`,
        password: 'admin123',
        role: 'admin'
      });
      adminToken = res.data.token;
      log('✓ Admin registered', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async registerUser() {
    log('\n2. Register Participant User', 'blue');
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'user_' + Date.now(),
        email: `user_${Date.now()}@test.com`,
        password: 'user123'
      });
      userToken = res.data.token;
      log('✓ User registered', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async createProblem() {
    log('\n3. Create Problem (Admin)', 'blue');
    try {
      const res = await axios.post(`${BASE_URL}/problems/create`, {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        sampleTestCases: [
          { input: '2 3 5', output: '5' }
        ],
        hiddenTestCases: [
          { input: '10 20 30', output: '30' }
        ],
        points: 100
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      problemId = res.data.problem._id;
      log(`✓ Problem created: ${problemId}`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async createContest() {
    log('\n4. Create Contest (Admin)', 'blue');
    try {
      const startTime = new Date(Date.now() + 60000);
      const endTime = new Date(Date.now() + 3600000);
      
      const res = await axios.post(`${BASE_URL}/contests`, {
        title: 'Test Contest',
        description: 'A test contest',
        customUrl: 'test-contest-' + Date.now(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: 60,
        settings: {
          visibility: 'public',
          maxTabSwitches: 3
        }
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      contestId = res.data.contest._id;
      log(`✓ Contest created: ${contestId}`, 'green');
      log(`  URL: ${res.data.contest.customUrl}`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async addProblemToContest() {
    log('\n5. Add Problem to Contest (Admin)', 'blue');
    try {
      await axios.post(`${BASE_URL}/contests/${contestId}/problems`, {
        problemId
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      log('✓ Problem added to contest', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async publishContest() {
    log('\n6. Publish Contest (Admin)', 'blue');
    try {
      const res = await axios.post(`${BASE_URL}/contests/${contestId}/publish`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      log(`✓ Contest published: ${res.data.contest.status}`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async registerForContest() {
    log('\n7. Register for Contest (User)', 'blue');
    try {
      await axios.post(`${BASE_URL}/contests/${contestId}/register`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log('✓ User registered for contest', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getContestById() {
    log('\n8. Get Contest by ID', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/contests/${contestId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log('✓ Contest retrieved', 'green');
      log(`  Title: ${res.data.contest.title}`, 'green');
      log(`  Status: ${res.data.contest.status}`, 'green');
      log(`  Participants: ${res.data.contest.participants.length}`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getAllContests() {
    log('\n9. Get All Contests', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/contests`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log(`✓ Retrieved ${res.data.contests.length} contests`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getContestProblems() {
    log('\n10. Get Contest Problems', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/contests/${contestId}/problems`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log(`✓ Retrieved ${res.data.problems.length} problems`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getContestParticipants() {
    log('\n11. Get Contest Participants', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/contests/${contestId}/participants`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log(`✓ Retrieved ${res.data.participants.length} participants`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async updateContest() {
    log('\n12. Update Contest (Admin)', 'blue');
    try {
      await axios.put(`${BASE_URL}/contests/${contestId}`, {
        description: 'Updated description'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      log('✓ Contest updated', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async unregisterFromContest() {
    log('\n13. Unregister from Contest (User)', 'blue');
    try {
      await axios.post(`${BASE_URL}/contests/${contestId}/unregister`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log('✓ User unregistered', 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getAllProblems() {
    log('\n14. Get All Problems', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/problems`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log(`✓ Retrieved ${res.data.problems.length} problems`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  },

  async getProblemById() {
    log('\n15. Get Problem by ID', 'blue');
    try {
      const res = await axios.get(`${BASE_URL}/problems/${problemId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      log('✓ Problem retrieved', 'green');
      log(`  Title: ${res.data.problem.title}`, 'green');
      return true;
    } catch (err) {
      log('✗ Failed: ' + err.response?.data?.message, 'red');
      return false;
    }
  }
};

async function runTests() {
  log('='.repeat(60), 'yellow');
  log('Phase 3: Contest Management System Tests', 'yellow');
  log('='.repeat(60), 'yellow');

  try {
    await axios.get('http://localhost:5000/api/health');
    log('✓ Server is running\n', 'green');
  } catch {
    log('✗ Server not running. Start with: npm run dev', 'red');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const [name, test] of Object.entries(tests)) {
    const result = await test();
    result ? passed++ : failed++;
    await new Promise(r => setTimeout(r, 300));
  }

  log('\n' + '='.repeat(60), 'yellow');
  log('Test Summary', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`Total: ${passed + failed}`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'yellow');

  if (failed === 0) {
    log('\n🎉 All Phase 3 tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed', 'red');
  }
}

runTests().catch(err => {
  log('\n✗ Test suite failed: ' + err.message, 'red');
  process.exit(1);
});
