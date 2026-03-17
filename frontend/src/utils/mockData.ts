import { Contest, Problem, Submission } from '@/store/contestStore';

export const mockProblems: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    sampleInput: 'nums = [2,7,11,15], target = 9',
    sampleOutput: '[0,1]',
  },
  {
    id: '2',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    sampleInput: 's = "abcabcbb"',
    sampleOutput: '3',
  },
  {
    id: '3',
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    constraints: ['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4'],
    sampleInput: 'lists = [[1,4,5],[1,3,4],[2,6]]',
    sampleOutput: '[1,1,2,3,4,4,5,6]',
  },
  {
    id: '4',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\''],
    sampleInput: 's = "([])"',
    sampleOutput: 'true',
  },
];

export const mockContests: Contest[] = [
  {
    id: '1',
    title: 'DevFlow Weekly Challenge #12',
    description: 'Weekly competitive programming contest featuring algorithmic problems of varying difficulty. Test your skills against fellow developers!',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    duration: 120,
    problems: mockProblems.slice(0, 3),
    participantCount: 156,
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'Data Structures Sprint',
    description: 'Focus on data structure problems including trees, graphs, and advanced structures. Perfect for interview preparation.',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    duration: 90,
    problems: mockProblems,
    participantCount: 89,
    status: 'active',
  },
  {
    id: '3',
    title: 'Algorithm Masters Cup',
    description: 'Advanced algorithmic contest with challenging problems. Only for the brave!',
    startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    duration: 180,
    problems: mockProblems.slice(0, 2),
    participantCount: 203,
    status: 'ended',
  },
  {
    id: '4',
    title: 'Beginner Friendly Round',
    description: 'A gentle introduction to competitive programming. Great for first-timers!',
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration: 60,
    problems: mockProblems.slice(0, 2),
    participantCount: 45,
    status: 'upcoming',
  },
];

const baseMockSubmissions: Submission[] = [
  { id: '1', problemId: '1', problemTitle: 'Two Sum', verdict: 'AC', language: 'C++', runtime: '4ms', memory: '8.2MB', submittedAt: new Date(Date.now() - 3600000).toISOString(), code: '' },
  { id: '2', problemId: '2', problemTitle: 'Longest Substring', verdict: 'WA', language: 'Python', runtime: '—', memory: '—', submittedAt: new Date(Date.now() - 7200000).toISOString(), code: '' },
  { id: '3', problemId: '3', problemTitle: 'Merge K Sorted Lists', verdict: 'TLE', language: 'Java', runtime: '—', memory: '—', submittedAt: new Date(Date.now() - 10800000).toISOString(), code: '' },
  { id: '4', problemId: '1', problemTitle: 'Two Sum', verdict: 'AC', language: 'C++', runtime: '2ms', memory: '7.8MB', submittedAt: new Date(Date.now() - 14400000).toISOString(), code: '' },
  { id: '5', problemId: '4', problemTitle: 'Valid Parentheses', verdict: 'RE', language: 'JavaScript', runtime: '—', memory: '—', submittedAt: new Date(Date.now() - 18000000).toISOString(), code: '' },
  { id: '6', problemId: '2', problemTitle: 'Longest Substring', verdict: 'AC', language: 'Python', runtime: '56ms', memory: '14.1MB', submittedAt: new Date(Date.now() - 21600000).toISOString(), code: '' },
];

// Generate more submissions for pagination demo
const problems = ['Two Sum', 'Longest Substring', 'Merge K Sorted Lists', 'Valid Parentheses', 'Binary Search', 'Max Subarray', 'Climbing Stairs', 'Reverse Linked List'];
const verdicts: Array<Submission['verdict']> = ['AC', 'WA', 'TLE', 'RE', 'AC', 'AC', 'WA', 'AC'];
const langs = ['C++', 'Python', 'Java', 'JavaScript', 'C++', 'Python', 'Java', 'C++'];

export const mockSubmissions: Submission[] = [
  ...baseMockSubmissions,
  ...Array.from({ length: 30 }, (_, i) => ({
    id: String(7 + i),
    problemId: String((i % 4) + 1),
    problemTitle: problems[i % problems.length],
    verdict: verdicts[i % verdicts.length],
    language: langs[i % langs.length],
    runtime: verdicts[i % verdicts.length] === 'AC' ? `${2 + (i % 50)}ms` : '—',
    memory: verdicts[i % verdicts.length] === 'AC' ? `${7 + (i % 10)}.${i % 9}MB` : '—',
    submittedAt: new Date(Date.now() - (25200000 + i * 3600000)).toISOString(),
    code: '',
  })),
];

export const mockLeaderboard = [
  { rank: 1, username: 'algorithmist_pro', problemsSolved: 4, score: 400, penalty: 45 },
  { rank: 2, username: 'code_ninja', problemsSolved: 4, score: 400, penalty: 62 },
  { rank: 3, username: 'dev_master', problemsSolved: 3, score: 300, penalty: 38 },
  { rank: 4, username: 'binary_wizard', problemsSolved: 3, score: 300, penalty: 55 },
  { rank: 5, username: 'stack_overflow', problemsSolved: 2, score: 200, penalty: 20 },
  { rank: 6, username: 'recursion_queen', problemsSolved: 2, score: 200, penalty: 33 },
  { rank: 7, username: 'hash_hero', problemsSolved: 2, score: 200, penalty: 48 },
  { rank: 8, username: 'dp_champion', problemsSolved: 1, score: 100, penalty: 15 },
  { rank: 9, username: 'greedy_solver', problemsSolved: 1, score: 100, penalty: 22 },
  { rank: 10, username: 'newbie_coder', problemsSolved: 0, score: 0, penalty: 0 },
];

export const defaultCodeTemplates: Record<string, string> = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n    }\n}\n',
  python: '# Your code here\n',
  javascript: '// Your code here\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on("line", (line) => {\n    \n});\n',
};
