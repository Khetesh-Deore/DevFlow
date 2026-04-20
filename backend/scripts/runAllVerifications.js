require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { execSync } = require('child_process');
const path = require('path');

console.log('\n🔍 Running All Verification Scripts\n');
console.log('='.repeat(70));

const scripts = [
  {
    name: 'Profile Data Verification',
    file: 'verifyProfileData.js',
    description: 'Checks if all user stats match database records'
  },
  {
    name: 'Contest Points Test',
    file: 'testContestPoints.js',
    description: 'Verifies contest points are calculated correctly'
  },
  {
    name: 'Network Access Test',
    file: 'testNetworkAccess.js',
    description: 'Tests connectivity to judge service'
  }
];

let allPassed = true;

for (const script of scripts) {
  console.log(`\n📋 Running: ${script.name}`);
  console.log(`   ${script.description}`);
  console.log('─'.repeat(70));

  try {
    const scriptPath = path.join(__dirname, script.file);
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${script.name} completed successfully`);
  } catch (error) {
    console.log(`❌ ${script.name} failed`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(70));

if (allPassed) {
  console.log('\n✅ All verifications passed!');
  console.log('\n🎉 Your DevFlow platform is working correctly!\n');
} else {
  console.log('\n⚠️  Some verifications failed');
  console.log('\n💡 To fix issues, run:');
  console.log('   node scripts/recalculateUserStats.js');
  console.log('   node scripts/recalculateContestPoints.js\n');
}
