import { create } from 'zustand';

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  duration: number; // minutes
  problems: Problem[];
  participantCount: number;
  status: 'upcoming' | 'active' | 'ended';
}

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  verdict: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'Pending';
  language: string;
  runtime: string;
  memory: string;
  submittedAt: string;
  code: string;
}

interface ContestState {
  contests: Contest[];
  currentContest: Contest | null;
  currentProblem: Problem | null;
  submissions: Submission[];
  selectedLanguage: string;
  code: string;
  output: string;
  isRunning: boolean;
  setContests: (contests: Contest[]) => void;
  setCurrentContest: (contest: Contest | null) => void;
  setCurrentProblem: (problem: Problem | null) => void;
  addSubmission: (submission: Submission) => void;
  setSelectedLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setIsRunning: (running: boolean) => void;
}

export const useContestStore = create<ContestState>((set) => ({
  contests: [],
  currentContest: null,
  currentProblem: null,
  submissions: [],
  selectedLanguage: 'cpp',
  code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  output: '',
  isRunning: false,
  setContests: (contests) => set({ contests }),
  setCurrentContest: (currentContest) => set({ currentContest }),
  setCurrentProblem: (currentProblem) => set({ currentProblem }),
  addSubmission: (submission) => set((state) => ({ submissions: [submission, ...state.submissions] })),
  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),
  setCode: (code) => set({ code }),
  setOutput: (output) => set({ output }),
  setIsRunning: (isRunning) => set({ isRunning }),
}));
