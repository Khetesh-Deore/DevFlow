import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Trophy, BarChart2, ShieldCheck, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/authApi';
import useAuthStore, { selectIsAdmin } from '../store/authStore';

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const isAdmin = useAuthStore(selectIsAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe
  });

  useEffect(() => {
    if (data?.data) setUser(data.data);
  }, [data]);

  const stats = user?.stats || {};

  const statCards = [
    { label: 'Total Solved', value: stats.totalSolved ?? 0, color: 'text-blue-400' },
    { label: 'Easy', value: stats.easySolved ?? 0, color: 'text-green-400' },
    { label: 'Medium', value: stats.mediumSolved ?? 0, color: 'text-yellow-400' },
    { label: 'Hard', value: stats.hardSolved ?? 0, color: 'text-red-400' }
  ];

  const quickLinks = [
    { label: 'Go to Problems', to: '/problems', icon: <Code2 size={16} /> },
    { label: 'View Contests', to: '/contests', icon: <Trophy size={16} /> },
    { label: 'Leaderboard', to: '/leaderboard', icon: <BarChart2 size={16} /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.branch} · {user?.batch} · {user?.rollNumber}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-gray-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map(({ label, to, icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-blue-500 text-sm text-gray-300 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
                {icon} {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-400 text-sm text-yellow-400 hover:text-yellow-300 px-4 py-2.5 rounded-lg transition-colors">
                <ShieldCheck size={16} /> Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
            No recent activity yet. Start solving problems!
          </div>
        </div>

      </div>
    </div>
  );
}
