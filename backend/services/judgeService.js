const axios = require('axios');

const judgeClient = axios.create({
  baseURL: process.env.JUDGE_SERVICE_URL,
  timeout: 60000,
  headers: { 'X-API-Key': process.env.JUDGE_API_KEY }
});

exports.executeCode = async (payload) => {
  try {
    const { data } = await judgeClient.post('/execute', payload);
    return data;
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Judge service error';
    throw new Error(msg);
  }
};

exports.checkJudgeHealth = async () => {
  try {
    const { data } = await judgeClient.get('/health');
    return data;
  } catch (err) {
    throw new Error('Judge service unavailable');
  }
};
