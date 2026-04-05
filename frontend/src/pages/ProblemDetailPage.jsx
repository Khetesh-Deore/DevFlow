import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Clock, ArrowLeft, Play, Send, ChevronUp, Terminal } from 'lucide-react';
import { getProblem } from '../api/problemApi';
import { submitCode, runCode, getSubmission, getMySubmissions } from '../api/submissionApi';
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

const VERDICT_COLORS = {
  accepted: 'text-green-400',
  wrong_answer: 'text-red-400',
  time_limit_exceeded: 'text-orange-400',
  runtime_error: 'text-red-400',
  compilation_error: 'text-red-400',
  pending: 'text-gray-400',
  running: 'text-blue-400'
};

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

function SubmissionHistory({ problemId }) {
  const { data } = useQuery({
    queryKey: ['my-submissions', problemId],
    queryFn: () => getMySubmissions(problemId),
    enabled: !!problemId
  });

  const submissions = data?.data || [];
  if (!submissions.length) return <p className="text-sm text-gray-500 py-4 text-center">No submissions yet</p>;

  return (
    <div className="flex flex-col gap-2">
      {submissions.map(s => (
        <div key={s._id} className="flex items-center justify-between py-2 border-b border-gray-800 text-sm">
          <span className={`font-medium ${VERDICT_COLORS[s.status] || 'text-gray-400'}`}>
            {s.status?.replace(/_/g, ' ')}
          </span>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span>{s.language}</span>
            <span>{s.passedTestCases}/{s.totalTestCases}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('description');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_TEMPLATES.python);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeResult, setActiveResult] = useState(null); // 'run' | 'submit'
  const pollRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => getProblem(slug)
  });

  const problem = data?.data;

  // Language change → reset to template
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_TEMPLATES[lang] || '');
  };

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

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
    setIsSubmitting(true);
    setActiveResult('submit');
    setSubmissionResult(null);
    try {
      const res = await submitCode({ code, language, problemId: problem._id });
      const submissionId = res.submissionId;

      // Poll for result
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
      toast.error(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-56px)] flex bg-gray-950">
        <div className="w-1/2 border-r border-gray-800 p-6 flex flex-col gap-4 animate-pulse">
          <div className="h-7 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded" />)}
        </div>
        <div className="w-1/2 bg-gray-900" />
      </div>
    );
  }

  if (isError || !problem) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-400">Problem not found</p>
        <Link to="/problems" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Problems
        </Link>
      </div>
    );
  }

  const { sampleTestCases = [] } = problem;

  return (
    <div className="h-[calc(100vh-56px)] flex bg-gray-950 text-white overflow-hidden">

      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] flex flex-col border-r border-gray-800 overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900 shrink-0">
          {[['description', 'Description'], ['submissions', 'Submissions']].map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={`px-4 py-2.5 text-sm transition-colors ${activeTab === val ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'description' ? (
            <>
              {/* Header */}
              <div className="mb-5">
                <Link to="/problems" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-3">
                  <ArrowLeft size={12} /> Problems
                </Link>
                <h1 className="text-xl font-bold mb-3">{problem.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {problem.timeLimit}ms</span>
                  <span>{problem.memoryLimit}MB</span>
                  <span>{problem.acceptanceRate?.toFixed(1)}% acceptance</span>
                </div>
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
                        <p className="text-xs text-gray-500 mb-2 font-medium">Example {i + 1}</p>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Input:</p>
                          <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Output:</p>
                          <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        </div>
                        {tc.explanation && <p className="text-xs text-gray-400 mt-1">{tc.explanation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <HintsSection hints={problem.hints} />
            </>
          ) : (
            <SubmissionHistory problemId={problem._id} />
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">

        {/* Language selector */}
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
            <p className="text-xs text-gray-400 mb-1">Custom Input (stdin)</p>
            <textarea rows={3} value={customInput} onChange={e => setCustomInput(e.target.value)}
              placeholder="Enter custom input..."
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
            <button onClick={handleSubmit} disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
              <Send size={13} /> {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Results */}
        {activeResult === 'run' && runResult && !isRunning && (
          <div className="border-t border-gray-800 bg-gray-900 p-4 max-h-48 overflow-y-auto shrink-0">
            <p className="text-xs text-gray-400 mb-2">Run Result · {runResult.timeTakenMs}ms</p>
            {runResult.compileError ? (
              <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{runResult.compileError}</pre>
            ) : (
              <>
                {runResult.stdout && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Output:</p>
                    <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{runResult.stdout}</pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Stderr:</p>
                    <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-red-400 whitespace-pre-wrap">{runResult.stderr}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeResult === 'submit' && (
          <SubmissionPanel submission={submissionResult} isLoading={isSubmitting} />
        )}
      </div>
    </div>
  );
}
