const axios = require('axios');

const SANDBOX_URL = process.env.SANDBOX_URL || 'http://localhost:3001';

const testCases = [
  {
    name: 'Python Hello World',
    payload: {
      language: 'python',
      code: 'print(input())',
      testcases: [
        { input: 'Hello World', expected_output: 'Hello World' }
      ]
    }
  },
  {
    name: 'C++ Sum',
    payload: {
      language: 'cpp',
      code: `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
      testcases: [
        { input: '5 3', expected_output: '8' },
        { input: '10 20', expected_output: '30' }
      ]
    }
  },
  {
    name: 'JavaScript Array Sum',
    payload: {
      language: 'javascript',
      code: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    const nums = line.split(' ').map(Number);
    const sum = nums.reduce((a, b) => a + b, 0);
    console.log(sum);
});`,
      testcases: [
        { input: '1 2 3 4 5', expected_output: '15' },
        { input: '10 20', expected_output: '30' }
      ]
    }
  },
  {
    name: 'Python Time Limit Test',
    payload: {
      language: 'python',
      code: `import time
time.sleep(10)
print("Done")`,
      testcases: [
        { input: '', expected_output: 'Done' }
      ],
      constraints: {
        time_limit_ms: 1000
      }
    },
    expectFailure: true // This test is expected to TLE
  }
];

async function runTest(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${test.name}`);
  console.log('='.repeat(60));
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${SANDBOX_URL}/run`, test.payload, {
      timeout: 30000
    });
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.data.status}`);
    console.log(`Passed: ${response.data.passed}/${response.data.total}`);
    console.log(`Runtime: ${response.data.runtime_ms}ms`);
    console.log(`Request Duration: ${duration}ms`);
    
    if (response.data.details) {
      response.data.details.forEach((detail, idx) => {
        console.log(`\nTest Case ${idx + 1}:`);
        console.log(`  Status: ${detail.status}`);
        console.log(`  Passed: ${detail.passed}`);
        console.log(`  Time: ${detail.time}ms`);
        if (detail.stdout) console.log(`  Output: ${detail.stdout.substring(0, 100)}`);
        if (detail.stderr) console.log(`  Error: ${detail.stderr.substring(0, 100)}`);
      });
    }
    
    // If test expects failure (like TLE), check for appropriate status
    if (test.expectFailure) {
      const isExpectedFailure = response.data.status === 'TLE' || response.data.status === 'RE';
      console.log(`\n✓ Test behaved as expected (${response.data.status})`);
      return isExpectedFailure;
    }
    
    return response.data.status === 'AC';
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('DevFlow Sandbox Test Suite');
  console.log('='.repeat(60));
  
  try {
    const healthCheck = await axios.get(`${SANDBOX_URL}/health`);
    console.log(`Sandbox Health: ${healthCheck.data.status}`);
  } catch (error) {
    console.error('Sandbox is not responding. Make sure it is running.');
    process.exit(1);
  }
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
}

runAllTests();
