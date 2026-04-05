import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getUserProfile } from '../api/userApi';
import useAuthStore from '../store/authStore';
import DifficultyBadge from '../components/Problem/DifficultyBadge';
import { Loader2, Calendar, Code2 } from 'lucide-react';

// ─── heatmap ─────────────────────────────────────────────────────────────────
function getHeatColor(count) {
  if (!count) return 'bg-gray-800';
  if (count <= 2) return 'bg-green-900';
  if (count <= 5) return 'bg-green-600';
  return 'bg-green-400';
}

function SubmissionHeatmap({ calendar }) {
  const [tooltip, setTooltip] = useState(null);

  const weeks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 52 weeks x 7 days grid (364 days back)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 363);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let current = new Date(startDate);
  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10);
      week.push({ date: dateStr, count: calendar[dateStr] || 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const totalSubmissions = Object.values(calendar).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2 relative">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${getHeatColor(day.count)}`}
                onMouseEnter={(e) => setTooltip({ date: day.date, count: day.count, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div className="fixed z-50 bg-gray-700 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}>
          {tooltip.date}: {tooltip.count} submission{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">{totalSubmissions} submissions in the last year</p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          Less
          {['bg-gray-800', 'bg-green-900', 'bg-green-600', 'bg-green-400'].map(c => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}

// ─── language chart ───────────────────────────────────────────────────────────
function LanguageBar({ language, count, total }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  const colors = {
    python: 'bg-blue-500', cpp: 'bg-purple-500', c: 'bg-yellow-500',
    java: 'bg-orange-500', javascript: 'bg-green-500'
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-20 capitalize">{language}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${colors[language] || 'bg-gray-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username)
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  if (isError || !data?.data) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">User not found</p>
    </div>
  );

  const { user, diffBreakdown, recentSubmissions, calendar } = data.data;
  const stats = user.stats || {};
  const isOwnProfile = currentUser?.rollNumber === user.rollNumber;

  const acceptanceRate = stats.totalSubmissions > 0
    ? ((stats.acceptedSubmissions / stats.totalSubmissions) * 100).toFixed(1)
    : 0;

  // Language breakdown from recent submissions
  const langCount = {};
  recentSubmissions.forEach(s => { langCount[s.language] = (langCount[s.language] || 0) + 1; });
  const langTotal = Object.values(langCount).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">

        {/* LEFT COLUMN */}
        <div className="md:w-64 shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold mb-3">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <h1 className="text-lg font-bold">{user.name}</h1>
            <p className="text-gray-400 text-sm">{user.rollNumber}</p>
            <p className="text-gray-500 text-xs mt-1">{user.branch} · {user.batch}</p>

            {stats.rank > 0 && (
              <div className="mt-3 bg-yellow-400/10 text-yellow-400 text-xs px-3 py-1 rounded-full font-medium">
                Rank #{stats.rank}
              </div>
            )}

            <p className="text-gray-600 text-xs mt-3">
              Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </p>

            {isOwnProfile && (
              <Link to="/dashboard"
                className="mt-4 w-full text-center text-sm bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Solved', value: stats.totalSolved || 0, color: 'text-white' },
              { label: 'Easy', value: diffBreakdown.easy, color: 'text-green-400' },
              { label: 'Medium', value: diffBreakdown.medium, color: 'text-yellow-400' },
              { label: 'Hard', value: diffBreakdown.hard, color: 'text-red-400' }
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalSubmissions || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total Submissions</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{acceptanceRate}%</div>
              <div className="text-xs text-gray-500 mt-1">Acceptance Rate</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold">Submission Activity</h2>
            </div>
            <SubmissionHeatmap calendar={calendar} />
          </div>

          {/* Language Usage */}
          {langTotal > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold">Language Usage</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {Object.entries(langCount).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                  <LanguageBar key={lang} language={lang} count={count} total={langTotal} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          {recentSubmissions.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4">Recent Accepted Submissions</h2>
              <div className="flex flex-col gap-0">
                {recentSubmissions.slice(0, 10).map(s => (
                  <div key={s._id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <Link to={`/problems/${s.problemId?.slug}`}
                        className="text-sm text-white hover:text-blue-400 transition-colors">
                        {s.problemId?.title}
                      </Link>
                      <DifficultyBadge difficulty={s.problemId?.difficulty} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize">{s.language}</span>
                      <span>{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
