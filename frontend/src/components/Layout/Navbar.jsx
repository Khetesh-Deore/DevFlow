import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, Menu, X, ChevronDown, LayoutDashboard, User, ShieldCheck, LogOut, History } from 'lucide-react';
import useAuthStore, { selectIsAdmin } from '../../store/authStore';
import { logoutUser } from '../../api/authApi';

const NAV_LINKS = [
  { label: 'Problems', to: '/problems' },
  { label: 'Contests', to: '/contests' },
  { label: 'Leaderboard', to: '/leaderboard' }
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = useAuthStore(selectIsAdmin);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-blue-400' : 'text-gray-300 hover:text-white'
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Code2 className="text-blue-500" size={22} />
          <span className="text-white font-bold text-lg">DevFlow</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} className={linkClass(to)}>{label}</Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
                Register
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link to="/history" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    <History size={14} /> Submission History
                  </Link>
                  <Link to={`/profile/${user?.rollNumber || user?.id}`} onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    <User size={14} /> Profile
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700">
                      <ShieldCheck size={14} /> Admin Panel
                    </Link>
                  )}
                  <hr className="border-gray-700 my-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={linkClass(to)}>{label}</Link>
          ))}
          <hr className="border-gray-800" />
          {!isAuthenticated ? (
            <div className="flex gap-3">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg">Register</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
              <Link to="/history" onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white">Submission History</Link>
              <Link to={`/profile/${user?.rollNumber || user?.id}`} onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white">Profile</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="text-sm text-yellow-400">Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="text-sm text-red-400 text-left">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
