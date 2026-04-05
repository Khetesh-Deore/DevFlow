import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Code2, Send, Trophy, Plus, Eye, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axiosConfig';

const VERDICT_COLORS = {
  accepted: 'text-green-400 bg-green-400/10',
  wrong_answer: 'text-red-400 bg-red-400/10',
  time_limit_exceeded: 'text-orange-400 bg-orange-400/10',
  runtime_error: 'text-red-400 bg-red-400/10',
  compilation_error: 'text-purple-400 bg-purple-400/10',
  pending: 'text-gray-400 bg-gray-700',
  running: 'text-blue-400 bg-blue-400/10'
};

const LANG_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#22c55e'];

function StatCard({ icon, label, value, sub, color = 'text-blue-400' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function VerdictBadge({ status }) {
  const cls = VERDICT_COLORS[status] || 'text-gray-400 bg-gray-700';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/users/admin/stats').then(r => r.data),
    refetchInterval: 60000
  });

  const stats = data?.data;

  const langData = (stats?.languageBreakdown || []).map(l => ({
    name: l._id,
    value: l.count
  }));

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Row 1 — Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Users size={18} />} label="Total Students"
            value={stats?.totalUsers} color="text-blue-400" />
          <StatCard icon={<Code2 size={18} />} label="Total Problems"
            value={stats?.totalProblems} color="text-purple-400"
            sub={`${stats?.totalProblems} published`} />
          <StatCard icon={<Send size={18} />} label="Submissions"
            value={stats?.totalSubmissions} color="text-green-400"
            sub={`${stats?.submissionsToday ?? 0} today`} />
          <StatCard icon={<Trophy size={18} />} label="Active Contests"
            value={stats?.activeContests ?? 0} color="text-yellow-400"
            sub={`${stats?.totalContests} total`} />
        </div>

        {/* Row 2 — Charts */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {/* Acceptance rate card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Submission Overview</h2>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Accepted</span>
                  <span>{stats?.acceptedSubmissions ?? 0} / {stats?.totalSubmissions ?? 0}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full"
                    style={{ width: stats?.totalSubmissions > 0 ? `${(stats.acceptedSubmissions / stats.totalSubmissions * 100).toFixed(1)}%` : '0%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.totalSubmissions > 0
                    ? `${(stats.acceptedSubmissions / stats.totalSubmissions * 100).toFixed(1)}% acceptance rate`
                    : 'No submissions yet'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { label: 'Accepted', value: stats?.acceptedSubmissions, color: 'text-green-400' },
                  { label: 'Today', value: stats?.submissionsToday, color: 'text-blue-400' }
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Language pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-2">Language Distribution</h2>
            {langData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={langData} cx="50%" cy="50%" outerRadius={70}
                    dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {langData.map((_, i) => (
                      <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Row 3 — Tables */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {/* Recent Submissions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Recent Submissions</h2>
            <div className="flex flex-col gap-0">
              {(stats?.recentSubmissions || []).map(s => (
                <div key={s._id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-white truncate">{s.userId?.name}</span>
                    <span className="text-xs text-gray-500 truncate">{s.problemId?.title}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <VerdictBadge status={s.status} />
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
              {!stats?.recentSubmissions?.length && (
                <p className="text-gray-500 text-sm text-center py-4">No submissions yet</p>
              )}
            </div>
          </div>

          {/* Top Solvers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Top Solvers</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Solved</th>
                  <th className="text-right py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.topSolvers || []).map((u, i) => (
                  <tr key={u._id} className="border-b border-gray-800/50">
                    <td className="py-2.5">
                      <span className={['text-yellow-400','text-gray-300','text-orange-400'][i] || 'text-gray-500'}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium">{u.name}</td>
                    <td className="py-2.5 text-right text-green-400">{u.stats?.totalSolved || 0}</td>
                    <td className="py-2.5 text-right text-yellow-400">{u.stats?.points || 0}</td>
                  </tr>
                ))}
                {!stats?.topSolvers?.length && (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-500 text-sm">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4 — Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-gray-400">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'New Problem', to: '/admin/problems/new', icon: <Plus size={14} />, color: 'bg-blue-600 hover:bg-blue-700' },
              { label: 'New Contest', to: '/admin/contests/new', icon: <Plus size={14} />, color: 'bg-purple-600 hover:bg-purple-700' },
              { label: 'View Users', to: '/admin/users', icon: <Eye size={14} />, color: 'bg-gray-700 hover:bg-gray-600' },
              { label: 'All Problems', to: '/admin/problems', icon: <Eye size={14} />, color: 'bg-gray-700 hover:bg-gray-600' },
              { label: 'All Contests', to: '/admin/contests', icon: <Eye size={14} />, color: 'bg-gray-700 hover:bg-gray-600' }
            ].map(a => (
              <Link key={a.to} to={a.to}
                className={`flex items-center gap-2 ${a.color} text-white text-sm px-4 py-2.5 rounded-lg transition-colors`}>
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
