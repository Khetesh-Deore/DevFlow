const Problem = require('../models/Problem');
const scrapeService = require('../services/scrapeService');
const codeforcesService = require('../services/codeforcesService');
const hackerrankService = require('../services/hackerrankService');
const gfgService = require('../services/gfgService');
const codechefService = require('../services/codechefService');
const testCaseGeneratorService = require('../services/testCaseGeneratorService');
const localExecutorService = require('../services/localExecutorService');
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

exports.createProblem = async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const platformInfo = getPlatformService(url);
    
    if (!platformInfo) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    const existingProblem = await Problem.findOne({ platform: platformInfo.platform, originalUrl: url });
    if (existingProblem) {
      return res.status(200).json({ 
        message: 'Problem already exists',
        problemId: existingProblem._id,
        problem: existingProblem
      });
    }
    
    const scrapedText = await platformInfo.service.scrapeAndFormat(url);
    const problemData = parseProblemText(scrapedText, platformInfo.platform);
    
    const testCases = await testCaseGeneratorService.generateTestCases(problemData);
    
    const problem = new Problem({
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
    
    res.status(201).json({
      message: 'Problem created successfully',
      problemId: problem._id,
      problem
    });
  } catch (error) {
    console.error('Problem creation error:', error);
    res.status(500).json({ error: 'Failed to create problem', details: error.message });
  }
};

exports.getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    const publicTestCases = problem.testCases.filter(tc => !tc.isHidden);
    
    res.json({
      ...problem.toObject(),
      testCases: publicTestCases
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem', details: error.message });
  }
};

exports.submitSolution = async (req, res) => {
  const { code, language, use_sandbox = true } = req.body;
  const { id } = req.params;
  
  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }
  
  try {
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    let result;
    
    if (use_sandbox) {
      const isSandboxHealthy = await sandboxClientService.checkSandboxHealth();
      
      if (!isSandboxHealthy) {
        console.log('Sandbox unavailable, falling back to local executor');
        result = await localExecutorService.executeCode(code, language, problem.testCases);
      } else {
        const testcases = problem.testCases.map(tc => ({
          input: tc.input,
          expected_output: tc.output
        }));
        
        result = await sandboxClientService.executeInSandbox(
          language,
          code,
          testcases,
          {
            time_limit_ms: problem.timeLimit || 5000,
            memory_mb: Math.floor((problem.memoryLimit || 256000) / 1024)
          }
        );
      }
    } else {
      result = await localExecutorService.executeCode(code, language, problem.testCases);
    }
    
    res.json({
      problemId: id,
      language,
      ...result
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to execute code', details: error.message });
  }
};

exports.listProblems = async (req, res) => {
  try {
    const { platform, difficulty, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (platform) filter.platform = platform;
    if (difficulty) filter.difficulty = difficulty;
    
    const problems = await Problem.find(filter)
      .select('-testCases')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Problem.countDocuments(filter);
    
    res.json({
      problems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems', details: error.message });
  }
};
