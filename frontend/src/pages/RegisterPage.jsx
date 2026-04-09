import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Code2 } from 'lucide-react';
import { registerUser } from '../api/authApi';
import useAuthStore from '../store/authStore';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', rollNumber: '',
    branch: '', batch: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, rollNumber, branch, batch, password, confirmPassword } = form;

    if (!name || !email || !rollNumber || !branch || !batch || !password || !confirmPassword) {
      return setError('All fields are required');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    try {
      const data = await registerUser({ name, email, rollNumber, branch, batch, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code2 className="text-blue-500" size={32} />
            <span className="text-3xl font-bold text-white">DevFlow</span>
          </div>
          <p className="text-gray-400 text-sm">College Competitive Programming Platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')}
                placeholder="John Doe" className={inputClass} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@kkwagh.edu.in" className={inputClass} />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Roll Number</label>
              <input type="text" value={form.rollNumber} onChange={set('rollNumber')}
                placeholder="3723011043" className={inputClass} />
            </div>

            {/* Branch + Batch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Branch</label>
                <select value={form.branch} onChange={set('branch')}
                  className={inputClass}>
                  <option value="">Select</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Batch</label>
                <input type="text" value={form.batch} onChange={set('batch')}
                  placeholder="2024-2028" className={inputClass} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Min 6 characters"
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={set('confirmPassword')} placeholder="Re-enter password"
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
