const axios = require('axios');

const judgeClient = axios.create({
  baseURL: process.env.JUDGE_SERVICE_URL,
  timeout: 60000,
  headers: { 'X-API-Key': process.env.JUDGE_API_KEY || 'judge_internal_secret_key_change_this' }
});

exports.executeCode = async (payload) => {
  console.log(`\n🔧 [JUDGE SERVICE] Calling judge at ${process.env.JUDGE_SERVICE_URL}/execute`);
  console.log(`   Language  : ${payload.language}`);
  console.log(`   TestCases : ${payload.testcases?.length}`);
  console.log(`   TimeLimit : ${payload.time_limit}ms`);

  try {
    const { data } = await judgeClient.post('/execute', payload);
    console.log(`   ✅ Judge responded: ${data.overall_status} (${data.passed}/${data.total} passed)`);
    return data;
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Judge service error';
    console.error(`   ❌ Judge error: ${msg}`);
    throw new Error(msg);
  }
};

exports.checkJudgeHealth = async () => {
  try {
    const { data } = await judgeClient.get('/health');
    console.log(`💓 [JUDGE SERVICE] Health OK:`, data);
    return data;
  } catch (err) {
    console.warn(`⚠️  [JUDGE SERVICE] Health check failed: ${err.message}`);
    throw new Error('Judge service unavailable');
  }
};
