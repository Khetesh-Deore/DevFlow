import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, Zap, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { getContests, registerForContest } from '../api/contestApi';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

function useCountdown(targetDate) {
  const [diff, setDiff] = useState(Math.max(0, new Date(targetDate) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, new Date(targetDate) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const d = Math.floor(diff / 86400000);

  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function TypeBadge({ type }) {
  const styles = {
    rated: 'bg-purple-400/10 text-purple-400',
    unrated: 'bg-gray-700 text-gray-400',
    practice: 'bg-blue-400/10 text-blue-400'
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[type] || styles.unrated}`}>
      {type}
    </span>
  );
}

function LiveCard({ contest }) {
  const navigate = useNavigate();
  const endCountdown = useCountdown(contest.endTime);

  return (
    <div className="bg-gray-900 border border-green-500/40 rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> LIVE
            </span>
            <TypeBadge type={contest.type} />
          </div>
          <h3 className="font-semibold text-white text-lg">{contest.title}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Ends in</p>
          <p className="text-green-400 font-mono font-bold">{endCountdown}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1"><Users size={12} /> {contest.registeredCount} registered</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(contest.duration)}</span>
      </div>
      <button onClick={() => navigate(`/contests/${contest.slug}`)}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
        Enter Contest
      </button>
    </div>
  );
}

function UpcomingCard({ contest }) {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const startCountdown = useCountdown(contest.startTime);

  const { mutate: doRegister, isLoading } = useMutation({
    mutationFn: () => registerForContest(contest._id),
    onSuccess: () => { toast.success('Registered!'); qc.invalidateQueries(['contests']); },
    onError: (e) => toast.error(e.response?.data?.error || e.message)
  });

  return (
    <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TypeBadge type={contest.type} />
          </div>
          <h3 className="font-semibold text-white">{contest.title}</h3>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1"><Calendar size={12} /> Starts in {startCountdown}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(contest.duration)}</span>
        <span className="flex items-center gap-1"><Users size={12} /> {contest.registeredCount}</span>
      </div>
      {isAuthenticated ? (
        contest.isRegistered ? (
          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
            <CheckCircle2 size={14} /> Registered
          </div>
        ) : (
          <button onClick={() => doRegister()} disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Register
          </button>
        )
      ) : (
        <Link to="/login" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">
          Login to Register
        </Link>
      )}
    </div>
  );
}

export default function ContestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: () => getContests(),
    refetchInterval: 30000
  });

  const contests = data?.data || [];
  const live = contests.filter(c => c.status === 'live');
  const upcoming = contests.filter(c => c.status === 'upcoming');
  const ended = contests.filter(c => c.status === 'ended');

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Contests</h1>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Live */}
            {live.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-green-400" />
                  <h2 className="text-lg font-semibold text-green-400">Live Now</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {live.map(c => <LiveCard key={c._id} contest={c} />)}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4">Upcoming Contests</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {upcoming.map(c => <UpcomingCard key={c._id} contest={c} />)}
                </div>
              </section>
            )}

            {/* Past */}
            {ended.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Past Contests</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                        <th className="text-left px-4 py-3">Title</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Duration</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Participants</th>
                        <th className="text-left px-4 py-3">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ended.map(c => (
                        <tr key={c._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <Link to={`/contests/${c.slug}`} className="hover:text-blue-400 transition-colors font-medium">
                              {c.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                            {new Date(c.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDuration(c.duration)}</td>
                          <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{c.registeredCount}</td>
                          <td className="px-4 py-3"><TypeBadge type={c.type} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {contests.length === 0 && (
              <div className="text-center py-20 text-gray-500">No contests available yet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
