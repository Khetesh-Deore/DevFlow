import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock,
  Play, Send, Trophy, CheckCircle2,
  XCircle, AlertTriangle, RotateCcw, Maximize2, Minimize2,
  FileText, List, Lock
} from 'lucide-react';
import { getProblem } from '../api/problemApi';
import { getContest, submitInContest, getContestLeaderboard } from '../api/contestApi';
import { runCode, getSubmission } from '../api/submissionApi';
import CodeEditor from '../components/Editor/CodeEditor';
import SubmissionPanel from '../components/Editor/SubmissionPanel';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import useAuthStore from '../store/authStore';
import useEditorSession from '../hooks/useEditorSession';
import toast from 'react-hot-toast';
import { VDivider, HDivider } from '../components/Layout/ResizableSplit';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'cpp', label: 'C++ 17' },
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

// ─── Mini Leaderboard Panel ───────────────────────────────────────────────────
function MiniLeaderboard({ slug, currentUserId }) {
  const { data } = useQuery({
    queryKey: ['contest-leaderboard', slug],
    queryFn: () => getContestLeaderboard(slug),
    refetchInterval: 30000
  });
  const rows = (data?.data || []).slice(0, 10);
  return (
    <div className="flex flex-col gap-0 text-xs">
      {rows.length === 0 && <p className="text-gray-500 text-center py-4">No submissions yet</p>}
      {rows.map(row => {
        const isMe = currentUserId && row.userId?.toString() === currentUserId?.toString();
        return (
          <div key={row.userId}
            className={`flex items-center justify-between px-3 py-2 border-b border-gray-800/50 ${isMe ? 'bg-blue-500/10' : 'hover:bg-gray-800/30'}`}>
            <div className="flex items-center gap-2">
              <span className={`font-bold w-5 ${row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-gray-300' : row.rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                {row.rank}
              </span>
              <span className={`truncate max-w-[100px] ${isMe ? 'text-blue-300 font-medium' : 'text-gray-300'}`}>
                {row.user?.name || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{row.solvedCount}✓</span>
              <span className="text-yellow-400 font-bold">{row.totalPoints}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Problem Nav (contest problem list) ──────────────────────────────────────
function ProblemNav({ contest, currentSlug, mySubmissions = [] }) {
  const navigate = useNavigate();
  if (!contest?.problems?.length) return null;
  return (
    <div className="flex flex-col gap-1 p-2">
      {contest.problems.map(p => {
        const pid = p.problemId?._id?.toString();
        const mySubs = mySubmissions.filter(s =>
          s.problemId?.toString() === pid || s.problemId?._id?.toString() === pid
        );
        const accepted = mySubs.find(s => s.status === 'accepted');
        const attempted = mySubs.length > 0;
        const isCurrent = p.problemId?.slug === currentSlug;

        return (
          <button key={p._id}
            onClick={() => navigate(`/contests/${contest.slug}/problems/${p.problemId?.slug}`)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              isCurrent ? 'bg-blue-600 text-white'
              : accepted ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
              : attempted ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="font-mono font-bold">{p.label || p.order}</span>
            <span className="truncate mx-2 flex-1 text-left">{p.problemId?.title}</span>
            <span className="shrink-0">
              {accepted ? <CheckCircle2 size={12} /> : attempted ? <XCircle size={12} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContestProblemPage() {
  const { contestSlug, problemSlug } = useParams();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const containerRef = useRef(null);
  const rightRef = useRef(null);
  const [leftPct, setLeftPct] = useState(42);
  const [editorPct, setEditorPct] = useState(65);

  const handleVDrag = useCallback((pct) => setLeftPct(pct), []);
  const handleHDrag = useCallback((pct) => setEditorPct(pct), []);

  const [customInput, setCustomInput] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeResult, setActiveResult] = useState('testcase');
  const [leftTab, setLeftTab] = useState('problem');
  const [rightPanel, setRightPanel] = useState('editor');
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const pollRef = useRef(null);

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestSlug],
    queryFn: () => getContest(contestSlug),
    refetchInterval: 60000
  });

  const { data: problemData, isLoading, isError } = useQuery({
    queryKey: ['problem', problemSlug],
    queryFn: () => getProblem(problemSlug)
  });

  const problem = problemData?.data;

  // Persistent editor session — survives refresh, keyed by problemId
  const { language, setLanguage, code, setCode, reset: resetCode } = useEditorSession(problem?._id);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // Cache contest endTime in localStorage for instant timer on load
  useEffect(() => {
    if (contestData?.data?.endTime) {
      localStorage.setItem(`contest_end_${contestSlug}`, contestData.data.endTime);
    }
  }, [contestData, contestSlug]);

  // Pre-fill custom input
  useEffect(() => {
    if (problem?.sampleTestCases?.[0]?.input) setCustomInput(problem.sampleTestCases[0].input);
    else if (problem?.examples?.[0]?.input) setCustomInput(problem.examples[0].input);
  }, [problem?._id]);

  const contest = contestData?.data;
  const isEnded = contest?.status === 'ended';
  const contestEndTime = contest?.endTime || localStorage.getItem(`contest_end_${contestSlug}`);
  const timer = useCountdown(contestEndTime);
  const isRedTimer = timer.total < 600000 && !isEnded;
  const isWarning = timer.total < 1800000 && !isEnded;

  // Prevent copy-paste during live contests
  useEffect(() => {
    if (isEnded) return;

    const preventCopyPaste = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        toast.error('Copy/Paste is disabled during contests', { duration: 2000 });
      }
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
    };

    const preventCopy = (e) => e.preventDefault();
    const preventPaste = (e) => e.preventDefault();
    const preventCut = (e) => e.preventDefault();

    document.addEventListener('keydown', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCut);

    return () => {
      document.removeEventListener('keydown', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCut);
    };
  }, [isEnded]);

  const contestProblem = contest?.problems?.find(
    p => p.problemId?.slug === problemSlug || p.problemId?._id?.toString() === problem?._id?.toString()
  );

  const handleLanguageChange = (lang) => setLanguage(lang);

  const handleReset = () => {
    if (window.confirm('Reset code to template?')) resetCode();
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
      toast.error(err.response?.data?.error || err.message);
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
    let pollCount = 0;

    try {
      const res = await submitInContest(contestSlug, { code, language, problemId: problem._id });
      const submissionId = res.submissionId;

      pollRef.current = setInterval(async () => {
        pollCount++;
        try {
          const poll = await getSubmission(submissionId);
          const sub = poll.data;
          setSubmissionResult(sub);
          if (sub.status !== 'pending' && sub.status !== 'running') {
            clearInterval(pollRef.current);
            setIsSubmitting(false);
            setSubmissionHistory(h => [sub, ...h]);
            qc.invalidateQueries(['contest-leaderboard', contestSlug]);
            if (sub.status === 'accepted') {
              toast.success(`Accepted! +${contestProblem?.points || 0} pts`, { icon: '🎉' });
            }
          }
        } catch {
          clearInterval(pollRef.current);
          setIsSubmitting(false);
        }
        if (pollCount >= 30) { clearInterval(pollRef.current); setIsSubmitting(false); }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex bg-gray-950 animate-pulse">
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
  const pointsEarned = submissionResult?.status === 'accepted' ? contestProblem?.points : null;
  const solvedTimeSec = submissionResult?.status === 'accepted' && contest?.startTime
    ? Math.floor((new Date(submissionResult.submittedAt) - new Date(contest.startTime)) / 1000)
    : null;

  const progressPct = contest?.startTime && contest?.endTime
    ? Math.min(100, ((Date.now() - new Date(contest.startTime)) / (new Date(contest.endTime) - new Date(contest.startTime))) * 100)
    : 0;

  return (
    <div className="flex flex-col bg-gray-950 text-white overflow-hidden" style={{ height: '100vh' }}>

      {/* ── Contest Header ── */}
      <div className={`shrink-0 border-b px-4 py-2 transition-colors ${
        isRedTimer ? 'bg-red-950/80 border-red-800' : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/contests/${contestSlug}`}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white shrink-0">
              <ArrowLeft size={13} /> Back
            </Link>
            <span className="text-gray-700">|</span>
            <span className="text-sm font-medium text-white truncate">{contest?.title}</span>
            {contestProblem && (
              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full shrink-0">
                {contestProblem.label || contestProblem.order} · {contestProblem.points}pts
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Progress bar */}
            {!isEnded && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isRedTimer ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-blue-500'}`}
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {/* Timer */}
            {!isEnded ? (
              <div className="flex items-center gap-1.5">
                <Clock size={13} className={isRedTimer ? 'text-red-400' : 'text-gray-400'} />
                <span className={`font-mono text-base font-bold tabular-nums ${
                  isRedTimer ? 'text-red-400 animate-pulse' : isWarning ? 'text-orange-400' : 'text-white'
                }`}>
                  {pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Ended</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        {!editorFullscreen && (
          <div className="flex flex-col border-r border-gray-800 overflow-hidden shrink-0" style={{ width: `${leftPct}%` }}>

            {/* Left Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-900 shrink-0">
              {[
                ['problem', 'Problem', <FileText size={12} />],
                ['submissions', `Submissions${submissionHistory.length ? ` (${submissionHistory.length})` : ''}`, <List size={12} />],
                ['leaderboard', 'Standings', <Trophy size={12} />]
              ].map(([val, label, icon]) => (
                <button key={val} onClick={() => setLeftTab(val)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs transition-colors ${
                    leftTab === val ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Problem Tab */}
              {leftTab === 'problem' && (
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h1 className="text-lg font-bold">{problem.title}</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.tags?.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mb-5">
                    <span>⏱ {problem.timeLimit}ms</span>
                    <span>💾 {problem.memoryLimit}MB</span>
                    {contestProblem && <span className="text-yellow-400">🏆 {contestProblem.points} pts</span>}
                  </div>

                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">{problem.description}</div>

                  {problem.inputFormat && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Input Format</h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.inputFormat}</p>
                    </div>
                  )}
                  {problem.outputFormat && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Output Format</h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.outputFormat}</p>
                    </div>
                  )}
                  {problem.constraints && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Constraints</h3>
                      <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{problem.constraints}</p>
                    </div>
                  )}

                  {sampleTestCases.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Examples</h3>
                      <div className="flex flex-col gap-3">
                        {sampleTestCases.map((tc, i) => (
                          <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
                            <div className="bg-gray-800/50 px-3 py-1.5 text-xs text-gray-500 font-medium">Example {i + 1}</div>
                            <div className="p-3 grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Input</p>
                                <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.input}</pre>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Output</p>
                                <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                              </div>
                            </div>
                            {tc.explanation && <p className="text-xs text-gray-400 px-3 pb-3">{tc.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {problem.hints?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hints</h3>
                      {problem.hints.map((hint, i) => (
                        <details key={i} className="mb-2 border border-gray-700 rounded-lg overflow-hidden">
                          <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:text-white hover:bg-gray-800">
                            Hint {i + 1}
                          </summary>
                          <p className="px-3 py-2 text-xs text-gray-300 bg-gray-800/50">{hint}</p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submissions Tab */}
              {leftTab === 'submissions' && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-3">My Submissions</h3>
                  {submissionHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No submissions yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {submissionHistory.map((s, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                          s.status === 'accepted' ? 'bg-green-400/5 border-green-400/20' : 'bg-red-400/5 border-red-400/20'
                        }`}>
                          <div className="flex items-center gap-2">
                            {s.status === 'accepted'
                              ? <CheckCircle2 size={13} className="text-green-400" />
                              : <XCircle size={13} className="text-red-400" />}
                            <span className={`font-medium capitalize ${s.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                              {s.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-500">
                            <span>{s.passedTestCases}/{s.totalTestCases} tests</span>
                            <span className="capitalize">{s.language}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard Tab */}
              {leftTab === 'leaderboard' && (
                <div>
                  <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Live standings</span>
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                    </span>
                  </div>
                  <MiniLeaderboard slug={contestSlug} currentUserId={user?.id} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertical drag handle */}
        {!editorFullscreen && (
          <div className="hidden md:block">
            <VDivider onDrag={handleVDrag} containerRef={containerRef} />
          </div>
        )}

        {/* RIGHT PANEL */}
        <div ref={rightRef} className="flex flex-col overflow-hidden" style={{ width: `${100 - leftPct}%` }}>

          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setRightPanel(p => p === 'problems' ? 'editor' : 'problems')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                  rightPanel === 'problems' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <List size={12} /> Problems
              </button>
              <select value={language} onChange={e => handleLanguageChange(e.target.value)}
                className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none">
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              {language === 'java' && (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                  class must be <code>Main</code>
                </span>
              )}
              {!isEnded && (
                <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock size={10} /> Copy/Paste disabled
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleReset} title="Reset to template"
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setEditorFullscreen(f => !f)} title="Toggle fullscreen"
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors">
                {editorFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Problem switcher panel */}
          {rightPanel === 'problems' && (
            <div className="bg-gray-900 border-b border-gray-800 shrink-0 max-h-48 overflow-y-auto">
              <ProblemNav contest={contest} currentSlug={problemSlug} mySubmissions={submissionHistory} />
            </div>
          )}

          {/* Editor */}
          <div style={{ height: `${editorPct}%` }} className="overflow-hidden shrink-0 min-h-0">
            <CodeEditor 
              value={code} 
              onChange={setCode} 
              language={language} 
              height="100%" 
              disableCopyPaste={!isEnded}
            />
          </div>

          {/* Horizontal drag handle */}
          <HDivider onDrag={handleHDrag} containerRef={rightRef} />

          {/* Bottom panel */}
          <div className="flex flex-col overflow-hidden bg-gray-900" style={{ height: `${100 - editorPct}%` }}>
            {/* Bottom tabs + Run/Submit */}
            <div className="flex items-center border-b border-gray-800 shrink-0 px-2 bg-gray-950">
              {[['testcase', 'Testcase'], ['result', 'Test Result']].map(([val, label]) => (
                <button key={val} onClick={() => setActiveResult(val)}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${activeResult === val ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
              <div className="ml-auto flex gap-2 pr-1 py-1">
                <button onClick={handleRun} disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                  <Play size={11} /> {isRunning ? 'Running...' : 'Run'}
                </button>
                {isEnded ? (
                  <button disabled className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 text-gray-500 text-xs rounded-lg cursor-not-allowed">
                    <AlertTriangle size={11} /> Ended
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isRunning || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                    <Send size={11} /> {isSubmitting ? 'Judging...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {activeResult === 'testcase' && (
                <div>
                  {/* Test case tabs */}
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {sampleTestCases.map((tc, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTestCase(i)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                          selectedTestCase === i
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-800 hover:bg-gray-750 text-gray-400'
                        }`}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                    <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg font-medium transition-colors shrink-0">
                      +
                    </button>
                  </div>

                  {/* Show selected test case input */}
                  {sampleTestCases[selectedTestCase] && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">nums =</p>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <pre className="text-sm font-mono text-white whitespace-pre-wrap">
                          {sampleTestCases[selectedTestCase].input}
                        </pre>
                      </div>
                    </div>
                  )}

                  {sampleTestCases.length === 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Custom Input (stdin)</p>
                      <textarea rows={4} value={customInput} onChange={e => setCustomInput(e.target.value)}
                        className="w-full bg-gray-800 text-white text-xs font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none resize-none" />
                    </div>
                  )}
                </div>
              )}
              {activeResult === 'run' && runResult && !isRunning && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Output · {runResult.timeTakenMs}ms</p>
                  {runResult.compileError
                    ? <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{runResult.compileError}</pre>
                    : <>
                        {runResult.stdout && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Output:</p>
                            <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{runResult.stdout}</pre>
                          </div>
                        )}
                        {sampleTestCases[selectedTestCase]?.expectedOutput && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Expected:</p>
                            <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-gray-200 whitespace-pre-wrap">{sampleTestCases[selectedTestCase].expectedOutput}</pre>
                          </div>
                        )}
                        {runResult.stderr && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Stderr:</p>
                            <pre className="bg-gray-800 rounded p-2 text-xs font-mono text-red-400 whitespace-pre-wrap">{runResult.stderr}</pre>
                          </div>
                        )}
                        {!runResult.stdout && !runResult.stderr && <p className="text-xs text-gray-500">(no output)</p>}
                      </>
                  }
                </div>
              )}
              {activeResult === 'submit' && (
                <div>
                  <SubmissionPanel submission={submissionResult} isLoading={isSubmitting} />
                  {submissionResult?.status === 'accepted' && pointsEarned && (
                    <div className="px-4 py-3 bg-green-400/5 border border-green-400/20 rounded-lg mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-sm font-bold text-green-400">+{pointsEarned} points!</span>
                      </div>
                      {solvedTimeSec !== null && (
                        <span className="text-xs text-gray-500">at {pad(Math.floor(solvedTimeSec/60))}:{pad(solvedTimeSec%60)}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!runResult && !submissionResult && !isRunning && !isSubmitting && activeResult !== 'testcase' && (
                <p className="text-sm text-gray-500 text-center py-8">Run your code first</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
