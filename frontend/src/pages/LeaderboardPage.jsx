import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Trophy } from 'lucide-react';
import { getGlobalLeaderboard } from '../api/userApi';
import { LeaderboardSkeleton } from '../components/Common/LoadingSkeleton';
import useAuthStore from '../store/authStore';
import SEO from '../components/Common/SEO';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other'];
const BATCHES = ['2024-2028', '2023-2027', '2022-2026', '2021-2025', '2020-2024'];

const RANK_STYLES = {
  1: { row: 'bg-yellow-400/5 border-l-2 border-yellow-400', badge: 'text-yellow-400' },
  2: { row: 'bg-gray-300/5 border-l-2 border-gray-300', badge: 'text-gray-300' },
  3: { row: 'bg-orange-400/5 border-l-2 border-orange-400', badge: 'text-orange-400' }
};

export default function LeaderboardPage() {
  const { user: currentUser } = useAuthStore();
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = { ...(batch && { batch }), ...(branch && { branch }), page, limit: 20 };

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => getGlobalLeaderboard(params),
    keepPreviousData: true
  });

  const users = (data?.data || []).filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.rollNumber?.toLowerCase().includes(q);
  });

  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <SEO 
        title="Leaderboard - Top Competitive Programmers"
        description="View the global leaderboard of top competitive programmers. See rankings, contest ratings, and problem-solving statistics."
        keywords="programming leaderboard, competitive programming rankings, coding contest rankings, programmer rankings, coding leaderboard"
        url="https://devflow26.vercel.app/leaderboard"
      />
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-400" size={24} />
          <h1 className="text-2xl font-bold">College Leaderboard</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or roll no..."
              className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={batch} onChange={e => { setBatch(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Batches</option>
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {(batch || branch || search) && (
            <button onClick={() => { setBatch(''); setBranch(''); setSearch(''); setPage(1); }}
              className="text-sm text-red-400 hover:text-red-300 px-2">Clear</button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">Showing {users.length} of {total} students</p>

        {/* Table */}
        {isLoading ? <LeaderboardSkeleton /> : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                    <th className="text-left px-3 py-3 w-14">Rank</th>
                    <th className="text-left px-3 py-3">Name</th>
                    <th className="text-left px-3 py-3 hidden sm:table-cell">Roll No</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Branch</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Batch</th>
                    <th className="text-center px-3 py-3 w-14 text-green-400">Easy</th>
                    <th className="text-center px-3 py-3 w-16 text-yellow-400">Med</th>
                    <th className="text-center px-3 py-3 w-14 text-red-400">Hard</th>
                    <th className="text-center px-3 py-3 w-16">Total</th>
                    <th className="text-right px-3 py-3 w-20">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-500">No users found</td>
                    </tr>
                  ) : users.map(u => {
                    const rankStyle = RANK_STYLES[u.rank] || {};
                    const isMe = currentUser?.rollNumber === u.rollNumber;
                    return (
                      <tr key={u._id}
                        className={`border-b border-gray-800/50 transition-colors ${rankStyle.row || ''} ${isMe ? 'bg-blue-500/10' : !rankStyle.row ? 'hover:bg-gray-800/30' : ''}`}>
                        <td className="px-3 py-3">
                          <span className={`font-bold ${rankStyle.badge || 'text-gray-400'}`}>
                            {u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank - 1] : `#${u.rank}`}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Link to={`/profile/${u.rollNumber}`}
                            className={`font-medium hover:text-blue-400 transition-colors ${isMe ? 'text-blue-300' : 'text-white'}`}>
                            {u.name}
                            {isMe && <span className="text-xs text-blue-400 ml-1">(you)</span>}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{u.rollNumber}</td>
                        <td className="px-3 py-3 text-gray-400 hidden md:table-cell">{u.branch}</td>
                        <td className="px-3 py-3 text-gray-400 hidden md:table-cell">{u.batch}</td>
                        <td className="px-3 py-3 text-center text-green-400">{u.stats?.easySolved || 0}</td>
                        <td className="px-3 py-3 text-center text-yellow-400">{u.stats?.mediumSolved || 0}</td>
                        <td className="px-3 py-3 text-center text-red-400">{u.stats?.hardSolved || 0}</td>
                        <td className="px-3 py-3 text-center font-semibold">{u.stats?.totalSolved || 0}</td>
                        <td className="px-3 py-3 text-right font-bold text-yellow-400">{u.stats?.points || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg ${page === n ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
