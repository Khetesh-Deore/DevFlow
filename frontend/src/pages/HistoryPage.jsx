import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Code2, CheckCircle2, XCircle, Filter, X } from 'lucide-react';
import { getSubmissionHistory } from '../api/submissionApi';

const VERDICT_STYLES = {
  accepted:             { color: 'text-green-400', bg: 'bg-green-400/10', icon: <CheckCircle2 size={13} /> },
  wrong_answer:         { color: 'text-red-400',   bg: 'bg-red-400/10',   icon: <XCircle size={13} /> },
  time_limit_exceeded:  { color: 'text-orange-400',bg: 'bg-orange-400/10',icon: <Clock size={13} /> },
  runtime_error:        { color: 'text-red-400',   bg: 'bg-red-400/10',   icon: <XCircle size={13} /> },
  compilation_error:    { color: 'text-purple-400',bg: 'bg-purple-400/10',icon: <XCircle size={13} /> },
  pending:              { color: 'text-gray-400',  bg: 'bg-gray-700',     icon: null },
  running:              { color: 'text-blue-400',  bg: 'bg-blue-400/10',  icon: null }
};

const LANG_COLORS = {
  python: 'text-blue-400', cpp: 'text-purple-400', c: 'text-yellow-400',
  java: 'text-orange-400', javascript: 'text-green-400'
};

const DIFF_COLORS = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

function VerdictBadge({ status }) {
  const s = VERDICT_STYLES[status] || VERDICT_STYLES.pending;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color} ${s.bg}`}>
      {s.icon} {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function HistoryPage() {
  const [filters, setFilters] = useState({ status: '', language: '', page: 1 });
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['submission-history', filters],
    queryFn: () => getSubmissionHistory(filters),
    keepPreviousData: true
  });

  const submissions = data?.data || [];
  const totalPages = data?.pages || 1;

  const clearFilters = () => setFilters({ status: '', language: '', page: 1 });

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Clock className="text-blue-400" size={22} />
          <h1 className="text-2xl font-bold">Submission History</h1>
          {data?.total !== undefined && (
            <span className="text-sm text-gray-500 ml-auto">{data.total} total submissions</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Verdicts</option>
            <option value="accepted">Accepted</option>
            <option value="wrong_answer">Wrong Answer</option>
            <option value="time_limit_exceeded">Time Limit Exceeded</option>
            <option value="runtime_error">Runtime Error</option>
            <option value="compilation_error">Compilation Error</option>
          </select>
          <select value={filters.language}
            onChange={e => setFilters(f => ({ ...f, language: e.target.value, page: 1 }))}
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none">
            <option value="">All Languages</option>
            {['python', 'cpp', 'c', 'java', 'javascript'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {(filters.status || filters.language) && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-gray-800 animate-pulse bg-gray-800/30" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p>No submissions yet</p>
            </div>
          ) : (
            <div>
              {submissions.map(s => (
                <div key={s._id}>
                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                  >
                    {/* Verdict */}
                    <div className="w-40 shrink-0">
                      <VerdictBadge status={s.status} />
                    </div>

                    {/* Problem */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/problems/${s.problemId?.slug}`}
                        onClick={e => e.stopPropagation()}
                        className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate block"
                      >
                        {s.problemId?.title || 'Unknown Problem'}
                      </Link>
                      {s.problemId?.difficulty && (
                        <span className={`text-xs ${DIFF_COLORS[s.problemId.difficulty]}`}>
                          {s.problemId.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Language */}
                    <div className="hidden sm:block w-24 shrink-0">
                      <span className={`text-xs font-medium capitalize ${LANG_COLORS[s.language] || 'text-gray-400'}`}>
                        {s.language}
                      </span>
                    </div>

                    {/* Test cases */}
                    <div className="hidden md:block w-20 shrink-0 text-xs text-gray-400">
                      {s.passedTestCases}/{s.totalTestCases} tests
                    </div>

                    {/* Runtime */}
                    <div className="hidden md:block w-20 shrink-0 text-xs text-gray-400">
                      {s.timeTakenMs > 0 ? `${s.timeTakenMs}ms` : '—'}
                    </div>

                    {/* Time */}
                    <div className="w-28 shrink-0 text-xs text-gray-500 text-right">
                      {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Expanded Code View */}
                  {expandedId === s._id && (
                    <div className="bg-gray-950 border-b border-gray-800 px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Code2 size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-400 capitalize">{s.language}</span>
                          <VerdictBadge status={s.status} />
                        </div>
                        <span className="text-xs text-gray-600">
                          {new Date(s.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Code */}
                      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
                        {s.code}
                      </pre>

                      {/* Compile error */}
                      {s.compileError && (
                        <div className="mt-3">
                          <p className="text-xs text-red-400 mb-1">Compiler Output:</p>
                          <pre className="bg-gray-900 border border-red-900 rounded-lg p-3 text-xs font-mono text-red-300 overflow-x-auto">
                            {s.compileError}
                          </pre>
                        </div>
                      )}

                      {/* Test case results */}
                      {s.testCaseResults?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-2">Test Cases:</p>
                          <div className="flex flex-wrap gap-2">
                            {s.testCaseResults.map((tc, i) => {
                              const st = VERDICT_STYLES[tc.status] || VERDICT_STYLES.pending;
                              return (
                                <div key={i}
                                  className={`text-xs px-2.5 py-1 rounded-lg border ${st.color} ${st.bg} border-current/20`}>
                                  TC{i + 1}: {tc.status?.replace(/_/g, ' ')}
                                  {tc.timeTakenMs > 0 && ` · ${tc.timeTakenMs}ms`}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
              disabled={filters.page === 1}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setFilters(f => ({ ...f, page: n }))}
                className={`px-3 py-1.5 text-sm rounded-lg ${filters.page === n ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, f.page + 1) }))}
              disabled={filters.page === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
