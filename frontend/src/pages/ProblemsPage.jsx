import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, MinusCircle, Filter, X } from 'lucide-react';
import { getProblems, getTags } from '../api/problemApi';
import { ProblemListSkeleton } from '../components/Common/LoadingSkeleton';
import useAuthStore from '../store/authStore';
import SEO from '../components/Common/SEO';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const diffColor = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400'
};

const diffBg = {
  Easy: 'bg-green-400/10 text-green-400',
  Medium: 'bg-yellow-400/10 text-yellow-400',
  Hard: 'bg-red-400/10 text-red-400'
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProblemsPage() {
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    ...(difficulty && { difficulty }),
    ...(selectedTags.length && { tags: selectedTags.join(',') }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 20
  };

  const { data, isLoading } = useQuery({
    queryKey: ['problems', filters],
    queryFn: () => getProblems(filters),
    keepPreviousData: true
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: Infinity
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setDifficulty('');
    setSelectedTags([]);
    setSearch('');
    setPage(1);
  };

  const problems = data?.data || [];
  const totalPages = data?.pages || 1;

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Search</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search problems..."
            className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Difficulty</label>
        <div className="flex flex-col gap-1.5">
          {['', ...DIFFICULTIES].map(d => (
            <button key={d || 'all'} onClick={() => { setDifficulty(d); setPage(1); }}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                difficulty === d
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tagsData?.data?.length > 0 && (
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {tagsData.data.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear */}
      {(difficulty || selectedTags.length || search) && (
        <button onClick={clearFilters}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300">
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEO 
        title="Programming Problems - Practice Coding Challenges"
        description="Solve hundreds of programming problems and coding challenges. Practice algorithms, data structures, and competitive programming with instant feedback."
        keywords="programming problems, coding challenges, algorithms, data structures, competitive programming practice, coding exercises"
        url="https://devflow26.vercel.app/problems"
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Problems</h1>
          <button onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 text-sm bg-gray-800 px-3 py-2 rounded-lg">
            <Filter size={14} /> Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden md:block w-56 shrink-0">
            <FilterPanel />
          </aside>

          {/* Table */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <ProblemListSkeleton />
            ) : problems.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No problems found</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                      <th className="text-left py-3 w-10">#</th>
                      <th className="text-left py-3">Title</th>
                      <th className="text-left py-3 w-24">Difficulty</th>
                      <th className="text-left py-3 w-24 hidden sm:table-cell">Acceptance</th>
                      <th className="text-left py-3 hidden lg:table-cell">Tags</th>
                      {isAuthenticated && <th className="text-left py-3 w-10">Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p, i) => (
                      <tr key={p._id} className="border-b border-gray-800/50 hover:bg-gray-900 transition-colors">
                        <td className="py-3 text-gray-500">{(page - 1) * 20 + i + 1}</td>
                        <td className="py-3">
                          <Link to={`/problems/${p.slug}`}
                            className="hover:text-blue-400 transition-colors font-medium">
                            {p.title}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diffBg[p.difficulty]}`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 hidden sm:table-cell">
                          {p.acceptanceRate?.toFixed(1)}%
                        </td>
                        <td className="py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {p.tags?.slice(0, 3).map(tag => (
                              <span key={tag}
                                className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {p.tags?.length > 3 && (
                              <span className="text-xs text-gray-500">+{p.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        {isAuthenticated && (
                          <td className="py-3">
                            {p.isSolved
                              ? <CheckCircle2 size={16} className="text-green-400" />
                              : p.isAttempted
                              ? <MinusCircle size={16} className="text-yellow-400" />
                              : null}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
                      Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          page === n ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
                        }`}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:hidden">
          <div className="bg-gray-900 w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)}><X size={20} /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-6 bg-blue-600 py-2.5 rounded-lg text-sm font-medium">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
