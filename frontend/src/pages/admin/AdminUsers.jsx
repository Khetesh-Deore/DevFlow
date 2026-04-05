import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, ExternalLink, ShieldCheck, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axiosConfig';
import useAuthStore from '../../store/authStore';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other'];
const BATCHES = ['2024-2028', '2023-2027', '2022-2026', '2021-2025', '2020-2024'];

const ROLE_STYLES = {
  superadmin: 'bg-red-400/10 text-red-400',
  admin: 'bg-yellow-400/10 text-yellow-400',
  student: 'bg-gray-700 text-gray-400'
};

function RoleModal({ user, onClose, onConfirm }) {
  const [role, setRole] = useState(user.role === 'admin' ? 'student' : 'admin');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-white mb-1">Change Role</h3>
        <p className="text-sm text-gray-400 mb-4">Update role for <span className="text-white">{user.name}</span></p>
        <select value={role} onChange={e => setRole(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none mb-5">
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={() => onConfirm(user._id, role)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const qc = useQueryClient();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [roleTarget, setRoleTarget] = useState(null);

  const params = {
    ...(search && { search }),
    ...(batch && { batch }),
    ...(branch && { branch }),
    ...(role && { role }),
    page,
    limit: 20
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get('/users', { params }).then(r => r.data),
    keepPreviousData: true
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ id, newRole }) => api.patch(`/users/${id}/role`, { role: newRole }),
    onSuccess: () => {
      toast.success('Role updated');
      setRoleTarget(null);
      qc.invalidateQueries(['admin-users']);
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message)
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Download size={14} /> Export JSON
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, roll no..."
              className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={batch} onChange={e => { setBatch(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Batches</option>
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
          {(search || batch || branch || role) && (
            <button onClick={() => { setSearch(''); setBatch(''); setBranch(''); setRole(''); setPage(1); }}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3">Roll No</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Branch</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Batch</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-center px-4 py-3">Solved</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-400">{u.rollNumber}</td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{u.branch}</td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{u.batch}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[u.role] || ROLE_STYLES.student}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{u.stats?.totalSolved || 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${u.rollNumber}`}
                            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Profile">
                            <ExternalLink size={13} />
                          </Link>
                          {isSuperAdmin && u.role !== 'superadmin' && (
                            <button onClick={() => setRoleTarget(u)}
                              className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="Change Role">
                              <ShieldCheck size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg ${page === n ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">Next</button>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {roleTarget && (
        <RoleModal
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onConfirm={(id, newRole) => changeRole({ id, newRole })}
        />
      )}
    </div>
  );
}
