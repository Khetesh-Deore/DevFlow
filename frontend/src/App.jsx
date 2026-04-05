import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Layout/Navbar';
import { ProtectedRoute, AdminRoute } from './components/Layout/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import ContestsPage from './pages/ContestsPage';
import ContestDetailPage from './pages/ContestDetailPage';
import ContestProblemPage from './pages/ContestProblemPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProblems from './pages/admin/AdminProblems';
import AdminProblemForm from './pages/admin/AdminProblemForm';
// AdminProblemForm handles both /new and /:id/edit
import AdminContests from './pages/admin/AdminContests';
import AdminContestForm from './pages/admin/AdminContestForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTestCases from './pages/admin/AdminTestCases';

const Placeholder = ({ name }) => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <p className="text-gray-400">Coming Soon: {name}</p>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <p className="text-gray-400">404 — Page not found</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>

          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<Placeholder name="ForgotPassword" />} />
          <Route path="/reset-password/:token" element={<Placeholder name="ResetPassword" />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
            <Route path="/contests" element={<ContestsPage />} />
            <Route path="/contests/:slug" element={<ContestDetailPage />} />
            <Route path="/contests/:contestSlug/problems/:problemSlug" element={<ContestProblemPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/problems" element={<AdminProblems />} />
            <Route path="/admin/problems/new" element={<AdminProblemForm />} />
            <Route path="/admin/problems/:id/edit" element={<AdminProblemForm />} />
            <Route path="/admin/problems/:id/testcases" element={<AdminTestCases />} />
            <Route path="/admin/contests" element={<AdminContests />} />
            <Route path="/admin/contests/new" element={<AdminContestForm />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' }
        }}
      />
    </QueryClientProvider>
  );
}
