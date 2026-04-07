import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getUserProfile, updateProfile } from '../api/userApi';
import useAuthStore from '../store/authStore';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import SubmissionHeatmap from '../components/Profile/SubmissionHeatmap';
import toast from 'react-hot-toast';
import {
  Loader2, Trophy, Code2, Clock, Target, Zap,
  Calendar, Edit2, Check, X, User, BookOpen, Award
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const LANG_COLORS = {
  python: '#3b82f6', cpp: '#a855f7', c: '#f59e0b',
  java: '#f97316', javascript: '#22c55e'
};

const VERDICT_COLORS = {
  accepted: '#22c55e', wrong_answer: '#ef4444',
  time_limit_exceeded: '#f97316', runtime_error: '#ef4444',
  compilation_error: '#a855f7', pending: '#6b7280'
};

const DIFF_TEXT = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

// ─── sub-components ──────────────────────────────────────────────────────────

function SolvedRing({ easy = 0, medium = 0, hard = 0, total = 0 }) {
  const circumference = 2 * Math.PI * 15.9;
  const easyDash  = (easy  / Math.max(total, 1)) * circumference;
  const medDash   = (medium / Math.max(total, 1)) * circumference;
  const hardDash  = (hard  / Math.max(total, 1)) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
          {/* Easy */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="2.5"
            strokeDasharray={`${easyDash} ${circumference - easyDash}`} />
          {/* Medium */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eab308" strokeWidth="2.5"
            strokeDasharray={`${medDash} ${circumference - medDash}`}
            strokeDashoffset={-easyDash} />
          {/* Hard */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="2.5"
            strokeDasharray={`${hardDash} ${circumference - hardDash}`}
            strokeDashoffset={-(easyDash + medDash)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-gray-500">solved</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {[
          { label: 'Easy',   value: easy,   color: 'text-green-400',  dot: '#22c55e' },
          { label: 'Medium', value: medium, color: 'text-yellow-400', dot: '#eab308' },
          { label: 'Hard',   value: hard,   color: 'text-red-400',    dot: '#ef4444' }
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.dot }} />
            <span className="text-xs text-gray-400 w-14">{s.label}</span>
            <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanguageChart({ langCount = {} }) {
  const total = Object.values(langCount).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-xs text-gray-600 py-2">No submissions yet</p>;
  const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map(([lang, count]) => {
        const pct = ((count / total) * 100).toFixed(1);
        return (
          <div key={lang}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 capitalize font-medium">{lang}</span>
              <span className="text-gray-500">{count} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: LANG_COLORS[lang] || '#6b7280' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerdictChart({ verdictCount = {} }) {
  const total = Object.values(verdictCount).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-xs text-gray-600 py-2">No submissions yet</p>;

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-px">
        {Object.entries(verdictCount).sort((a, b) => b[1] - a[1]).map(([v, c]) => (
          <div key={v} style={{ width: `${(c / total) * 100}%`, backgroundColor: VERDICT_COLORS[v] || '#6b7280' }}
            title={`${v.replace(/_/g, ' ')}: ${c}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(verdictCount).sort((a, b) => b[1] - a[1]).map(([v, c]) => (
          <div key={v} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VERDICT_COLORS[v] || '#6b7280' }} />
            <span className="capitalize">{v.replace(/_/g, ' ')}</span>
            <span className="text-gray-600">({c})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, batch: user.batch, branch: user.branch });
  const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="font-semibold text-white mb-4">Edit Profile</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Branch</label>
            <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Batch</label>
            <input value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
              placeholder="e.g. 2023-2027"
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, setUser } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('activity');
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username),
    enabled: !!username && username !== 'undefined'
  });

  const { mutate: doUpdate } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      toast.success('Profile updated');
      setUser(res.data);
      qc.invalidateQueries(['profile', username]);
      setShowEdit(false);
    },
    onError: e => toast.error(e.message)
  });

  if (!username || username === 'undefined') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-3">
        <User size={40} className="text-gray-600" />
        <p className="text-gray-400">Please log in to view your profile</p>
        <Link to="/login" className="text-blue-400 hover:underline text-sm">Go to Login</Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  if (isError || !data?.data) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-3">
      <User size={40} className="text-gray-600" />
      <p className="text-gray-400">User not found</p>
      <Link to="/" className="text-blue-400 hover:underline text-sm">Go Home</Link>
    </div>
  );

  const {
    user, diffBreakdown = {}, recentSubmissions = [], calendar = {},
    langCount = {}, verdictCount = {}, totalSubmissions = 0, contestHistory = []
  } = data.data;

  const stats = user.stats || {};
  const isOwnProfile = currentUser?.rollNumber === user.rollNumber
    || currentUser?.id?.toString() === user._id?.toString();

  const acceptanceRate = stats.totalSubmissions > 0
    ? ((stats.acceptedSubmissions || 0) / stats.totalSubmissions * 100).toFixed(1)
    : '0.0';

  const tabs = [
    { id: 'activity', label: 'Activity', icon: <Clock size={13} /> },
    { id: 'solved', label: `Solved (${stats.totalSolved || 0})`, icon: <BookOpen size={13} /> },
    { id: 'contests', label: `Contests (${contestHistory.length})`, icon: <Trophy size={13} /> }  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold shrink-0 shadow-lg">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold truncate">{user.name}</h1>
                {stats.rank > 0 && (
                  <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-0.5 rounded-full font-medium">
                    #{stats.rank} Global
                  </span>
                )}
                {user.role === 'admin' || user.role === 'superadmin' ? (
                  <span className="text-xs bg-purple-400/10 text-purple-400 border border-purple-400/20 px-2.5 py-0.5 rounded-full">
                    Admin
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span className="font-mono text-gray-500">{user.rollNumber}</span>
                {user.branch && <><span className="text-gray-700">·</span><span>{user.branch}</span></>}
                {user.batch && <><span className="text-gray-700">·</span><span>{user.batch}</span></>}
                <span className="text-gray-700">·</span>
                <span className="text-xs">Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isOwnProfile && (
                <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors border border-gray-700">
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-gray-800">
            {[
              { label: 'Problems Solved', value: stats.totalSolved || 0, color: 'text-white' },
              { label: 'Total Submissions', value: totalSubmissions, color: 'text-gray-300' },
              { label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: 'text-blue-400' },
              { label: 'Contest Points', value: stats.points || 0, color: 'text-yellow-400' },
              { label: 'Current Streak', value: `${stats.streak || 0} days`, color: 'text-orange-400' }
            ].map(s => (
              <div key={s.label}>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-4">

            {/* Solved Ring */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Problems Solved</h3>
              <SolvedRing
                easy={diffBreakdown.easy || 0}
                medium={diffBreakdown.medium || 0}
                hard={diffBreakdown.hard || 0}
                total={stats.totalSolved || 0}
              />
            </div>

            {/* Languages */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Code2 size={13} className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Languages</h3>
              </div>
              <LanguageChart langCount={langCount} />
            </div>

            {/* Verdict Breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={13} className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verdicts</h3>
              </div>
              <VerdictChart verdictCount={verdictCount} />
            </div>

          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Heatmap */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold">Submission Activity</h3>
                <span className="text-xs text-gray-600 ml-auto">Last 52 weeks</span>
              </div>
              <SubmissionHeatmap data={calendar} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent Accepted Submissions</h3>
                  {isOwnProfile && (
                    <Link to="/history" className="text-xs text-blue-400 hover:underline">View all →</Link>
                  )}
                </div>
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No accepted submissions yet</p>
                  </div>
                ) : (
                  recentSubmissions.map((s, i) => (
                    <div key={s._id}
                      className="flex items-center justify-between px-5 py-3 border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-gray-600 w-5 shrink-0">{i + 1}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        <Link to={`/problems/${s.problemId?.slug}`}
                          className="text-sm text-white hover:text-blue-400 transition-colors truncate">
                          {s.problemId?.title || 'Unknown'}
                        </Link>
                        {s.problemId?.difficulty && (
                          <DifficultyBadge difficulty={s.problemId.difficulty} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs capitalize font-medium"
                          style={{ color: LANG_COLORS[s.language] || '#9ca3af' }}>
                          {s.language}
                        </span>
                        <span className="text-xs text-gray-600 hidden sm:block">
                          {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Solved Tab */}
            {activeTab === 'solved' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800">
                  <h3 className="text-sm font-semibold">Solved Problems</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 p-5">
                  {[
                    { label: 'Easy', value: diffBreakdown.easy || 0, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
                    { label: 'Medium', value: diffBreakdown.medium || 0, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
                    { label: 'Hard', value: diffBreakdown.hard || 0, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' }
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                      <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                    {[
                      { v: diffBreakdown.easy || 0, c: '#22c55e' },
                      { v: diffBreakdown.medium || 0, c: '#eab308' },
                      { v: diffBreakdown.hard || 0, c: '#ef4444' }
                    ].map((s, i) => {
                      const total = (diffBreakdown.easy || 0) + (diffBreakdown.medium || 0) + (diffBreakdown.hard || 0);
                      return total > 0 ? (
                        <div key={i} style={{ width: `${(s.v / total) * 100}%`, backgroundColor: s.c }} />
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.totalSolved || 0} problems solved out of all available
                  </p>
                </div>
              </div>
            )}

            {/* Contests Tab */}
            {activeTab === 'contests' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Contest History ({contestHistory.length})</h3>
                </div>
                {contestHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <Trophy size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No contest participation yet</p>
                    <Link to="/contests" className="text-xs text-blue-400 hover:underline mt-1 block">
                      Browse contests →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0">
                    {contestHistory.map((c) => (
                      <div key={c.contestId} className="border-b border-gray-800/40 last:border-0">
                        {/* Contest row */}
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              c.contestStatus === 'live' ? 'bg-green-400 animate-pulse'
                              : c.contestStatus === 'upcoming' ? 'bg-blue-400'
                              : 'bg-gray-600'
                            }`} />
                            <div className="min-w-0">
                              <Link to={`/contests/${c.slug}`}
                                className="text-sm font-medium text-white hover:text-blue-400 transition-colors block truncate">
                                {c.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-gray-500 capitalize">{c.type}</span>
                                <span className="text-gray-700 text-xs">·</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(c.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-gray-700 text-xs">·</span>
                                <span className={`text-xs capitalize ${
                                  c.contestStatus === 'live' ? 'text-green-400'
                                  : c.contestStatus === 'upcoming' ? 'text-blue-400'
                                  : 'text-gray-500'
                                }`}>{c.contestStatus}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 shrink-0 ml-4 text-right">
                            <div>
                              <div className="text-sm font-bold text-white">{c.solved}/{c.totalProblems}</div>
                              <div className="text-xs text-gray-500">solved</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-yellow-400">{c.totalPoints}</div>
                              <div className="text-xs text-gray-500">points</div>
                            </div>
                          </div>
                        </div>

                        {/* Per-problem status */}
                        {c.problemStatus?.length > 0 && (
                          <div className="px-5 pb-3 flex flex-wrap gap-2">
                            {c.problemStatus.map((p, i) => (
                              <div key={i}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
                                  p.status === 'accepted'
                                    ? 'bg-green-400/10 border-green-400/20 text-green-400'
                                    : 'bg-red-400/10 border-red-400/20 text-red-400'
                                }`}>
                                <span>{p.status === 'accepted' ? '✓' : '✗'}</span>
                                <Link to={`/problems/${p.problem?.slug}`}
                                  className="hover:underline truncate max-w-[120px]">
                                  {p.problem?.title}
                                </Link>
                                {p.status === 'accepted' && p.points > 0 && (
                                  <span className="text-yellow-400 ml-1">+{p.points}</span>
                                )}
                                <span className="text-gray-600">({p.attempts} att.)</span>
                              </div>
                            ))}
                            {/* Show unAttempted problems */}
                            {c.totalProblems > c.attempted && (
                              <span className="text-xs text-gray-600 px-2 py-1">
                                +{c.totalProblems - c.attempted} not attempted
                              </span>
                            )}
                          </div>
                        )}

                        {/* Registered but no submissions */}
                        {c.problemStatus?.length === 0 && (
                          <div className="px-5 pb-3">
                            <span className="text-xs text-gray-600 italic">Registered but no submissions</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={(form) => doUpdate(form)}
        />
      )}
    </div>
  );
}
