/**
 * Authentication System Test Script
 * Run this after starting the server to test auth endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user data
const testUser = {
  username: 'testuser_' + Date.now(),
  email: `test_${Date.now()}@example.com`,
  password: 'test123456'
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRegister() {
  try {
    log('\n📝 Testing User Registration...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.data.success) {
      authToken = response.data.token;
      log('✓ Registration successful', 'green');
      log(`  Username: ${response.data.user.username}`);
      log(`  Email: ${response.data.user.email}`);
      log(`  Role: ${response.data.user.role}`);
      log(`  Token: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    log('✗ Registration failed', 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testLogin() {
  try {
    log('\n🔐 Testing User Login...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      log('✓ Login successful', 'green');
      log(`  Token: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    log('✗ Login failed', 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetMe() {
  try {
    log('\n👤 Testing Get Current User...', 'blue');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log('✓ Get user successful', 'green');
      log(`  Username: ${response.data.user.username}`);
      log(`  Email: ${response.data.user.email}`);
      log(`  Rating: ${response.data.user.profile.rating}`);
      return true;
    }
  } catch (error) {
    log('✗ Get user failed', 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateProfile() {
  try {
    log('\n✏️  Testing Update Profile...', 'blue');
    const response = await axios.put(`${BASE_URL}/auth/profile`, {
      bio: 'I love competitive programming!',
      country: 'USA'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log('✓ Profile update successful', 'green');
      log(`  Bio: ${response.data.user.profile.bio}`);
      log(`  Country: ${response.data.user.profile.country}`);
      return true;
    }
  } catch (error) {
    log('✗ Profile update failed', 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testChangePassword() {
  try {
    log('\n🔑 Testing Change Password...', 'blue');
    const response = await axios.put(`${BASE_URL}/auth/password`, {
      currentPassword: testUser.password,
      newPassword: 'newpassword123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      log('✓ Password change successful', 'green');
      testUser.password = 'newpassword123'; // Update for future tests
      return true;
    }
  } catch (error) {
    log('✗ Password change failed', 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testProtectedRoute() {
  try {
    log('\n🔒 Testing Protected Route (without token)...', 'blue');
    await axios.get(`${BASE_URL}/auth/me`);
    log('✗ Should have failed without token', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✓ Protected route correctly rejected unauthorized request', 'green');
      return true;
    }
    log('✗ Unexpected error', 'red');
    return false;
  }
}

async function testInvalidLogin() {
  try {
    log('\n❌ Testing Invalid Login...', 'blue');
    await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'wrongpassword'
    });
    log('✗ Should have failed with wrong password', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✓ Invalid login correctly rejected', 'green');
      return true;
    }
    log('✗ Unexpected error', 'red');
    return false;
  }
}

async function runAllTests() {
  log('='.repeat(60), 'yellow');
  log('DevFlow Authentication System Test Suite', 'yellow');
  log('='.repeat(60), 'yellow');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/health');
    log('✓ Server is running', 'green');
  } catch (error) {
    log('✗ Server is not running. Please start the server first.', 'red');
    log('  Run: npm run dev', 'yellow');
    process.exit(1);
  }
  
  // Run tests
  const tests = [
    { name: 'Register', fn: testRegister },
    { name: 'Login', fn: testLogin },
    { name: 'Get Me', fn: testGetMe },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Change Password', fn: testChangePassword },
    { name: 'Protected Route', fn: testProtectedRoute },
    { name: 'Invalid Login', fn: testInvalidLogin }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'yellow');
  log('Test Summary', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`Total Tests: ${results.passed + results.failed}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Authentication system is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'red');
  }
}

// Run tests
runAllTests().catch(error => {
  log('\n✗ Test suite failed', 'red');
  log(`  Error: ${error.message}`, 'red');
  process.exit(1);
});
