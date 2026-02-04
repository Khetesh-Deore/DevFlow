const Problem = require('../models/Problem');
const scrapeService = require('../services/scrapeService');
const codeforcesService = require('../services/codeforcesService');
const hackerrankService = require('../services/hackerrankService');
const gfgService = require('../services/gfgService');
const codechefService = require('../services/codechefService');
const testCaseGeneratorService = require('../services/testCaseGeneratorService');
const sandboxClientService = require('../services/sandboxClientService');

const getPlatformService = (url) => {
  if (url.includes('leetcode.com')) return { service: scrapeService, platform: 'leetcode' };
  if (url.includes('codeforces.com')) return { service: codeforcesService, platform: 'codeforces' };
  if (url.includes('hackerrank.com')) return { service: hackerrankService, platform: 'hackerrank' };
  if (url.includes('geeksforgeeks.org')) return { service: gfgService, platform: 'gfg' };
  if (url.includes('codechef.com')) return { service: codechefService, platform: 'codechef' };
  return null;
};

const parseProblemText = (text, platform) => {
  const lines = text.split('\n');
  let title = '';
  let difficulty = '';
  let statement = '';
  let constraints = '';
  let examples = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Problem:')) {
      title = line.replace('Problem:', '').trim();
    } else if (line.includes('Difficulty:')) {
      difficulty = line.replace('Difficulty:', '').trim();
    } else if (line.includes('Problem Statement:')) {
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('Examples:') && !lines[j].includes('Constraints:')) {
        statement += lines[j] + '\n';
        j++;
      }
    } else if (line.includes('Examples:') || line.includes('Example')) {
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('Constraints:')) {
        examples += lines[j] + '\n';
        j++;
      }
    } else if (line.includes('Constraints:')) {
      let j = i + 1;
      while (j < lines.length) {
        constraints += lines[j] + '\n';
        j++;
      }
    }
  }
  
  return {
    title: title || 'Untitled Problem',
    difficulty: difficulty || 'Unknown',
    statement: statement.trim() || text,
    constraints: constraints.trim(),
    examples: examples.trim()
  };
};

exports.automatedExecution = async (req, res) => {
  const { url, code, language } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  if (!language) {
    return res.status(400).json({ error: 'Language is required' });
  }
  
  try {
    const platformInfo = getPlatformService(url);
    
    if (!platformInfo) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    console.log(`\n=== STEP 1: Checking database for existing problem ===`);
    let problem = await Problem.findOne({ platform: platformInfo.platform, originalUrl: url });
    
    if (problem) {
      console.log(`✓ Problem found in database: ${problem.title}`);
      console.log(`✓ Using cached test cases (${problem.testCases.length} test cases)`);
      console.log(`✓ Problem ID: ${problem._id}`);
    } else {
      console.log(`⚠ Problem not found in database, scraping from ${url}`);
      
      console.log('\n=== STEP 2: Scraping problem ===');
      const scrapedText = await platformInfo.service.scrapeAndFormat(url);
      const problemData = parseProblemText(scrapedText, platformInfo.platform);
      
      console.log(`✓ Problem scraped: ${problemData.title}`);
      console.log(`✓ Difficulty: ${problemData.difficulty}`);
      
      console.log('\n=== STEP 3: Generating test cases ===');
      let testCases = [];
      
      try {
        testCases = await testCaseGeneratorService.generateTestCases(problemData);
        console.log(`✓ Generated ${testCases.length} test cases`);
      } catch (error) {
        console.log('⚠ AI test case generation failed, using sample cases only');
        testCases = testCaseGeneratorService.extractSampleTestCases(problemData);
        
        if (testCases.length === 0) {
          return res.status(400).json({ 
            error: 'No test cases available',
            message: 'Could not extract or generate test cases for this problem'
          });
        }
      }
      
      console.log('\n=== STEP 4: Saving problem to database ===');
      problem = new Problem({
        title: problemData.title,
        difficulty: problemData.difficulty,
        statement: problemData.statement,
        constraints: problemData.constraints,
        examples: problemData.examples,
        platform: platformInfo.platform,
        originalUrl: url,
        testCases
      });
      await problem.save();
      console.log(`✓ Problem saved to database (ID: ${problem._id})`);
    }
    
    const stepNumber = problem.testCases.length > 0 ? (await Problem.findOne({ platform: platformInfo.platform, originalUrl: url }) ? 2 : 5) : 5;
    
    console.log(`\n=== STEP ${stepNumber}: Checking sandbox health ===`);
    const isSandboxHealthy = await sandboxClientService.checkSandboxHealth();
    
    if (!isSandboxHealthy) {
      return res.status(503).json({ 
        error: 'Sandbox unavailable',
        message: 'Please start the sandbox server on port 3001',
        problemId: problem._id
      });
    }
    
    console.log('✓ Sandbox is healthy');
    
    console.log(`\n=== STEP ${stepNumber + 1}: Executing code in sandbox ===`);
    const sandboxTestcases = problem.testCases.map(tc => ({
      input: tc.input,
      expected_output: tc.output
    }));
    
    const result = await sandboxClientService.executeInSandbox(
      language,
      code,
      sandboxTestcases,
      {
        time_limit_ms: problem.timeLimit || 5000,
        memory_mb: Math.floor((problem.memoryLimit || 256000) / 1024)
      }
    );
    
    console.log(`\n=== STEP ${stepNumber + 2}: Execution completed ===`);
    console.log(`✓ Status: ${result.status}`);
    console.log(`✓ Passed: ${result.passed}/${result.total}`);
    console.log(`✓ Runtime: ${result.runtime_ms}ms`);
    
    res.json({
      success: true,
      problemId: problem._id,
      problem: {
        title: problem.title,
        difficulty: problem.difficulty,
        platform: problem.platform,
        url: url
      },
      execution: {
        language: language,
        status: result.status,
        passed: result.passed,
        total: result.total,
        runtime_ms: result.runtime_ms,
        verdict: result.status === 'AC' ? 'Accepted' : 
                 result.status === 'WA' ? 'Wrong Answer' :
                 result.status === 'TLE' ? 'Time Limit Exceeded' :
                 result.status === 'RE' ? 'Runtime Error' :
                 result.status === 'CE' ? 'Compilation Error' : 'Error',
        details: result.details
      },
      testCases: problem.testCases.map((tc, idx) => ({
        testcase: idx + 1,
        type: tc.type,
        isHidden: tc.isHidden,
        description: tc.description,
        result: result.details[idx]
      }))
    });
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
    
    res.status(500).json({ 
      error: 'Automated execution failed',
      message: error.message,
      details: error.stack
    });
  }
};

