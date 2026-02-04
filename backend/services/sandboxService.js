const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../../sandbox/temp');
const TEMPLATE_DIR = path.join(__dirname, '../../sandbox/templates');

const LANGUAGE_CONFIG = {
  cpp: {
    extension: '.cpp',
    compile: (file, output) => `g++ -std=c++17 -O2 "${file}" -o "${output}"`,
    execute: (file) => `"${file}"`,
    needsCompile: true
  },
  c: {
    extension: '.c',
    compile: (file, output) => `gcc -std=c11 -O2 "${file}" -o "${output}"`,
    execute: (file) => `"${file}"`,
    needsCompile: true
  },
  java: {
    extension: '.java',
    compile: (file) => `javac "${file}"`,
    execute: (className, dir) => `java -cp "${dir}" ${className}`,
    needsCompile: true,
    className: 'Solution'
  },
  python: {
    extension: '.py',
    execute: (file) => process.platform === 'win32' ? `python "${file}"` : `python3 "${file}"`,
    needsCompile: false
  },
  javascript: {
    extension: '.js',
    execute: (file) => `node "${file}"`,
    needsCompile: false
  }
};

const FORBIDDEN_KEYWORDS = [
  'import os', 'import subprocess', 'eval(', 'exec(',
  '__import__', 'open(', 'file(',
  'System.exit', 'Runtime.getRuntime', 'ProcessBuilder',
  'system(', 'popen(', 'fork(', 'execve('
];

const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
  }
};

const cleanupFiles = async (files) => {
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (error) {}
  }
};

const validateRequest = (language, code, testcases, constraints) => {
  const errors = [];
  
  if (!LANGUAGE_CONFIG[language]) {
    errors.push(`Unsupported language: ${language}`);
  }
  
  if (!code || code.length === 0) {
    errors.push('Code cannot be empty');
  }
  
  if (code.length > 50000) {
    errors.push('Code size exceeds limit (50KB)');
  }
  
  if (!testcases || testcases.length === 0) {
    errors.push('At least one test case is required');
  }
  
  if (testcases && testcases.length > 100) {
    errors.push('Too many test cases (max 100)');
  }
  
  if (constraints) {
    if (constraints.time_limit_ms > 10000) {
      errors.push('Time limit too high (max 10s)');
    }
    if (constraints.memory_mb > 512) {
      errors.push('Memory limit too high (max 512MB)');
    }
  }
  
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (code.includes(keyword)) {
      errors.push(`Forbidden keyword detected: ${keyword}`);
    }
  }
  
  return errors;
};

const normalizeOutput = (str) => {
  return str.trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/gm, '')
    .replace(/\n+$/, '');
};

const compareOutputs = (actual, expected) => {
  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);
  return normalizedActual === normalizedExpected;
};

const compileCode = (language, filePath, outputPath) => {
  return new Promise((resolve, reject) => {
    const config = LANGUAGE_CONFIG[language];
    
    if (!config.needsCompile) {
      resolve();
      return;
    }
    
    const compileCmd = language === 'java' 
      ? config.compile(filePath)
      : config.compile(filePath, outputPath);
    
    exec(compileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject({
          status: 'CE',
          message: 'Compilation Error',
          stderr: stderr || error.message
        });
      } else {
        resolve();
      }
    });
  });
};

const executeCode = (language, filePath, input, timeout, memoryLimit) => {
  return new Promise((resolve) => {
    const config = LANGUAGE_CONFIG[language];
    const executeCmd = language === 'java'
      ? config.execute(config.className, path.dirname(filePath))
      : config.execute(filePath);
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const childProcess = exec(
      executeCmd,
      {
        timeout: timeout || 5000,
        maxBuffer: 1024 * 1024 * 10,
        killSignal: 'SIGKILL'
      },
      (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;
        const memoryUsed = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024);
        
        if (error) {
          if (error.killed || error.signal === 'SIGKILL') {
            resolve({
              status: 'TLE',
              message: 'Time Limit Exceeded',
              time: executionTime,
              memory: memoryUsed,
              stdout: '',
              stderr: 'Execution timeout'
            });
          } else {
            resolve({
              status: 'RE',
              message: 'Runtime Error',
              time: executionTime,
              memory: memoryUsed,
              stdout: stdout || '',
              stderr: stderr || error.message
            });
          }
        } else {
          resolve({
            status: 'OK',
            message: 'Execution completed',
            time: executionTime,
            memory: memoryUsed,
            stdout: stdout || '',
            stderr: stderr || ''
          });
        }
      }
    );
    
    if (input) {
      childProcess.stdin.write(input);
      childProcess.stdin.end();
    }
  });
};

