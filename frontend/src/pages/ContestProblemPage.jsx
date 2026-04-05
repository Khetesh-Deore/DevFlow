import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, ChevronRight, Terminal, Play, Send } from 'lucide-react';
import { getProblem } from '../api/problemApi';
import { getContest, submitInContest } from '../api/contestApi';
import { runCode, getSubmission } from '../api/submissionApi';
import CodeEditor, { DEFAULT_TEMPLATES } from '../components/Editor/CodeEditor';
import SubmissionPanel from '../components/Editor/SubmissionPanel';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' }
];

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(target) {
  const [diff, setDiff] = useState(Math.max(0, new Date(target) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, new Date(target) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, total: diff };
}

function HintsSection({ hints }) {
  const [revealed, setRevealed] = useState([]);
  if (!hints?.length) return null;
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Hints</h3>
      <div className="flex flex-col gap-2">
        {hints.map((hint, i) => (
          <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setRevealed(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <span>Hint {i + 1}</span>
              {revealed.includes(i) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {revealed.includes(i) && (
              <div className="px-4 py-3 text-sm text-gray-300 bg-gray-800/50 border-t border-gray-700">{hint}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContestProblemPage() {
  const { contestSlug, problemSlug } = useParams();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_TEMPLATES.python);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const pollRef = useRef(null);

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestSlug],
    queryFn: () => getContest(contestSlug)
  });

  const { data: problemData, isLoading, isError } = useQuery({
    queryKey: ['problem', problemSlug],
    queryFn: () => getProblem(problemSlug)
  });

  useEffect(() => () => clearInterval(pollRef.current), []);

  const contest = contestData?.data;
  const problem = problemData?.data;
  const contestStatus = contest?.status;
  const isEnded = contestStatus === 'ended';

  const timer = useCountdown(contest?.endTime);
  const isRedTimer = timer.total < 600000 && !isEnded;

  // Find this problem in contest to get points
  const contestProblem = contest?.problems?.find(
    p => p.problemId?.slug === problemSlug || p.problemId?._id === problem?._id
  );

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_TEMPLATES[lang] || '');
  };

  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first');
    setIsRunning(true);
    setActiveResult('run');
    setRunResult(null);
    try {
      const input = customInput || problem?.sampleTestCases?.[0]?.input || '';
      const res = await runCode({ code, language, input });
      setRunResult(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error('Write some code first');
    if (isEnded) return toast.error('Contest has ended');
    if (!problem?._id) return;

    setIsSubmitting(true);
    setActiveResult('submit');
    setSubmissionResult(null);

    try {
      const res = await submitInContest(contestSlug, {
        code, language, problemId: problem._id
      });
      const submissionId = res.submissionId;

      pollRef.current = setInterval(async () => {
        try {
          const poll = await getSubmission(submissionId);
          const sub = poll.data;
          setSubmissionResult(sub);
          if (sub.status !== 'pending' && sub.status !== 'running') {
            clearInterval(pollRef.current);
            setIsSubmitting(false);
          }
        } catch {
          clearInterval(pollRef.current);
          setIsSubmitting(false);
        }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="h-[calc(100vh-56px)] flex bg-gray-950 animate-pulse">
      <div className="w-1/2 border-r border-gray-800 p-6 flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded" />)}
      </div>
      <div className="w-1/2 bg-gray-900" />
    </div>
  );

  if (isError || !problem) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Problem not found</p>
    </div>
  );

  const { sampleTestCases = [] } = problem;

  // Points earned if accepted
  const pointsEarned = submissionResult?.status === 'accepted' ? contestProblem?.points : null;
  const solvedTimeSec = submissionResult?.status === 'accepted' && contest?.startTime
    ? Math.floor((new Date(submissionResult.submittedAt) - new Date(contest.startTime)) / 1000)
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">

      {/* Contest Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/contests/${contestSlug}`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> {contest?.title || 'Back to Contest'}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {contestProblem && (
            <span className="text-xs text-yellow-400">{contestProblem.points} pts</span>
          )}
          {!isEnded && contest?.endTime && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className={isRedTimer ? 'text-red-400' : 'text-gray-400'} />
              <span className={`font-mono text-sm font-bold ${isRedTimer ? 'text-red-400' : 'text-white'}`}>
                {pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}
              </span>
            </div>
          )}
          {isEnded && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Contest Ended</span>}
        </div>
      </div>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT */}
        <div className="w-full md:w-[45%] flex flex-col border-r border-gray-800 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            <h1 className="text-xl font-bold mb-3">{problem.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.tags?.map(tag => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-5">
              <span>{problem.timeLimit}ms</span>
              <span>{problem.memoryLimit}MB</span>
            </div>

            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">{problem.description}</div>

            {problem.inputFormat && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Input Format</h3>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{problem.inputFormat}</p>
              </div>
            )}
            {problem.outputFormat && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Output Format</h3>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{problem.outputFormat}</p>
              </div>
            )}
            {problem.constraints && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Constraints</h3>
                <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{problem.constraints}</p>
              </div>
            )}

            {sampleTestCases.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Examples</h3>
                <div className="flex flex-col gap-3">
                  {sampleTestCases.map((tc, i) => (
                    <div key={i} className="border border-gray-700 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-2">Example {i + 1}</p>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Input:</p>
                        <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Output:</p>
                        <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                      </div>
                      {tc.explanation && <p className="text-xs text-gray-400 mt-2">{tc.explanation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <HintsSection hints={problem.hints} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">

          {/* Language */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
            <select value={language} onChange={e => handleLanguageChange(e.target.value)}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={setCode} language={language} height="100%" />
          </div>

          {/* Custom Input */}
          {showCustomInput && (
            <div className="border-t border-gray-800 bg-gray-900 p-3 shrink-0">
              <p className="text-xs text-gray-400 mb-1">Custom Input</p>
              <textarea rows={3} value={customInput} onChange={e => setCustomInput(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none resize-none" />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-t border-gray-800 shrink-0">
            <button onClick={() => setShowCustomInput(s => !s)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <Terminal size={13} />
              {showCustomInput ? 'Hide' : 'Custom'} Input
              {showCustomInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <div className="flex gap-2">
              <button onClick={handleRun} disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                <Play size={13} /> {isRunning ? 'Running...' : 'Run'}
              </button>
              {isEnded ? (
                <button disabled
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 text-gray-500 text-sm rounded-lg cursor-not-allowed">
                  Contest Ended
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                  <Send size={13} /> {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>

          {/* Run Result */}
          {activeResult === 'run' && runResult && !isRunning && (
            <div className="border-t border-gray-800 bg-gray-900 p-4 max-h-40 overflow-y-auto shrink-0">
              <p className="text-xs text-gray-400 mb-2">Run Result · {runResult.timeTakenMs}ms</p>
              {runResult.compileError
                ? <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{runResult.compileError}</pre>
                : <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{runResult.stdout || '(no output)'}</pre>
              }
            </div>
          )}

          {/* Submission Result */}
          {activeResult === 'submit' && (
            <div className="shrink-0">
              <SubmissionPanel submission={submissionResult} isLoading={isSubmitting} />
              {submissionResult?.status === 'accepted' && pointsEarned && (
                <div className="px-5 pb-4 bg-gray-900 border-t border-gray-800">
                  <p className="text-green-400 text-sm font-medium">+{pointsEarned} points earned</p>
                  {solvedTimeSec !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Solved at {pad(Math.floor(solvedTimeSec / 60))}:{pad(solvedTimeSec % 60)} from contest start
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