exports.executeById = async (req, res) => {
  const { problemId, code, language } = req.body;
  
  if (!problemId) {
    return res.status(400).json({ error: 'Problem ID is required' });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  if (!language) {
    return res.status(400).json({ error: 'Language is required' });
  }
  
  try {
    console.log(`\n=== STEP 1: Fetching problem from database ===`);
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    console.log(`✓ Problem found: ${problem.title}`);
    console.log(`✓ Test cases: ${problem.testCases.length}`);
    
    console.log('\n=== STEP 2: Checking sandbox health ===');
    const isSandboxHealthy = await sandboxClientService.checkSandboxHealth();
    
    if (!isSandboxHealthy) {
      return res.status(503).json({ 
        error: 'Sandbox unavailable',
        message: 'Please start the sandbox server on port 3001'
      });
    }
    
    console.log('✓ Sandbox is healthy');
    
    console.log('\n=== STEP 3: Executing code in sandbox ===');
    const sandboxTestcases = problem.testCases.map(tc => ({
      input: tc.input,
      expected_output: tc.output
    }));
    
    const result = await sandboxClientService.executeInSandbox(
      language,
      code,
      sandboxTestcases,
      {
        time_limit_ms: problem.timeLimit || 5000,
        memory_mb: Math.floor((problem.memoryLimit || 256000) / 1024)
      }
    );
    
    console.log(`\n=== STEP 4: Execution completed ===`);
    console.log(`✓ Status: ${result.status}`);
    console.log(`✓ Passed: ${result.passed}/${result.total}`);
    console.log(`✓ Runtime: ${result.runtime_ms}ms`);
    
    res.json({
      success: true,
      problemId: problem._id,
      problem: {
        title: problem.title,
        difficulty: problem.difficulty,
        platform: problem.platform,
        url: problem.originalUrl
      },
      execution: {
        language: language,
        status: result.status,
        passed: result.passed,
        total: result.total,
        runtime_ms: result.runtime_ms,
        verdict: result.status === 'AC' ? 'Accepted' : 
                 result.status === 'WA' ? 'Wrong Answer' :
                 result.status === 'TLE' ? 'Time Limit Exceeded' :
                 result.status === 'RE' ? 'Runtime Error' :
                 result.status === 'CE' ? 'Compilation Error' : 'Error',
        details: result.details
      },
      testCases: problem.testCases.map((tc, idx) => ({
        testcase: idx + 1,
        type: tc.type,
        isHidden: tc.isHidden,
        description: tc.description,
        result: result.details[idx]
      }))
    });
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
    
    res.status(500).json({ 
      error: 'Execution failed',
      message: error.message,
      details: error.stack
    });
  }
};
