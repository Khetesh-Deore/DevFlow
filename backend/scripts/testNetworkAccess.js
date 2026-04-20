require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

async function testNetworkAccess() {
  console.log('\n🔍 Testing Network Access Configuration\n');
  console.log('=' .repeat(60));
  
  // Test 1: Environment Variables
  console.log('\n1️⃣  Environment Variables:');
  console.log(`   JUDGE_SERVICE_URL: ${process.env.JUDGE_SERVICE_URL}`);
  console.log(`   JUDGE_API_KEY: ${process.env.JUDGE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CLIENT_URL: ${process.env.CLIENT_URL}`);
  
  // Test 2: Judge Health Check
  console.log('\n2️⃣  Judge Service Health Check:');
  try {
    const healthResponse = await axios.get(`${process.env.JUDGE_SERVICE_URL}/health`, {
      timeout: 5000
    });
    console.log(`   ✅ Judge service is reachable`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}`);
  } catch (error) {
    console.log(`   ❌ Judge service unreachable: ${error.message}`);
    console.log(`   Make sure judge service is running on ${process.env.JUDGE_SERVICE_URL}`);
  }
  
  // Test 3: Judge API Key Authentication
  console.log('\n3️⃣  Judge API Key Authentication:');
  try {
    const authResponse = await axios.post(
      `${process.env.JUDGE_SERVICE_URL}/execute`,
      {
        language: 'python',
        code: 'print("test")',
        mode: 'run',
        testcases: [{ input: '', expected_output: 'test' }],
        time_limit: 5000,
        memory_limit: 256
      },
      {
        headers: {
          'X-API-Key': process.env.JUDGE_API_KEY
        },
        timeout: 10000
      }
    );
    console.log(`   ✅ API Key authentication successful`);
    console.log(`   Response: ${authResponse.data.overall_status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`   ❌ API Key authentication failed: ${error.response.data.error}`);
      console.log(`   Check that JUDGE_API_KEY in backend/.env matches API_KEY in judge/.env`);
    } else {
      console.log(`   ⚠️  Request failed: ${error.message}`);
    }
  }
  
  // Test 4: Network Interface
  console.log('\n4️⃣  Network Configuration:');
  console.log(`   Backend should be accessible at: http://10.10.0.36:5000`);
  console.log(`   Frontend should be accessible at: http://10.10.0.36:8080`);
  console.log(`   Judge should be accessible at: http://10.10.0.36:8000`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Test complete!\n');
}

testNetworkAccess().catch(console.error);
