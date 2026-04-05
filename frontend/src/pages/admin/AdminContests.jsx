import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getContests, deleteContest } from '../../api/contestApi';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatDate } from '../../utils/formatTime';

export default function AdminContests() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-contests'],
    queryFn: () => getContests().then(r => r.data)
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteContest,
    onSuccess: () => qc.invalidateQueries(['admin-contests'])
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Contests</h1>
          <Link to="/admin/contests/new" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">
            + New Contest
          </Link>
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Start</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.contests?.map(c => (
                <tr key={c._id} className="border-b border-gray-800">
                  <td className="py-3">{c.title}</td>
                  <td className="py-3 text-gray-400">{formatDate(c.startTime)}</td>
                  <td className="py-3 text-gray-400">{c.type}</td>
                  <td className="py-3 flex gap-3">
                    <Link to={`/admin/contests/${c._id}/edit`} className="text-blue-400 hover:underline">Edit</Link>
                    <button onClick={() => remove(c._id)} className="text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
