import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Wait for user to load before checking role
  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }

  if (!['admin', 'superadmin'].includes(user.role)) {
    toast.error('Access denied');
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
