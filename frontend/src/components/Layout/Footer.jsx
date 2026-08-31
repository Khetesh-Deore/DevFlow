import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';

// Key used to detect a new browser session (cleared when tab closes)
const SESSION_KEY = 'df_visit_tracked';

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return n.toString();
}

export default function Footer() {
  const [visitors, setVisitors] = useState(null);

  useEffect(() => {
    const alreadyTracked = sessionStorage.getItem(SESSION_KEY);

    if (!alreadyTracked) {
      // New session — record the visit and get updated count
      api
        .post('/stats/visit')
        .then(res => {
          setVisitors(res.data.totalVisitors);
          sessionStorage.setItem(SESSION_KEY, '1');
        })
        .catch(() => {
          // Fallback: just fetch the count without incrementing
          fetchCount();
        });
    } else {
      fetchCount();
    }
  }, []);

  function fetchCount() {
    api
      .get('/stats/visitors')
      .then(res => setVisitors(res.data.totalVisitors))
      .catch(() => setVisitors(null));
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-white">Dev<span className="text-blue-400">Flow</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              A competitive programming platform for students to practice, compete, and grow.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/problems',    label: 'Problems'    },
                { to: '/contests',    label: 'Contests'    },
                { to: '/leaderboard', label: 'Leaderboard' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visitor counter */}
          <div className="flex flex-col items-start md:items-end justify-between">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 text-center min-w-[160px]">
              {/* Pulsing dot */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-gray-400 text-xs uppercase tracking-widest font-medium">Total Visitors</span>
              </div>

              {visitors === null ? (
                <div className="h-8 flex items-center justify-center">
                  <span className="inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <p className="text-3xl font-bold text-white tabular-nums">
                  {formatCount(visitors)}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 text-xs">
          <p>© {currentYear} DevFlow. All rights reserved.</p>
          <p>Built with ❤️ for developers</p>
        </div>
      </div>
    </footer>
  );
}
