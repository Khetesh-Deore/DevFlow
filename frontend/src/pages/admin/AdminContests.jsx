import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Edit2, Trash2, Plus } from 'lucide-react';
import { deleteContest, toggleContestPublish } from '../../api/contestApi';
import { getAdminStats } from '../../api/adminApi';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatTime';

export default function AdminContests() {
  const qc = useQueryClient();

  // Use admin endpoint to get ALL contests (published + draft)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-contests'],
    queryFn: () => api.get('/contests?status=all').then(r => r.data)
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteContest,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['admin-all-contests']); },
    onError: e => toast.error(e.message)
  });

  const { mutate: doToggle } = useMutation({
    mutationFn: toggleContestPublish,
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-all-contests']); },
    onError: e => toast.error(e.message)
  });

  const contests = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Contests</h1>
          <Link to="/admin/contests/new"
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={14} /> New Contest
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No contests yet</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Start</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map(c => (
                  <tr key={c._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {c.startTime ? formatDate(c.startTime) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell capitalize">{c.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${c.isPublished ? 'text-green-400' : 'text-gray-500'}`}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/contests/${c._id}/edit`}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Edit">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => doToggle(c._id)}
                          className={`p-1.5 rounded-lg ${c.isPublished ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                          title={c.isPublished ? 'Unpublish' : 'Publish'}>
                          {c.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => remove(c._id)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
