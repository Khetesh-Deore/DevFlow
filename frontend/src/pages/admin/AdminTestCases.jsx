import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosConfig';
import { getTestCases, addTestCase, updateTestCase, deleteTestCase } from '../../api/problemApi';
import DifficultyBadge from '../../components/Problem/DifficultyBadge';

const taClass = 'w-full bg-gray-800 text-white text-sm font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-y';
const inputClass = 'w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500';

const EMPTY_FORM = { input: '', expectedOutput: '', explanation: '', isSample: false, order: 0 };

function TestCaseCard({ tc, problemId, onDelete }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ input: tc.input, expectedOutput: tc.expectedOutput, explanation: tc.explanation || '', order: tc.order });

  const { mutate: doUpdate, isLoading } = useMutation({
    mutationFn: () => updateTestCase(problemId, tc._id, form),
    onSuccess: () => { toast.success('Updated'); setEditing(false); qc.invalidateQueries(['testcases', problemId]); },
    onError: (e) => toast.error(e.message)
  });

  const truncate = (str, n = 80) => str?.length > n ? str.slice(0, n) + '...' : str;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">#{tc.order}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tc.isSample ? 'bg-green-400/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
            {tc.isSample ? 'Sample' : 'Hidden'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <button onClick={() => setEditing(true)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg">
              <Edit2 size={13} />
            </button>
          )}
          <button onClick={() => onDelete(tc._id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg">
            <Trash2 size={13} />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Input</p>
              <pre className="bg-gray-800 rounded p-2 text-gray-300 whitespace-pre-wrap">
                {expanded ? tc.input : truncate(tc.input)}
              </pre>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Expected Output</p>
              <pre className="bg-gray-800 rounded p-2 text-gray-300 whitespace-pre-wrap">
                {expanded ? tc.expectedOutput : truncate(tc.expectedOutput)}
              </pre>
            </div>
          </div>
          {tc.explanation && expanded && (
            <p className="text-xs text-gray-400 mt-2">{tc.explanation}</p>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Input</label>
              <textarea rows={4} value={form.input} onChange={e => setForm(f => ({ ...f, input: e.target.value }))} className={taClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Expected Output</label>
              <textarea rows={4} value={form.expectedOutput} onChange={e => setForm(f => ({ ...f, expectedOutput: e.target.value }))} className={taClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Explanation</label>
            <input value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
              className={`${inputClass} w-24`} placeholder="Order" />
            <button onClick={() => doUpdate()} disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg">
              <Check size={12} /> Save
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTestCases() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState('sample');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: problemData } = useQuery({
    queryKey: ['admin-problem', id],
    queryFn: () => api.get(`/problems/admin/${id}`).then(r => r.data)
  });

  const { data: tcData, isLoading } = useQuery({
    queryKey: ['testcases', id],
    queryFn: () => getTestCases(id)
  });

  const { mutate: doAdd, isLoading: adding } = useMutation({
    mutationFn: () => addTestCase(id, form),
    onSuccess: () => {
      toast.success('Test case added');
      setForm(EMPTY_FORM);
      qc.invalidateQueries(['testcases', id]);
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message)
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (tcId) => deleteTestCase(id, tcId),
    onSuccess: () => { toast.success('Deleted'); setDeleteTarget(null); qc.invalidateQueries(['testcases', id]); },
    onError: (e) => toast.error(e.message)
  });

  const problem = problemData?.data;
  const allTc = tcData?.data || [];
  const sampleTc = allTc.filter(t => t.isSample);
  const hiddenTc = allTc.filter(t => !t.isSample);
  const displayed = tab === 'sample' ? sampleTc : hiddenTc;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/problems" className="text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{problem?.title || 'Test Cases'}</h1>
              {problem && <DifficultyBadge difficulty={problem.difficulty} />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {sampleTc.length} sample, {hiddenTc.length} hidden = {allTc.length} total
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left — Add Form */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-20">
              <h2 className="text-sm font-semibold mb-4">Add Test Case</h2>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Input *</label>
                  <textarea rows={4} value={form.input}
                    onChange={e => setForm(f => ({ ...f, input: e.target.value }))}
                    placeholder="Test input..." className={taClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Expected Output *</label>
                  <textarea rows={4} value={form.expectedOutput}
                    onChange={e => setForm(f => ({ ...f, expectedOutput: e.target.value }))}
                    placeholder="Expected output..." className={taClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Explanation (optional)</label>
                  <textarea rows={2} value={form.explanation}
                    onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                    className={taClass} />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Order</label>
                    <input type="number" value={form.order}
                      onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                      className={`${inputClass} w-20`} />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="isSample" checked={form.isSample}
                      onChange={e => setForm(f => ({ ...f, isSample: e.target.checked }))}
                      className="accent-blue-500" />
                    <label htmlFor="isSample" className="text-xs text-gray-400">Sample (visible to users)</label>
                  </div>
                </div>
                <button onClick={() => doAdd()} disabled={adding || !form.input || !form.expectedOutput}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg transition-colors">
                  <Plus size={14} /> {adding ? 'Adding...' : 'Add Test Case'}
                </button>
              </div>
            </div>
          </div>

          {/* Right — List */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
              {[['sample', `Sample (${sampleTc.length})`], ['hidden', `Hidden (${hiddenTc.length})`]].map(([val, label]) => (
                <button key={val} onClick={() => setTab(val)}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No {tab} test cases yet
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayed.map(tc => (
                  <TestCaseCard key={tc._id} tc={tc} problemId={id} onDelete={setDeleteTarget} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Delete Test Case</h3>
            <p className="text-sm text-gray-400 mb-5">Are you sure you want to delete this test case?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
              <button onClick={() => doDelete(deleteTarget)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
