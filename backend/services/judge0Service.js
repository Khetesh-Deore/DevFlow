const axios = require('axios');

const LANGUAGE_IDS = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'cpp': 54,
  'c': 50,
  'go': 60,
  'rust': 73
};

const createBatchSubmission = async (code, languageId, testCases) => {
  try {
    const submissions = testCases.map(tc => ({
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(tc.input).toString('base64'),
      expected_output: Buffer.from(tc.output).toString('base64')
    }));
    
    const response = await axios.post(
      `${process.env.JUDGE0_HOST}/submissions/batch`,
      { submissions },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        params: {
          base64_encoded: 'true',
          fields: '*'
        }
      }
    );
    
    return response.data.map(s => s.token);
  } catch (error) {
    console.error('Judge0 batch submission error:', error.response?.data || error.message);
    throw new Error('Failed to create batch submission');
  }
};

const createSubmission = async (code, languageId, input, expectedOutput) => {
  try {
    const response = await axios.post(
      `${process.env.JUDGE0_HOST}/submissions`,
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(input).toString('base64'),
        expected_output: Buffer.from(expectedOutput).toString('base64')
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        params: {
          base64_encoded: 'true',
          fields: '*'
        }
      }
    );
    
    return response.data.token;
  } catch (error) {
    console.error('Judge0 submission error:', error.response?.data || error.message);
    throw new Error('Failed to create submission');
  }
};

const getSubmissionResult = async (token) => {
  try {
    const response = await axios.get(
      `${process.env.JUDGE0_HOST}/submissions/${token}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        params: {
          base64_encoded: 'true',
          fields: '*'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Judge0 result fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch submission result');
  }
};

const waitForResult = async (token, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getSubmissionResult(token);
    
    if (result.status.id > 2) {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Submission timeout');
};

exports.executeCode = async (code, language, testCases) => {
  const languageId = LANGUAGE_IDS[language.toLowerCase()];
  
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  
  try {
    const tokens = await createBatchSubmission(code, languageId, testCases);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = [];
    
    for (let i = 0; i < tokens.length; i++) {
      try {
        const result = await waitForResult(tokens[i]);
        
        const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '';
        const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
        const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '';
        
        results.push({
          testCase: {
            input: testCases[i].input,
            expectedOutput: testCases[i].output,
            type: testCases[i].type
          },
          status: result.status.description,
          statusId: result.status.id,
          passed: result.status.id === 3,
          time: result.time,
          memory: result.memory,
          stdout,
          stderr,
          compileOutput
        });
      } catch (error) {
        results.push({
          testCase: {
            input: testCases[i].input,
            expectedOutput: testCases[i].output,
            type: testCases[i].type
          },
          status: 'Error',
          statusId: 0,
          passed: false,
          error: error.message
        });
      }
    }
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    return {
      results,
      summary: {
        passed: passedCount,
        total: totalCount,
        percentage: ((passedCount / totalCount) * 100).toFixed(2)
      }
    };
  } catch (batchError) {
    console.log('Batch submission failed, falling back to sequential...');
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const token = await createSubmission(
          code,
          languageId,
          testCase.input,
          testCase.output
        );
        
        const result = await waitForResult(token);
        
        const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '';
        const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
        const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '';
        
        results.push({
          testCase: {
            input: testCase.input,
            expectedOutput: testCase.output,
            type: testCase.type
          },
          status: result.status.description,
          statusId: result.status.id,
          passed: result.status.id === 3,
          time: result.time,
          memory: result.memory,
          stdout,
          stderr,
          compileOutput
        });
      } catch (error) {
        results.push({
          testCase: {
            input: testCase.input,
            expectedOutput: testCase.output,
            type: testCase.type
          },
          status: 'Error',
          statusId: 0,
          passed: false,
          error: error.message
        });
      }
    }
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    return {
      results,
      summary: {
        passed: passedCount,
        total: totalCount,
        percentage: ((passedCount / totalCount) * 100).toFixed(2)
      }
    };
  }
};
