const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const extractSampleTestCases = (problemData) => {
  const testCases = [];
  
  if (problemData.examples) {
    const exampleText = problemData.examples;
    const exampleBlocks = exampleText.split(/Example \d+:/i);
    
    for (const block of exampleBlocks) {
      if (!block.trim()) continue;
      
      const inputMatch = block.match(/Input[:\s]*\n?([\s\S]*?)(?=Output|$)/i);
      const outputMatch = block.match(/Output[:\s]*\n?([\s\S]*?)(?=Explanation|Example|$)/i);
      
      if (inputMatch && outputMatch) {
        let input = inputMatch[1].trim();
        let output = outputMatch[1].trim();
        
        input = input.split('\n')[0].trim();
        output = output.split('\n')[0].trim();
        
        output = output.replace(/Explanation:.*/gi, '').trim();
        
        if (input && output) {
          testCases.push({
            input,
            output,
            type: 'sample',
            isHidden: false,
            description: `Sample test case ${testCases.length + 1}`
          });
        }
      }
    }
  }
  
  return testCases;
};

const generateWithGemini = async (problemData) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a competitive programming test case generator. Generate 5-10 edge case test cases for the following problem.

Problem Title: ${problemData.title}
Problem Statement: ${problemData.statement}
Constraints: ${problemData.constraints || 'Not specified'}
Sample Examples: ${problemData.examples || 'Not provided'}

Generate test cases that cover:
1. Minimum constraint values
2. Maximum constraint values
3. Edge cases (empty input, single element, etc.)
4. Corner cases specific to the problem

Return ONLY a valid JSON array in this exact format:
[
  {
    "input": "test input here",
    "output": "expected output here",
    "description": "what this test case covers"
  }
]

Do not include any markdown, explanations, or text outside the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }
    
    const testCases = JSON.parse(jsonMatch[0]);
    
    return testCases.map(tc => ({
      input: tc.input,
      output: tc.output,
      type: 'edge',
      isHidden: true,
      description: tc.description
    }));
  } catch (error) {
    console.error('Gemini generation failed:', error.message);
    throw error;
  }
};

const generateWithGrok = async (problemData) => {
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a competitive programming test case generator. Generate edge case test cases in JSON format only.'
          },
          {
            role: 'user',
            content: `Generate 5-10 edge case test cases for this problem:

Title: ${problemData.title}
Statement: ${problemData.statement}
Constraints: ${problemData.constraints || 'Not specified'}
Examples: ${problemData.examples || 'Not provided'}

Return ONLY a JSON array:
[{"input": "...", "output": "...", "description": "..."}]`
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Grok');
    }
    
    const testCases = JSON.parse(jsonMatch[0]);
    
    return testCases.map(tc => ({
      input: tc.input,
      output: tc.output,
      type: 'edge',
      isHidden: true,
      description: tc.description
    }));
  } catch (error) {
    console.error('Grok generation failed:', error.message);
    throw error;
  }
};

const generateRandomTestCases = (problemData) => {
  const testCases = [];
  
  if (!problemData.constraints) {
    return testCases;
  }
  
  const constraintText = problemData.constraints.toLowerCase();
  const numberMatches = constraintText.match(/(\d+)\s*[≤<=]\s*\w+\s*[≤<=]\s*(\d+)/g);
  
  if (numberMatches && numberMatches.length > 0) {
    for (let i = 0; i < 3; i++) {
      const randomInput = Math.floor(Math.random() * 1000) + 1;
      testCases.push({
        input: randomInput.toString(),
        output: 'TO_BE_VERIFIED',
        type: 'random',
        isHidden: true,
        description: `Random test case ${i + 1}`
      });
    }
  }
  
  return testCases;
};

exports.generateTestCases = async (problemData) => {
  const allTestCases = [];
  
  const sampleCases = extractSampleTestCases(problemData);
  allTestCases.push(...sampleCases);
  
  try {
    const edgeCases = await generateWithGemini(problemData);
    allTestCases.push(...edgeCases);
  } catch (geminiError) {
    console.log('Gemini failed, trying Grok...');
    try {
      const edgeCases = await generateWithGrok(problemData);
      allTestCases.push(...edgeCases);
    } catch (grokError) {
      console.error('Both Gemini and Grok failed:', grokError.message);
    }
  }
  
  const randomCases = generateRandomTestCases(problemData);
  allTestCases.push(...randomCases);
  
  return allTestCases;
};