const wrapCodeForFullProgram = (code) => {
  return code;
};

const wrapCodeForFunction = async (code, language, functionSignature) => {
  return code;
};

const runSingleTestCase = async (language, code, testcase, constraints, codeType) => {
  await ensureTempDir();
  
  const sessionId = uuidv4();
  const config = LANGUAGE_CONFIG[language];
  const fileName = language === 'java' ? `${config.className}${config.extension}` : `${sessionId}${config.extension}`;
  const filePath = path.join(TEMP_DIR, fileName);
  const outputPath = path.join(TEMP_DIR, sessionId);
  const classFile = language === 'java' ? path.join(TEMP_DIR, `${config.className}.class`) : null;
  
  const filesToCleanup = [filePath];
  if (config.needsCompile && language !== 'java') {
    filesToCleanup.push(outputPath + (process.platform === 'win32' ? '.exe' : ''));
  }
  if (classFile) {
    filesToCleanup.push(classFile);
  }
  
  try {
    const wrappedCode = codeType === 'function'
      ? await wrapCodeForFunction(code, language)
      : wrapCodeForFullProgram(code);
    
    await fs.writeFile(filePath, wrappedCode);
    
    await compileCode(language, filePath, outputPath);
    
    const executablePath = config.needsCompile && language !== 'java'
      ? outputPath + (process.platform === 'win32' ? '.exe' : '')
      : filePath;
    
    const result = await executeCode(
      language,
      executablePath,
      testcase.input,
      constraints?.time_limit_ms || 5000,
      constraints?.memory_mb || 256
    );
    
    await cleanupFiles(filesToCleanup);
    
    if (result.status !== 'OK') {
      return {
        status: result.status,
        passed: false,
        time: result.time,
        memory: result.memory,
        stdout: result.stdout,
        stderr: result.stderr,
        message: result.message
      };
    }
    
    const passed = compareOutputs(result.stdout, testcase.expected_output);
    
    return {
      status: passed ? 'AC' : 'WA',
      passed,
      time: result.time,
      memory: result.memory,
      stdout: result.stdout,
      stderr: result.stderr,
      expected: testcase.expected_output,
      message: passed ? 'Accepted' : 'Wrong Answer'
    };
    
  } catch (error) {
    await cleanupFiles(filesToCleanup);
    
    if (error.status === 'CE') {
      return {
        status: 'CE',
        passed: false,
        message: error.message,
        stderr: error.stderr
      };
    }
    
    return {
      status: 'ERROR',
      passed: false,
      message: 'Internal error',
      error: error.message
    };
  }
};

exports.runCode = async (req, res) => {
  const { language, code_type = 'full_program', code, testcases, constraints } = req.body;
  
  const validationErrors = validateRequest(language, code, testcases, constraints);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      errors: validationErrors
    });
  }
  
  try {
    const results = [];
    let totalTime = 0;
    let maxMemory = 0;
    let passedCount = 0;
    let stopExecution = false;
    
    for (let i = 0; i < testcases.length && !stopExecution; i++) {
      const testcase = testcases[i];
      
      const result = await runSingleTestCase(
        language,
        code,
        testcase,
        constraints,
        code_type
      );
      
      results.push({
        testcase: i + 1,
        ...result
      });
      
      if (result.passed) {
        passedCount++;
      }
      
      if (result.time) totalTime += result.time;
      if (result.memory) maxMemory = Math.max(maxMemory, result.memory);
      
      if (result.status === 'RE' || result.status === 'TLE' || result.status === 'CE') {
        stopExecution = true;
      }
    }
    
    const finalStatus = passedCount === testcases.length ? 'AC' :
                       results.some(r => r.status === 'CE') ? 'CE' :
                       results.some(r => r.status === 'TLE') ? 'TLE' :
                       results.some(r => r.status === 'RE') ? 'RE' : 'WA';
    
    res.json({
      status: finalStatus,
      passed: passedCount,
      total: testcases.length,
      runtime_ms: totalTime,
      memory_kb: maxMemory,
      details: results
    });
    
  } catch (error) {
    console.error('Sandbox execution error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Internal sandbox error',
      error: error.message
    });
  }
};
