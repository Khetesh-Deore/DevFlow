import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!['admin', 'superadmin'].includes(user?.role)) {
    toast.error('Access denied');
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
