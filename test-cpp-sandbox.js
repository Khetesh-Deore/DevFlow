const axios = require('./backend/node_modules/axios');

const SANDBOX_URL = 'http://localhost:3001';

const cppCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

async function testCpp() {
  console.log('Testing C++ compilation and execution...\n');
  
  try {
    console.log('Sending request to sandbox...');
    const startTime = Date.now();
    
    const response = await axios.post(`${SANDBOX_URL}/run`, {
      language: 'cpp',
      code: cppCode,
      testcases: [
        { input: '2 3', expected_output: '5' }
      ],
      constraints: {
        timeLimit: 5000,
        memoryLimit: 256
      }
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Connection': 'keep-alive'
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✓ Request completed in ${duration}ms\n`);
    console.log('Result:');
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Passed: ${response.data.passed}/${response.data.total}`);
    console.log(`  Runtime: ${response.data.runtime_ms}ms`);
    
    if (response.data.details) {
      console.log('\nDetails:');
      response.data.details.forEach((detail, idx) => {
        console.log(`  Test ${idx + 1}:`);
        console.log(`    Status: ${detail.status}`);
        console.log(`    Time: ${detail.time}ms`);
        if (detail.stdout) console.log(`    Output: ${detail.stdout.trim()}`);
        if (detail.stderr) console.log(`    Error: ${detail.stderr}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.code === 'ECONNRESET') {
      console.error('  Connection was reset by the server');
      console.error('  This usually means:');
      console.error('  1. The sandbox server crashed during compilation');
      console.error('  2. The compilation took too long and server closed connection');
      console.error('  3. There\'s a resource limit issue (memory/CPU)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('  Request timed out');
    } else {
      console.error(`  ${error.message}`);
    }
    
    if (error.response) {
      console.error('  Response:', error.response.data);
    }
  }
}

testCpp();
