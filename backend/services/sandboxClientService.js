const axios = require('axios');

class SandboxClient {
  constructor() {
    this.baseUrl = process.env.SANDBOX_URL || 'http://localhost:3001';
    this.timeout = 60000;
  }

  async executeCode(code, language, testCases, limits = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/run`, {
        language,
        code,
        testcases: testCases.map(tc => ({
          input: tc.input,
          expected_output: tc.output || tc.expected_output
        })),
        constraints: {
          timeLimit: (limits.timeLimit || 2) * 1000,
          memoryLimit: limits.memoryLimit || 256
        }
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.normalizeResponse(response.data);
    } catch (error) {
      if (error.response) {
        throw new Error(`Sandbox error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Sandbox service unavailable');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Sandbox execution timeout');
      }
      throw error;
    }
  }

  normalizeResponse(data) {
    return {
      status: data.status || 'RE',
      passed: data.passed || 0,
      total: data.total || 0,
      runtime_ms: data.runtime_ms || 0,
      memory_mb: data.memory_mb || 0,
      details: data.details || [],
      error: data.error
    };
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }

  async getSupportedLanguages() {
    try {
      const response = await axios.get(`${this.baseUrl}/languages`, {
        timeout: 5000
      });
      return response.data.languages || ['python', 'cpp', 'c', 'java', 'javascript'];
    } catch (error) {
      return ['python', 'cpp', 'c', 'java', 'javascript'];
    }
  }
}

module.exports = new SandboxClient();
