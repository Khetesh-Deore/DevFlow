import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  CheckCircle2, Clock, Users, Trophy, Loader2, AlertCircle,
  Zap, Code2, BarChart2, Lock, Play, ChevronRight, Maximize2
} from 'lucide-react';
import { getContest, registerForContest, getContestLeaderboard, getMyContestSubmissions } from '../api/contestApi';
import useAuthStore from '../store/authStore';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import toast from 'react-hot-toast';

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function useCountdown(target) {
  const [diff, setDiff] = useState(Math.max(0, new Date(target) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, new Date(target) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    total: diff
  };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function LiveLeaderboard({ slug, problems = [], isLive, currentUserId }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['contest-leaderboard', slug],
    queryFn: () => getContestLeaderboard(slug),
    refetchInterval: isLive ? 15000 : false
  });

  const rows = data?.data || [];

  if (isLoading) return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />)}
    </div>
  );

  if (!rows.length) return (
    <div className="text-center py-12 text-gray-500">
      <BarChart2 size={28} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">No submissions yet. Be the first!</p>
      {isLive && <p className="text-xs text-gray-600 mt-1">Auto-refreshes every 15 seconds</p>}
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
            <th className="text-left px-4 py-3 w-14">Rank</th>
            <th className="text-left px-4 py-3">Participant</th>
            {problems.slice(0, 5).map(p => (
              <th key={p._id} className="text-center px-2 py-3 w-12 hidden lg:table-cell">
                <span className="text-xs">{p.label || p.order}</span>
              </th>
            ))}
            <th className="text-right px-4 py-3 w-20">Score</th>
            <th className="text-right px-4 py-3 w-20 hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMe = currentUserId && row.userId?.toString() === currentUserId?.toString();
            const rankColors = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400' };
            const userIdentifier = row.user?.rollNumber || row.userId;
            return (
              <tr key={row.userId}
                className={`border-b border-gray-800/40 transition-colors ${isMe ? 'bg-blue-500/10' : 'hover:bg-gray-800/30'}`}>
                <td className="px-4 py-3">
                  <span className={`font-bold text-sm ${rankColors[row.rank] || 'text-gray-500'}`}>
                    {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank-1] : `#${row.rank}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/profile/${userIdentifier}`)}
                    className="text-left hover:underline"
                    title={`View ${row.user?.name}'s profile`}
                  >
                    <div className="font-medium text-white flex items-center gap-2">
                      {row.user?.name || '—'}
                      {isMe && <span className="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">you</span>}
                    </div>
                    <div className="text-xs text-gray-500">{row.user?.rollNumber}</div>
                  </button>
                </td>
                {problems.slice(0, 5).map(p => {
                  const pid = p.problemId?._id?.toString() || p.problemId?.toString();
                  const pd = row.problemDetails?.[pid];
                  return (
                    <td key={pid} className="px-2 py-3 text-center hidden lg:table-cell">
                      {pd?.solved ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 size={13} className="text-green-400" />
                          <span className="text-xs text-gray-500">{Math.floor(pd.timeSec/60)}m</span>
                        </div>
                      ) : pd?.attempts > 0 ? (
                        <span className="text-xs text-red-400">-{pd.attempts}</span>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold text-yellow-400">{row.totalPoints}</td>
                <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                  {Math.floor(row.totalTimeSec / 60)}m
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Problem Card ─────────────────────────────────────────────────────────────
function ProblemCard({ p, slug, mySubmissions = [], isLive, onEnter }) {
  const pid = p.problemId?._id?.toString();
  const mySubs = mySubmissions.filter(s => s.problemId?.toString() === pid || s.problemId?._id?.toString() === pid);
  const accepted = mySubs.find(s => s.status === 'accepted');
  const attempted = mySubs.length > 0;

  const handleClick = (e) => {
    if (isLive && onEnter) {
      e.preventDefault();
      onEnter(p.problemId?.slug);
    }
  };

  return (
    <Link
      to={isLive ? `/contests/${slug}/problems/${p.problemId?.slug}` : `/problems/${p.problemId?.slug}`}
      onClick={handleClick}
      className={`relative bg-gray-900 border rounded-xl p-5 transition-all hover:shadow-lg group ${
        accepted ? 'border-green-500/40 hover:border-green-500/60'
        : attempted ? 'border-yellow-500/30 hover:border-yellow-500/50'
        : 'border-gray-800 hover:border-blue-500/40'
      }`}
    >
      {/* Status indicator */}
      {accepted && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={16} className="text-green-400" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
            accepted ? 'bg-green-400/10 text-green-400'
            : attempted ? 'bg-yellow-400/10 text-yellow-400'
            : 'bg-gray-800 text-gray-400'
          }`}>
            {p.label || p.order}
          </span>
          {accepted && <span className="text-xs text-green-400">Solved</span>}
          {!accepted && attempted && <span className="text-xs text-yellow-400">{mySubs.length} attempt{mySubs.length > 1 ? 's' : ''}</span>}
        </div>
        <span className="text-yellow-400 text-sm font-bold">{p.points}</span>
      </div>

      <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {p.problemId?.title}
      </h3>

      <div className="flex items-center justify-between">
        <DifficultyBadge difficulty={p.problemId?.difficulty} />
        <ChevronRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContestDetailPage() {
  const { slug } = useParams();
  const { user, token, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('problems');
  const socketRef = useRef(null);
  const [liveCount, setLiveCount] = useState(0);

  // ── Fullscreen enforcement state ──
  const [fsModal, setFsModal] = useState(null); // null | 'request' | 'warn1' | 'warn2' | 'banned'
  const [pendingProblemSlug, setPendingProblemSlug] = useState(null);
  const VIOLATION_KEY = `fs_violations_${slug}`;
  const getViolations = () => parseInt(localStorage.getItem(VIOLATION_KEY) || '0', 10);
  const addViolation = () => {
    const v = getViolations() + 1;
    localStorage.setItem(VIOLATION_KEY, v);
    return v;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contest', slug],
    queryFn: () => getContest(slug),
    refetchInterval: 30000
  });

  const contest = data?.data;
  const isRegistered = data?.isRegistered || false;
  const status = contest?.status;

  // Cache endTime for instant timer on problem pages
  useEffect(() => {
    if (contest?.endTime) localStorage.setItem(`contest_end_${slug}`, contest.endTime);
  }, [contest?.endTime, slug]);

  const timer = useCountdown(status === 'live' ? contest?.endTime : contest?.startTime);
  const isRedTimer = status === 'live' && timer.total < 600000;
  const isWarningTimer = status === 'live' && timer.total < 1800000;

  // My submissions in this contest
  const { data: mySubsData } = useQuery({
    queryKey: ['my-contest-subs', slug],
    queryFn: () => getMyContestSubmissions(slug),
    enabled: !!isRegistered && status === 'live',
    refetchInterval: 5000
  });
  const mySubmissions = mySubsData?.data || [];

  // Socket.io
  useEffect(() => {
    if (status !== 'live' || !contest?._id) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current.emit('contest:join', { contestId: contest._id, token });

    socketRef.current.on('leaderboard:update', (data) => {
      if (data && Array.isArray(data)) {
        qc.setQueryData(['contest-leaderboard', slug], { data });
      } else {
        qc.invalidateQueries(['contest-leaderboard', slug]);
      }
      qc.invalidateQueries(['my-contest-subs', slug]);
    });

    socketRef.current.on('connect', () => setLiveCount(c => c + 1));
    socketRef.current.on('disconnect', () => setLiveCount(c => Math.max(0, c - 1)));

    return () => {
      socketRef.current?.emit('contest:leave', { contestId: contest._id });
      socketRef.current?.disconnect();
    };
  }, [status, contest?._id]);

  const { mutate: doRegister, isLoading: registering } = useMutation({
    mutationFn: () => registerForContest(contest._id),
    onSuccess: () => {
      if (contest?.endTime) {
        localStorage.setItem(`contest_end_${slug}`, contest.endTime);
      }
      toast.success('Registered!');
      qc.invalidateQueries(['contest', slug]);
    },
    onError: e => toast.error(e.response?.data?.error || e.message)
  });

  // ── Fullscreen enter handler ──
  const handleEnterProblem = (problemSlug) => {
    const violations = getViolations();
    if (violations >= 3) {
      setFsModal('banned');
      return;
    }
    setPendingProblemSlug(problemSlug);
    setFsModal('request');
  };

  const enterFullscreenAndNavigate = async (problemSlug) => {
    try {
      await document.documentElement.requestFullscreen();
      setFsModal(null);
      navigate(`/contests/${slug}/problems/${problemSlug}`);
    } catch {
      // Fullscreen denied — close modal and show error
      setFsModal(null);
      setPendingProblemSlug(null);
      toast.error('Fullscreen permission denied. Please allow fullscreen and try again.');
    }
  };

  const handleFsModalAction = async () => {
    if (pendingProblemSlug) {
      await enterFullscreenAndNavigate(pendingProblemSlug);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  if (isError || !contest) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Contest not found</p>
    </div>
  );

  const solvedCount = mySubmissions.filter(s => s.status === 'accepted').length;
  const myPoints = mySubmissions.filter(s => s.status === 'accepted')
    .reduce((a, s) => a + (s.points || 0), 0);

  // ── UPCOMING ──────────────────────────────────────────────────────────────
  if (status === 'upcoming') return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full capitalize">{contest.type}</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full">{contest.scoringType === 'icpc' ? 'ICPC Scoring' : 'Points Scoring'}</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
        {contest.description && <p className="text-gray-400 mb-6">{contest.description}</p>}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Starts</p>
              <p className="text-white font-medium">{formatDate(contest.startTime)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Ends</p>
              <p className="text-white font-medium">{formatDate(contest.endTime)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Duration</p>
              <p className="text-white font-medium">{contest.duration} minutes</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Problems</p>
              <p className="text-white font-medium">{contest.problems?.length || '?'}</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-3">Starts in</p>
          <div className="flex gap-3 mb-6">
            {[['Days', timer.d], ['Hours', timer.h], ['Min', timer.m], ['Sec', timer.s]].map(([label, val]) => (
              <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-center min-w-[64px]">
                <div className="text-2xl font-bold font-mono text-blue-400">{pad(val)}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1.5"><Users size={14} /> {contest.registeredCount} registered</span>
          </div>

          {isAuthenticated ? (
            isRegistered ? (
              <div className="flex items-center gap-2 text-green-400 font-medium bg-green-400/10 border border-green-400/20 px-4 py-2.5 rounded-lg w-fit">
                <CheckCircle2 size={16} /> You're registered
              </div>
            ) : (
              <button onClick={() => doRegister()} disabled={registering}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                {registering ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Register Now
              </button>
            )
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium">
              <Zap size={14} /> Login to Register
            </Link>
          )}
        </div>

        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-4 flex items-center gap-2">
          <Lock size={14} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-400">Problems will be revealed when the contest starts</p>
        </div>

        {contest.rules && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-gray-400" /> Rules
            </h2>
            <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{contest.rules}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── LIVE ──────────────────────────────────────────────────────────────────
  if (status === 'live') return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Sticky Header */}
      <div className={`sticky top-0 z-40 border-b px-4 py-2.5 transition-colors ${
        isRedTimer ? 'bg-red-950/80 border-red-800 backdrop-blur-sm'
        : isWarningTimer ? 'bg-orange-950/60 border-orange-800/50 backdrop-blur-sm'
        : 'bg-gray-900/95 border-gray-800 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">LIVE</span>
            </div>
            <h1 className="font-bold text-base truncate">{contest.title}</h1>
            <span className="text-xs text-gray-500 hidden sm:block capitalize">{contest.type}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* My score */}
            {isRegistered && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="text-center">
                  <div className="font-bold text-white">{solvedCount}/{contest.problems?.length || 0}</div>
                  <div className="text-xs text-gray-500">solved</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-400">{myPoints}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-0.5">Time Left</div>
              <div className={`font-mono text-xl font-bold tabular-nums ${
                isRedTimer ? 'text-red-400 animate-pulse' : isWarningTimer ? 'text-orange-400' : 'text-white'
              }`}>
                {pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {contest.startTime && contest.endTime && (
        <div className="h-0.5 bg-gray-800">
          <div
            className={`h-full transition-all ${isRedTimer ? 'bg-red-500' : isWarningTimer ? 'bg-orange-500' : 'bg-blue-500'}`}
            style={{
              width: `${Math.max(0, Math.min(100, ((Date.now() - new Date(contest.startTime)) / (new Date(contest.endTime) - new Date(contest.startTime))) * 100))}%`
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-5 flex-1 w-full">

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {[
              ['problems', `Problems (${contest.problems?.length || 0})`, <Code2 size={13} />],
              ['leaderboard', 'Leaderboard', <Trophy size={13} />]
            ].map(([val, label, icon]) => (
              <button key={val} onClick={() => setTab(val)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
                  tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>

          {!isRegistered && isAuthenticated && (
            <button onClick={() => doRegister()} disabled={registering}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              {registering ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              Join Contest
            </button>
          )}
        </div>

        {/* Problems Tab */}
        {tab === 'problems' && (
          <div>
            {!isRegistered && (
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-5 flex items-center gap-2">
                <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-400">Register to submit solutions and appear on the leaderboard</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contest.problems?.map(p => (
                <ProblemCard
                  key={p._id}
                  p={p}
                  slug={slug}
                  mySubmissions={mySubmissions}
                  isLive={true}
                  onEnter={handleEnterProblem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">Auto-refreshes every 15 seconds</p>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <LiveLeaderboard
                slug={slug}
                problems={contest.problems || []}
                isLive={true}
                currentUserId={user?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen Modal ── */}
      {fsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-lg shadow-2xl">

            {fsModal === 'banned' ? (
              <>
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-4">
                  <Lock size={26} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-center text-white mb-2">Access Revoked</h2>
                <p className="text-sm text-gray-400 text-center mb-6">
                  You exited fullscreen <span className="text-red-400 font-semibold">3 times</span>. You are no longer allowed to participate in this contest.
                </p>
                <button
                  onClick={() => setFsModal(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium transition-colors">
                  Close
                </button>
              </>
            ) : fsModal === 'request' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/30 shrink-0">
                    <Maximize2 size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Before You Enter</h2>
                    <p className="text-sm text-gray-400">Read all rules. Violations are tracked automatically.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">

                  {/* Fullscreen */}
                  <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Maximize2 size={11} /> Fullscreen
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-blue-400 shrink-0">→</span> Stay fullscreen the entire contest</li>
                      <li className="flex items-start gap-2"><span className="text-blue-400 shrink-0">→</span> <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white font-mono text-xs">ESC</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white font-mono text-xs">F11</kbd> = violation</li>
                      <li className="flex items-start gap-2"><span className="text-blue-400 shrink-0">→</span> Auto-restored in 2 seconds</li>
                    </ul>
                  </div>

                  {/* Tab/Window Switch */}
                  <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle size={11} /> Tab / App Switch
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">→</span> Switching browser tabs = violation</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">→</span> Alt+Tab to another app = violation</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">→</span> Virtual desktop switch = violation</li>
                    </ul>
                  </div>

                  {/* 3-Strike Policy */}
                  <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lock size={11} /> 3-Strike Policy
                    </p>
                    <ul className="text-sm space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-yellow-400 font-bold shrink-0">1.</span><span className="text-yellow-400">1st — Warning, you may continue</span></li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold shrink-0">2.</span><span className="text-orange-400">2nd — Final warning</span></li>
                      <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">3.</span><span className="text-red-400">3rd — Permanent ban, no appeal</span></li>
                    </ul>
                  </div>

                  {/* Prohibited */}
                  <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lock size={11} /> Prohibited
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> Copy / Paste / Cut</li>
                      <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> Screenshots (all methods)</li>
                      <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> Right-click / context menu</li>
                      <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> AI tools / external help</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setFsModal(null); setPendingProblemSlug(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleFsModalAction}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <Maximize2 size={14} />
                    I Understand, Enter Contest
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  // ── ENDED ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Ended</span>
                <span className="text-xs text-gray-500 capitalize">{contest.type}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">{contest.title}</h1>
              <p className="text-sm text-gray-500">
                {formatDate(contest.startTime)} — {formatDate(contest.endTime)}
              </p>
            </div>
            <div className="flex gap-5 text-center">
              <div>
                <div className="text-xl font-bold">{contest.problems?.length || 0}</div>
                <div className="text-xs text-gray-500">Problems</div>
              </div>
              <div>
                <div className="text-xl font-bold">{contest.registeredCount}</div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
              <div>
                <div className="text-xl font-bold">{contest.duration}m</div>
                <div className="text-xs text-gray-500">Duration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {[
            ['problems', 'Problems', <Code2 size={13} />],
            ['leaderboard', 'Final Standings', <Trophy size={13} />]
          ].map(([val, label, icon]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === 'problems' && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Play size={12} /> Practice mode — submissions won't affect standings
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contest.problems?.map(p => (
                <Link key={p._id} to={`/contests/${slug}/problems/${p.problemId?.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded font-mono">
                      {p.label || p.order}
                    </span>
                    <span className="text-gray-500 text-sm">{p.points} pts</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {p.problemId?.title}
                  </h3>
                  <DifficultyBadge difficulty={p.problemId?.difficulty} />
                </Link>
              ))}
            </div>
          </>
        )}

        {tab === 'leaderboard' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <LiveLeaderboard
              slug={slug}
              problems={contest.problems || []}
              isLive={false}
              currentUserId={user?.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
