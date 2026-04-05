import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, TestTube2, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { getAdminProblems, getAdminStats } from '../../api/adminApi';
import { deleteProblem, togglePublish } from '../../api/problemApi';
import toast from 'react-hot-toast';

const diffBg = {
  Easy: 'bg-green-400/10 text-green-400',
  Medium: 'bg-yellow-400/10 text-yellow-400',
  Hard: 'bg-red-400/10 text-red-400'
};

function DeleteModal({ problem, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-2">Delete Problem</h3>
        <p className="text-sm text-gray-400 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">"{problem.title}"</span>?
          This will also delete all test cases.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProblems() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = {
    ...(search && { search }),
    ...(difficulty && { difficulty }),
    ...(status && { status }),
    page,
    limit: 20
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-problems', filters],
    queryFn: () => getAdminProblems(filters)
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id) => deleteProblem(id),
    onSuccess: () => {
      toast.success('Problem deleted');
      setDeleteTarget(null);
      qc.invalidateQueries(['admin-problems']);
      qc.invalidateQueries(['admin-stats']);
    },
    onError: (err) => toast.error(err.message)
  });

  const { mutate: doToggle } = useMutation({
    mutationFn: (id) => togglePublish(id),
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries(['admin-problems']);
    },
    onError: (err) => toast.error(err.message)
  });

  const stats = statsData?.data;
  const problems = data?.data || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Problems</h1>
          <Link to="/admin/problems/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Plus size={16} /> Create Problem
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.totalProblems },
              { label: 'Published', value: stats.publishedProblems, color: 'text-green-400' },
              { label: 'Drafts', value: stats.draftProblems, color: 'text-gray-400' },
              { label: 'Easy', value: stats.easyProblems, color: 'text-green-400' },
              { label: 'Medium', value: stats.mediumProblems, color: 'text-yellow-400' },
              { label: 'Hard', value: stats.hardProblems, color: 'text-red-400' }
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search problems..."
              className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Difficulties</option>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {(search || difficulty || status) && (
            <button onClick={() => { setSearch(''); setDifficulty(''); setStatus(''); setPage(1); }}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-800 bg-gray-900">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 w-24">Difficulty</th>
                <th className="text-left px-4 py-3 w-24">Status</th>
                <th className="text-left px-4 py-3 w-24 hidden sm:table-cell">Acceptance</th>
                <th className="text-left px-4 py-3 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">No problems found</td>
                </tr>
              ) : (
                problems.map(p => (
                  <tr key={p._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${diffBg[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${p.isPublished ? 'text-green-400' : 'text-gray-500'}`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {p.acceptanceRate?.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/problems/${p._id}/edit`}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </Link>
                        <Link to={`/admin/problems/${p._id}/testcases`}
                          className="p-1.5 text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors" title="Test Cases">
                          <TestTube2 size={14} />
                        </Link>
                        <button onClick={() => doToggle(p._id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.isPublished
                              ? 'text-yellow-400 hover:bg-yellow-400/10'
                              : 'text-green-400 hover:bg-green-400/10'
                          }`} title={p.isPublished ? 'Unpublish' : 'Publish'}>
                          {p.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg ${page === n ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          problem={deleteTarget}
          onConfirm={() => doDelete(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
