import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { CheckCircle2, Clock, Users, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { getContest, registerForContest, getContestLeaderboard } from '../api/contestApi';
import useAuthStore from '../store/authStore';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import toast from 'react-hot-toast';

// ─── countdown hook ──────────────────────────────────────────────────────────
function useCountdown(target) {
  const [diff, setDiff] = useState(Math.max(0, new Date(target) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, new Date(target) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, total: diff };
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── leaderboard table ───────────────────────────────────────────────────────
function LeaderboardTable({ slug }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contest-leaderboard', slug],
    queryFn: () => getContestLeaderboard(slug),
    refetchInterval: 30000
  });

  const rows = data?.data || [];

  if (isLoading) return (
    <div className="flex flex-col gap-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
    </div>
  );

  if (!rows.length) return <p className="text-gray-500 text-sm text-center py-8">No submissions yet</p>;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
            <th className="text-left px-3 py-2">Rank</th>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2 hidden sm:table-cell">Roll No</th>
            <th className="text-left px-3 py-2">Solved</th>
            <th className="text-left px-3 py-2">Points</th>
            <th className="text-left px-3 py-2 hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="px-3 py-2.5">
                <span className={`font-bold ${row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-gray-300' : row.rank === 3 ? 'text-orange-400' : 'text-gray-400'}`}>
                  #{row.rank}
                </span>
              </td>
              <td className="px-3 py-2.5 font-medium">{row.user?.name || '—'}</td>
              <td className="px-3 py-2.5 text-gray-400 hidden sm:table-cell">{row.user?.rollNumber}</td>
              <td className="px-3 py-2.5">{row.solvedCount}</td>
              <td className="px-3 py-2.5 text-yellow-400 font-medium">{row.totalPoints}</td>
              <td className="px-3 py-2.5 text-gray-400 hidden md:table-cell">
                {Math.floor(row.totalTimeSec / 60)}m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function ContestDetailPage() {
  const { slug } = useParams();
  const { user, token, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('problems');
  const socketRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contest', slug],
    queryFn: () => getContest(slug),
    refetchInterval: 60000
  });

  const contest = data?.data;
  const isRegistered = data?.isRegistered || false;
  const status = contest?.status;

  const timer = useCountdown(status === 'live' ? contest?.endTime : contest?.startTime);
  const isRedTimer = status === 'live' && timer.total < 600000;

  // Socket.io for live leaderboard
  useEffect(() => {
    if (status !== 'live' || !contest?._id) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current.emit('contest:join', { contestId: contest._id, token });

    socketRef.current.on('leaderboard:update', () => {
      qc.invalidateQueries(['contest-leaderboard', slug]);
    });

    return () => {
      socketRef.current?.emit('contest:leave', { contestId: contest._id });
      socketRef.current?.disconnect();
    };
  }, [status, contest?._id]);

  const { mutate: doRegister, isLoading: registering } = useMutation({
    mutationFn: () => registerForContest(contest._id),
    onSuccess: () => { toast.success('Registered!'); qc.invalidateQueries(['contest', slug]); },
    onError: (e) => toast.error(e.response?.data?.error || e.message)
  });

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

  // ── UPCOMING ──────────────────────────────────────────────────────────────
  if (status === 'upcoming') return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full capitalize">{contest.type}</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
        {contest.description && <p className="text-gray-400 mb-6">{contest.description}</p>}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-400 mb-1">Starts at</p>
          <p className="text-white font-medium mb-4">{formatDate(contest.startTime)}</p>

          <p className="text-sm text-gray-400 mb-2">Starts in</p>
          <div className="flex gap-3 mb-6">
            {[['Days', timer.d], ['Hours', timer.h], ['Min', timer.m], ['Sec', timer.s]].map(([label, val]) => (
              <div key={label} className="bg-gray-800 rounded-lg px-4 py-3 text-center min-w-[60px]">
                <div className="text-2xl font-bold font-mono text-blue-400">{pad(val)}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1"><Clock size={14} /> {contest.duration} minutes</span>
            <span className="flex items-center gap-1"><Users size={14} /> {contest.registeredCount} registered</span>
          </div>

          {isAuthenticated ? (
            isRegistered ? (
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <CheckCircle2 size={18} /> Registered
              </div>
            ) : (
              <button onClick={() => doRegister()} disabled={registering}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                {registering && <Loader2 size={14} className="animate-spin" />}
                Register for Contest
              </button>
            )
          ) : (
            <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium">
              Login to Register
            </Link>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
            <AlertCircle size={14} /> Problems will be revealed when the contest starts
          </div>
        </div>

        {contest.rules && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Rules</h2>
            <p className="text-sm text-gray-400 whitespace-pre-wrap">{contest.rules}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── LIVE ──────────────────────────────────────────────────────────────────
  if (status === 'live') return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{contest.title}</h1>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> LIVE
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Time Remaining</p>
            <p className={`font-mono text-2xl font-bold ${isRedTimer ? 'text-red-400' : 'text-white'}`}>
              {pad(timer.h)}:{pad(timer.m)}:{pad(timer.s)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
          {[['problems', 'Problems'], ['leaderboard', 'Leaderboard']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'problems' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contest.problems?.map((p) => (
              <Link key={p._id} to={`/problems/${p.problemId?.slug}`}
                className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-5 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {p.label || p.order}
                  </span>
                  <span className="text-yellow-400 text-sm font-medium">{p.points} pts</span>
                </div>
                <h3 className="font-medium text-white mb-2">{p.problemId?.title}</h3>
                <DifficultyBadge difficulty={p.problemId?.difficulty} />
              </Link>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && <LeaderboardTable slug={slug} />}
      </div>
    </div>
  );

  // ── ENDED ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{contest.title}</h1>
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Ended</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {formatDate(contest.startTime)} — {formatDate(contest.endTime)}
        </p>

        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
          {[['problems', 'Problems'], ['leaderboard', 'Leaderboard']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'problems' && (
          <>
            <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
              <Trophy size={12} /> You can still practice these problems
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contest.problems?.map((p) => (
                <Link key={p._id} to={`/problems/${p.problemId?.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                      {p.label || p.order}
                    </span>
                    <span className="text-gray-500 text-sm">{p.points} pts</span>
                  </div>
                  <h3 className="font-medium text-white mb-2">{p.problemId?.title}</h3>
                  <DifficultyBadge difficulty={p.problemId?.difficulty} />
                </Link>
              ))}
            </div>
          </>
        )}

        {tab === 'leaderboard' && <LeaderboardTable slug={slug} />}
      </div>
    </div>
  );
}
