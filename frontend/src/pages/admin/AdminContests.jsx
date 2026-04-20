import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Edit2, Trash2, Plus, Download, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { deleteContest, toggleContestPublish, getContestReport } from '../../api/contestApi';
import { generateContestPDF } from '../../utils/generateContestReport';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatTime';

// Compute contest time status from start/end times
const getTimeStatus = (c) => {
  const now = Date.now();
  if (now < new Date(c.startTime)) return 'upcoming';
  if (now < new Date(c.endTime)) return 'live';
  return 'ended';
};

const TIME_STATUS_STYLE = {
  upcoming: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  live:     'text-green-400 bg-green-400/10 border-green-400/20',
  ended:    'text-gray-500 bg-gray-800 border-gray-700',
};

export default function AdminContests() {
  const qc = useQueryClient();
  const [generatingReport, setGeneratingReport] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const handleDownloadReport = async (slug, title) => {
    setGeneratingReport(slug);
    try {
      const res = await getContestReport(slug);
      generateContestPDF(res.data);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-contests'],
    queryFn: () => api.get('/contests').then(r => r.data),
    refetchOnWindowFocus: true,
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteContest,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['admin-all-contests']); },
    onError: e => toast.error(e.message)
  });

  const { mutate: doToggle } = useMutation({
    mutationFn: async (id) => {
      setTogglingId(id);
      return toggleContestPublish(id);
    },
    onSuccess: (res) => {
      const updated = res.data;
      const label = updated.isPublished ? 'Published' : 'Draft';
      toast.success(`Contest set to ${label}`);
      // Fix: use string comparison for _id
      qc.setQueryData(['admin-all-contests'], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(c =>
            c._id.toString() === updated._id.toString()
              ? { ...c, isPublished: updated.isPublished }
              : c
          )
        };
      });
    },
    onError: (e) => {
      console.error('Toggle error:', e.response?.data || e.message);
      toast.error(e.response?.data?.error || e.message || 'Failed to update');
      qc.invalidateQueries(['admin-all-contests']);
    },
    onSettled: () => setTogglingId(null),
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
                  <th className="text-left px-4 py-3">Publish</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map(c => {
                  const timeStatus = getTimeStatus(c);
                  const isToggling = togglingId === c._id;
                  return (
                    <tr key={c._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium">{c.title}</td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                        {c.startTime ? formatDate(c.startTime) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell capitalize">{c.type}</td>

                      {/* Time Status: Upcoming / Live / Ended */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${TIME_STATUS_STYLE[timeStatus]}`}>
                          {timeStatus === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse align-middle" />}
                          {timeStatus}
                        </span>
                      </td>

                      {/* Publish toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => doToggle(c._id)}
                          disabled={isToggling}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                            c.isPublished
                              ? 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/20'
                              : 'text-gray-500 bg-gray-800 border-gray-700 hover:bg-green-400/10 hover:text-green-400 hover:border-green-400/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={c.isPublished ? 'Click to unpublish' : 'Click to publish'}
                        >
                          {isToggling ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : c.isPublished ? (
                            <CheckCircle size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {c.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/contests/${c._id}/edit`}
                            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Edit">
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDownloadReport(c.slug, c.title)}
                            disabled={generatingReport === c.slug}
                            className="p-1.5 text-purple-400 hover:bg-purple-400/10 rounded-lg disabled:opacity-50"
                            title="Download PDF Report">
                            {generatingReport === c.slug
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Download size={14} />}
                          </button>
                          <button onClick={() => remove(c._id)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
