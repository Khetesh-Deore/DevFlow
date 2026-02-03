const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../temp');

const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
  }
};

const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {}
};

const executePython = async (code, input, timeout = 5000) => {
  const wrappedCode = `${code}\n\nimport sys\nimport json\n\nif __name__ == "__main__":\n    input_data = sys.stdin.read().strip()\n    print(json.dumps(twoSum(*eval(input_data))))`;
  
  const fileName = `${uuidv4()}.py`;
  const filePath = path.join(TEMP_DIR, fileName);
  
  await fs.writeFile(filePath, wrappedCode);
  
  return new Promise((resolve) => {
    const process = exec(
      `python "${filePath}"`,
      { timeout, maxBuffer: 1024 * 1024 },
      async (error, stdout, stderr) => {
        await cleanupFile(filePath);
        
        if (error) {
          if (error.killed) {
            resolve({ status: 'Time Limit Exceeded', stdout: '', stderr: 'Execution timeout', passed: false });
          } else {
            resolve({ status: 'Runtime Error', stdout, stderr: stderr || error.message, passed: false });
          }
        } else {
          resolve({ status: 'Completed', stdout, stderr, passed: true });
        }
      }
    );
    
    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
};

const executeJavaScript = async (code, input, timeout = 5000) => {
  const fileName = `${uuidv4()}.js`;
  const filePath = path.join(TEMP_DIR, fileName);
  
  await fs.writeFile(filePath, code);
  
  return new Promise((resolve) => {
    const process = exec(
      `node "${filePath}"`,
      { timeout, maxBuffer: 1024 * 1024 },
      async (error, stdout, stderr) => {
        await cleanupFile(filePath);
        
        if (error) {
          if (error.killed) {
            resolve({ status: 'Time Limit Exceeded', stdout: '', stderr: 'Execution timeout', passed: false });
          } else {
            resolve({ status: 'Runtime Error', stdout, stderr: stderr || error.message, passed: false });
          }
        } else {
          resolve({ status: 'Completed', stdout, stderr, passed: true });
        }
      }
    );
    
    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
};

const executeJava = async (code, input, timeout = 5000) => {
  const wrappedCode = `import java.util.*;

public class Main {
    ${code}
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        
        // Parse "nums = [2,7,11,15], target = 9"
        int bracketStart = line.indexOf('[');
        int bracketEnd = line.indexOf(']');
        String numsStr = line.substring(bracketStart + 1, bracketEnd);
        String[] numStrs = numsStr.split(",");
        int[] nums = new int[numStrs.length];
        for (int i = 0; i < numStrs.length; i++) {
            nums[i] = Integer.parseInt(numStrs[i].trim());
        }
        
        int targetStart = line.indexOf("target = ") + 9;
        int target = Integer.parseInt(line.substring(targetStart).trim());
        
        Main solution = new Main();
        int[] result = solution.twoSum(nums, target);
        
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(result[i]);
            if (i < result.length - 1) System.out.print(",");
        }
        System.out.println("]");
    }
}`;
  
  const className = 'Main';
  const fileName = `${className}.java`;
  const filePath = path.join(TEMP_DIR, fileName);
  const classFile = path.join(TEMP_DIR, `${className}.class`);
  
  await fs.writeFile(filePath, wrappedCode);
  
  return new Promise((resolve) => {
    exec(`javac "${filePath}"`, async (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        await cleanupFile(filePath);
        resolve({ status: 'Compilation Error', stdout: '', stderr: compileStderr, passed: false });
        return;
      }
      
      const process = exec(
        `java -cp "${TEMP_DIR}" ${className}`,
        { timeout, maxBuffer: 1024 * 1024 },
        async (error, stdout, stderr) => {
          await cleanupFile(filePath);
          await cleanupFile(classFile);
          
          if (error) {
            if (error.killed) {
              resolve({ status: 'Time Limit Exceeded', stdout: '', stderr: 'Execution timeout', passed: false });
            } else {
              resolve({ status: 'Runtime Error', stdout, stderr: stderr || error.message, passed: false });
            }
          } else {
            resolve({ status: 'Completed', stdout, stderr, passed: true });
          }
        }
      );
      
      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }
    });
  });
};

const executeCpp = async (code, input, timeout = 5000) => {
  const wrappedCode = `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

${code}

int main() {
    string line;
    getline(cin, line);
    
    // Parse input
    istringstream iss(line);
    vector<int> nums;
    int target;
    
    // Simple parsing for "nums = [2,7,11,15], target = 9"
    size_t pos = line.find("[");
    size_t endPos = line.find("]");
    if (pos != string::npos && endPos != string::npos) {
        string numsStr = line.substr(pos + 1, endPos - pos - 1);
        istringstream numStream(numsStr);
        string num;
        while (getline(numStream, num, ',')) {
            nums.push_back(stoi(num));
        }
    }
    
    pos = line.find("target = ");
    if (pos != string::npos) {
        target = stoi(line.substr(pos + 9));
    }
    
    vector<int> result = twoSum(nums, target);
    cout << "[";
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    
    return 0;
}`;
  
  const fileName = `${uuidv4()}.cpp`;
  const filePath = path.join(TEMP_DIR, fileName);
  const exePath = path.join(TEMP_DIR, `${uuidv4()}.exe`);
  
  await fs.writeFile(filePath, wrappedCode);
  
  return new Promise((resolve) => {
    exec(`g++ "${filePath}" -o "${exePath}"`, async (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        await cleanupFile(filePath);
        resolve({ status: 'Compilation Error', stdout: '', stderr: compileStderr, passed: false });
        return;
      }
      
      const process = exec(
        `"${exePath}"`,
        { timeout, maxBuffer: 1024 * 1024 },
        async (error, stdout, stderr) => {
          await cleanupFile(filePath);
          await cleanupFile(exePath);
          
          if (error) {
            if (error.killed) {
              resolve({ status: 'Time Limit Exceeded', stdout: '', stderr: 'Execution timeout', passed: false });
            } else {
              resolve({ status: 'Runtime Error', stdout, stderr: stderr || error.message, passed: false });
            }
          } else {
            resolve({ status: 'Completed', stdout, stderr, passed: true });
          }
        }
      );
      
      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }
    });
  });
};

const compareOutput = (actual, expected) => {
  const normalizeOutput = (str) => {
    return str.trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+$/gm, '')
      .replace(/\s+/g, '')
      .replace(/"/g, '')
      .replace(/'/g, '');
  };
  return normalizeOutput(actual) === normalizeOutput(expected);
};

exports.executeCode = async (code, language, testCases) => {
  await ensureTempDir();
  
  const executors = {
    'python': executePython,
    'javascript': executeJavaScript,
    'java': executeJava,
    'cpp': executeCpp,
    'c': executeCpp
  };
  
  const executor = executors[language.toLowerCase()];
  
  if (!executor) {
    throw new Error(`Unsupported language: ${language}`);
  }
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const result = await executor(code, testCase.input);
      const executionTime = Date.now() - startTime;
      
      const passed = result.passed && compareOutput(result.stdout, testCase.output);
      
      results.push({
        testCase: {
          input: testCase.input,
          expectedOutput: testCase.output,
          type: testCase.type
        },
        status: passed ? 'Accepted' : result.status,
        passed,
        time: `${executionTime}ms`,
        stdout: result.stdout,
        stderr: result.stderr
      });
    } catch (error) {
      results.push({
        testCase: {
          input: testCase.input,
          expectedOutput: testCase.output,
          type: testCase.type
        },
        status: 'Error',
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
};
