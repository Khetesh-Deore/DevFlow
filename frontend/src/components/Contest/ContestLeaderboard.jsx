import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getContestLeaderboard } from '../../api/contestApi';
import useAuthStore from '../../store/authStore';

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

const RANK_BORDER = {
  1: 'border-l-4 border-yellow-400',
  2: 'border-l-4 border-gray-300',
  3: 'border-l-4 border-orange-400'
};

const RANK_COLOR = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400'
};

export default function ContestLeaderboard({ slug, problems = [], isLive = false }) {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['contest-leaderboard', slug],
    queryFn: () => getContestLeaderboard(slug),
    refetchInterval: isLive ? 30000 : false
  });

  const rows = data?.data || [];

  if (isLoading) return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  );

  if (!rows.length) return (
    <p className="text-center text-gray-500 text-sm py-10">No submissions yet</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800 bg-gray-900 sticky top-0">
            <th className="text-left px-3 py-3 w-14">Rank</th>
            <th className="text-left px-3 py-3">Name</th>
            <th className="text-left px-3 py-3 hidden sm:table-cell w-28">Roll No</th>
            {problems.map((p) => (
              <th key={p._id || p.order} className="text-center px-2 py-3 w-16 hidden lg:table-cell">
                {p.label || p.order}
              </th>
            ))}
            <th className="text-right px-3 py-3 w-20">Score</th>
            <th className="text-right px-3 py-3 w-20 hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isCurrentUser = user && row.userId?.toString() === user.id?.toString();
            const rankBorder = RANK_BORDER[row.rank] || '';
            const rankColor = RANK_COLOR[row.rank] || 'text-gray-400';

            return (
              <tr
                key={row.userId}
                className={`border-b border-gray-800/50 transition-colors ${rankBorder}
                  ${isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-gray-800/30'}`}
              >
                <td className="px-3 py-3">
                  <span className={`font-bold ${rankColor}`}>#{row.rank}</span>
                </td>
                <td className="px-3 py-3">
                  <Link
                    to={`/profile/${row.userId}`}
                    className={`font-medium hover:text-blue-400 transition-colors ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}
                  >
                    {row.user?.name || '—'}
                    {isCurrentUser && <span className="text-xs text-blue-400 ml-1">(you)</span>}
                  </Link>
                </td>
                <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">
                  {row.user?.rollNumber || '—'}
                </td>

                {/* Per-problem columns */}
                {problems.map((p) => {
                  const pid = p.problemId?._id?.toString() || p.problemId?.toString();
                  const pd = row.problemDetails?.[pid];

                  return (
                    <td key={pid} className="px-2 py-3 text-center hidden lg:table-cell">
                      {!pd ? (
                        <span className="text-gray-700">—</span>
                      ) : pd.solved ? (
                        <div className="flex flex-col items-center">
                          <span className="text-green-400 text-xs font-medium">✓</span>
                          <span className="text-gray-500 text-xs">{formatTime(pd.timeSec)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-red-400 text-xs">✗</span>
                          <span className="text-gray-500 text-xs">{pd.attempts}</span>
                        </div>
                      )}
                    </td>
                  );
                })}

                <td className="px-3 py-3 text-right font-bold text-yellow-400">
                  {row.totalPoints}
                </td>
                <td className="px-3 py-3 text-right text-gray-400 hidden md:table-cell">
                  {formatTime(row.totalTimeSec)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
