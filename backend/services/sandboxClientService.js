const axios = require('axios');

const SANDBOX_URL = process.env.SANDBOX_URL || 'http://localhost:3001';

const checkSandboxHealth = async () => {
  try {
    const response = await axios.get(`${SANDBOX_URL}/health`, { timeout: 5000 });
    return response.data.status === 'OK';
  } catch (error) {
    console.error('Sandbox health check failed:', error.message);
    return false;
  }
};

const executeInSandbox = async (language, code, testcases, constraints = {}) => {
  try {
    const response = await axios.post(
      `${SANDBOX_URL}/run`,
      {
        language,
        code_type: 'full_program',
        code,
        testcases,
        constraints: {
          time_limit_ms: constraints.time_limit_ms || 5000,
          memory_mb: constraints.memory_mb || 256
        }
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      return {
        status: 'ERROR',
        message: error.response.data.message || 'Sandbox execution failed',
        errors: error.response.data.errors
      };
    }
    
    throw new Error(`Sandbox communication error: ${error.message}`);
  }
};

module.exports = {
  checkSandboxHealth,
  executeInSandbox
};
