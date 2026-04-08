import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Clock, ArrowLeft, Play, Send, ChevronUp, Terminal, FileText, Code2 } from 'lucide-react';
import { getProblem } from '../api/problemApi';
import { submitCode, runCode, getSubmission, getMySubmissions } from '../api/submissionApi';
import CodeEditor, { DEFAULT_TEMPLATES } from '../components/Editor/CodeEditor';
import SubmissionPanel from '../components/Editor/SubmissionPanel';
import useEditorSession from '../hooks/useEditorSession';
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
  accepted: 'text-green-400', wrong_answer: 'text-red-400',
  time_limit_exceeded: 'text-orange-400', runtime_error: 'text-red-400',
  compilation_error: 'text-red-400', pending: 'text-gray-400', running: 'text-blue-400'
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
          <span className={`font-medium ${VERDICT_COLORS[s.status] || 'text-gray-400'}`}>{s.status?.replace(/_/g, ' ')}</span>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span>{s.language}</span>
            <span>{s.passedTestCases}/{s.totalTestCases}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Resizable divider
function ResizableSplit({ leftPct, onDrag }) {
  const dragging = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const parent = document.getElementById('problem-split-container');
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const pct = Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
      onDrag(pct);
    };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onDrag]);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => { dragging.current = true; document.body.style.cursor = 'col-resize'; }}
      className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500 cursor-col-resize transition-colors"
    />
  );
}

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('description');
  const [mobilePanel, setMobilePanel] = useState('problem');
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const [leftPct, setLeftPct] = useState(45);
  const pollRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => getProblem(slug)
  });

  const problem = data?.data;
  const { language, setLanguage, code, setCode } = useEditorSession(problem?._id);

  useEffect(() => () => clearInterval(pollRef.current), []);

  useEffect(() => {
    if (!problem) return;
    const input = problem.sampleTestCases?.[0]?.input || problem.examples?.[0]?.input || '';
    if (input) setCustomInput(input);
  }, [problem?._id]);

  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first');
    const input = customInput || problem?.sampleTestCases?.[0]?.input || '';
    setIsRunning(true); setActiveResult('run'); setRunResult(null);
    let lastErr;
    for (let i = 1; i <= 3; i++) {
      try {
        const res = await runCode({ code, language, input });
        setRunResult(res.data); setIsRunning(false); return;
      } catch (err) {
        lastErr = err;
        if (err.response?.status === 503 && i < 3) {
          toast(`Judge warming up... retry ${i}/3`, { icon: '⏳' });
          await new Promise(r => setTimeout(r, 8000));
        } else break;
      }
    }
    toast.error(lastErr?.response?.data?.error || 'Judge unavailable.');
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error('Write some code first');
    setIsSubmitting(true); setActiveResult('submit'); setSubmissionResult(null);
    try {
      const res = await submitCode({ code, language, problemId: problem._id });
      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        try {
          const poll = await getSubmission(res.submissionId);
          setSubmissionResult(poll.data);
          if (poll.data.status !== 'pending' && poll.data.status !== 'running') {
            clearInterval(pollRef.current); setIsSubmitting(false);
          }
        } catch { clearInterval(pollRef.current); setIsSubmitting(false); }
        if (pollCount >= 30) { clearInterval(pollRef.current); setIsSubmitting(false); }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="h-[calc(100vh-56px)] flex bg-gray-950 animate-pulse">
      <div className="w-1/2 border-r border-gray-800 p-6 flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded" />)}
      </div>
      <div className="w-1/2 bg-gray-900" />
    </div>
  );

  if (isError || !problem) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <p className="text-xl text-gray-400">Problem not found</p>
      <Link to="/problems" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
        <ArrowLeft size={14} /> Back to Problems
      </Link>
    </div>
  );

  const { sampleTestCases = [] } = problem;

  return (
    <div className="flex flex-col bg-gray-950 text-white" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Mobile tabs */}
      <div className="flex md:hidden border-b border-gray-800 bg-gray-900 shrink-0">
        {[['problem', 'Problem', <FileText size={14} />], ['code', 'Code', <Code2 size={14} />]].map(([val, label, icon]) => (
          <button key={val} onClick={() => setMobilePanel(val)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition-colors ${mobilePanel === val ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div id="problem-split-container" className="flex flex-1 overflow-hidden">

        {/* LEFT — Problem Statement */}
        <div
          className={`${mobilePanel === 'problem' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden border-r border-gray-800`}
          style={{ width: `${leftPct}%` }}
        >
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
                <div className="flex gap-4 text-xs text-gray-500 mb-5">
                  <span className="flex items-center gap-1"><Clock size={12} /> {problem.timeLimit}ms</span>
                  <span>{problem.memoryLimit}MB</span>
                  <span>{problem.acceptanceRate?.toFixed(1)}% acceptance</span>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">{problem.description}</div>
                {problem.inputFormat && <div className="mb-4"><h3 className="text-sm font-semibold text-gray-300 mb-1">Input Format</h3><p className="text-sm text-gray-400 whitespace-pre-wrap">{problem.inputFormat}</p></div>}
                {problem.outputFormat && <div className="mb-4"><h3 className="text-sm font-semibold text-gray-300 mb-1">Output Format</h3><p className="text-sm text-gray-400 whitespace-pre-wrap">{problem.outputFormat}</p></div>}
                {problem.constraints && <div className="mb-4"><h3 className="text-sm font-semibold text-gray-300 mb-1">Constraints</h3><p className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{problem.constraints}</p></div>}
                {sampleTestCases.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Examples</h3>
                    {sampleTestCases.map((tc, i) => (
                      <div key={i} className="border border-gray-700 rounded-lg p-4 mb-3">
                        <p className="text-xs text-gray-500 mb-2">Example {i + 1}</p>
                        <p className="text-xs text-gray-500 mb-1">Input:</p>
                        <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap mb-2">{tc.input}</pre>
                        <p className="text-xs text-gray-500 mb-1">Output:</p>
                        <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        {tc.explanation && <p className="text-xs text-gray-400 mt-2">{tc.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <HintsSection hints={problem.hints} />
              </>
            ) : (
              <SubmissionHistory problemId={problem._id} />
            )}
          </div>
        </div>

        {/* Drag handle — desktop only */}
        <div className="hidden md:block">
          <ResizableSplit leftPct={leftPct} onDrag={setLeftPct} />
        </div>

        {/* RIGHT — Code Editor */}
        <div
          className={`${mobilePanel === 'code' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden flex-1`}
        >
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            {language === 'java' && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                class must be named <code className="font-mono">Main</code>
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={setCode} language={language} height="100%" />
          </div>
          {showCustomInput && (
            <div className="border-t border-gray-800 bg-gray-900 p-3 shrink-0">
              <p className="text-xs text-gray-400 mb-1">Custom Input (stdin)</p>
              <textarea rows={3} value={customInput} onChange={e => setCustomInput(e.target.value)}
                placeholder="Enter custom input..."
                className="w-full bg-gray-800 text-white text-sm font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none resize-none" />
            </div>
          )}
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
          {activeResult === 'run' && runResult && !isRunning && (
            <div className="border-t border-gray-800 bg-gray-900 p-4 max-h-48 overflow-y-auto shrink-0">
              <p className="text-xs text-gray-400 mb-2">Run Result · {runResult.timeTakenMs}ms</p>
              {runResult.compileError
                ? <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{runResult.compileError}</pre>
                : <>
                    {runResult.stdout && <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Output:</p><pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{runResult.stdout}</pre></div>}
                    {runResult.stderr && <div><p className="text-xs text-gray-500 mb-1">Stderr:</p><pre className="bg-gray-800 rounded p-2 text-xs font-mono text-red-400 whitespace-pre-wrap">{runResult.stderr}</pre></div>}
                  </>
              }
            </div>
          )}
          {activeResult === 'submit' && (
            <SubmissionPanel submission={submissionResult} isLoading={isSubmitting} />
          )}
        </div>
      </div>
    </div>
  );
}
