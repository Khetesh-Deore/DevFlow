import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Trophy, Users, BarChart3, ExternalLink, History, LayoutDashboard, Building2 } from 'lucide-react';
import api from '../../api/axiosConfig';
import Logo from './Logo';

// Tracks one visit per browser session (sessionStorage clears on tab close)
const SESSION_KEY = 'df_visit_tracked';

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return String(n);
}

const NAV_LINKS = [
  { to: '/problems',        label: 'Problems',    icon: Code2     },
  { to: '/contests',        label: 'Contests',    icon: Trophy    },
  { to: '/leaderboard',     label: 'Leaderboard', icon: Users     },
  { to: '/company-problems',label: 'Companies',   icon: Building2 },
  { to: '/dashboard',       label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/history',         label: 'My History',  icon: History   },
];

const PLATFORM_FEATURES = [
  'Python, C++, C, Java, JavaScript',
  'Live contests with real-time leaderboard',
  'Instant judging & detailed feedback',
  'Progress tracking & streaks',
  'Anti-cheat contest proctoring',
  'Company-wise problem sets',
];

export default function Footer() {
  const [visitors, setVisitors] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const tracked = sessionStorage.getItem(SESSION_KEY);

    if (!tracked) {
      api.post('/stats/visit')
        .then(res => {
          setVisitors(res.data.totalVisitors);
          sessionStorage.setItem(SESSION_KEY, '1');
        })
        .catch(fetchCount)
        .finally(() => setLoading(false));
    } else {
      fetchCount();
    }
  }, []);

  function fetchCount() {
    api.get('/stats/visitors')
      .then(res => setVisitors(res.data.totalVisitors))
      .catch(() => setVisitors(null))
      .finally(() => setLoading(false));
  }

  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800">

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <Logo size={26} />
              <span className="font-bold text-lg bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                DevFlow
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              A competitive programming platform for students — practice problems, join live
              contests, and climb the leaderboard.
            </p>

            {/* Visitor counter */}
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-3 inline-flex flex-col items-start gap-1 w-full">
              <div className="flex items-center gap-2">
                {/* Pulsing live dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-gray-400 text-xs uppercase tracking-widest font-medium">
                  Total Visitors
                </span>
              </div>

              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin ml-0.5" />
              ) : visitors === null ? (
                <span className="text-gray-500 text-sm">—</span>
              ) : (
                <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                  {formatCount(visitors)}
                </span>
              )}
            </div>
          </div>

          {/* ── Col 2: Navigation ── */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-4">
              Navigate
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-sm transition-colors group"
                  >
                    <Icon size={13} className="text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Platform ── */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-4">
              What We Offer
            </h3>
            <ul className="space-y-2.5">
              {PLATFORM_FEATURES.map(feat => (
                <li key={feat} className="flex items-start gap-2 text-gray-400 text-sm">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500/70" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Developer / Connect ── */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-4">
              Developer
            </h3>
            <p className="text-gray-400 text-sm mb-1">Designed &amp; built by</p>
            <p className="text-white font-semibold text-base mb-4">Khetesh Deore</p>

            <a
              href="https://www.linkedin.com/in/khetesh-deore/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-full justify-center"
            >
              {/* Official LinkedIn "in" logo */}
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Connect on LinkedIn
              <ExternalLink size={12} className="shrink-0 opacity-70" />
            </a>

            <div className="mt-5 pt-5 border-t border-gray-800">
              <p className="text-gray-500 text-xs leading-relaxed">
                Have feedback or found a bug?<br />
                Reach out on LinkedIn.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            © {year} DevFlow. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs flex items-center gap-1">
            Built with
            <span className="text-red-400 mx-0.5">♥</span>
            for competitive programmers
          </p>
        </div>
      </div>

    </footer>
  );
}
