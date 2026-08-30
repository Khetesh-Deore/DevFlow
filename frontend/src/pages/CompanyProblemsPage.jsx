import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ArrowLeft, ExternalLink, ChevronRight, Loader2, X, Filter } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const GITHUB_BASE = 'https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main';
const GITHUB_API  = 'https://api.github.com/repos/liquidslr/leetcode-company-wise-problems/contents';

const TIMEFRAMES = [
  { key: '1', label: '30 Days',        file: '1. Thirty Days.csv' },
  { key: '2', label: '3 Months',       file: '2. Three Months.csv' },
  { key: '3', label: '6 Months',       file: '3. Six Months.csv' },
  { key: '4', label: 'More Than 6M',   file: '4. More Than Six Months.csv' },
  { key: '5', label: 'All Time',       file: '5. All.csv' },
];

const DIFF_STYLE = {
  EASY:   'bg-green-400/10 text-green-400',
  MEDIUM: 'bg-yellow-400/10 text-yellow-400',
  HARD:   'bg-red-400/10 text-red-400',
};

// LeetCode SVG icon
const LeetCodeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

// ── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  // skip header
  return lines.slice(1).map(line => {
    // Handle quoted fields (topics field has commas)
    const match = line.match(/^([^,]+),([^,]+),([\d.]+),([\d.]+),(https?:\/\/[^,]+),"?([^"]*)"?$/);
    if (!match) {
      // fallback simple split
      const parts = line.split(',');
      return {
        difficulty: parts[0]?.trim(),
        title: parts[1]?.trim(),
        frequency: parseFloat(parts[2]) || 0,
        acceptance: parseFloat(parts[3]) || 0,
        link: parts[4]?.trim(),
        topics: parts.slice(5).join(',').replace(/^"|"$/g, '').trim(),
      };
    }
    return {
      difficulty: match[1].trim(),
      title: match[2].trim(),
      frequency: parseFloat(match[3]),
      acceptance: parseFloat(match[4]),
      link: match[5].trim(),
      topics: match[6].trim(),
    };
  }).filter(p => p.title && p.link);
}

// ── Company Grid View ────────────────────────────────────────────────────────
function CompanyCard({ name, onClick }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-green-500 to-green-700',
    'from-orange-500 to-orange-700',
    'from-pink-500 to-pink-700',
    'from-cyan-500 to-cyan-700',
    'from-yellow-500 to-yellow-700',
    'from-red-500 to-red-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:bg-gray-800/50 text-left w-full"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
        {initials}
      </div>
      <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate flex-1">{name}</span>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-blue-400 shrink-0 transition-colors" />
    </button>
  );
}

// ── Problem Table ─────────────────────────────────────────────────────────────
function ProblemTable({ problems, isLoading }) {
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const filtered = problems.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.topics.toLowerCase().includes(search.toLowerCase());
    const matchDiff = !diffFilter || p.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="text-blue-400 animate-spin" size={28} />
    </div>
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems or topics..."
            className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {['', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                diffFilter === d
                  ? d === 'EASY' ? 'bg-green-600 text-white'
                    : d === 'MEDIUM' ? 'bg-yellow-600 text-white'
                    : d === 'HARD' ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} problems</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-4 py-3 w-24">Difficulty</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Topics</th>
              <th className="text-center px-4 py-3 w-20 hidden md:table-cell">Freq</th>
              <th className="text-center px-4 py-3 w-16">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">No problems found</td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFF_STYLE[p.difficulty] || 'bg-gray-700 text-gray-400'}`}>
                      {p.difficulty?.charAt(0) + p.difficulty?.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{p.title}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.topics.split(',').slice(0, 3).map(t => (
                        <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(p.frequency, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5 block">{p.frequency?.toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-lg transition-colors"
                      title={`Open on LeetCode: ${p.title}`}
                    >
                      <LeetCodeIcon size={16} />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CompanyProblemsPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [timeframe, setTimeframe] = useState('5');
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Fetch company list from GitHub API
  useEffect(() => {
    setLoadingCompanies(true);
    fetch(GITHUB_API)
      .then(r => r.json())
      .then(data => {
        const dirs = data.filter(item => item.type === 'dir');
        setCompanies(dirs.map(d => d.name));
        setLoadingCompanies(false);
      })
      .catch(() => setLoadingCompanies(false));
  }, []);

  // Fetch problems when company or timeframe changes
  const fetchProblems = useCallback(async (company, tf) => {
    const frame = TIMEFRAMES.find(t => t.key === tf);
    if (!company || !frame) return;

    setLoadingProblems(true);
    setProblems([]);

    const url = `${GITHUB_BASE}/${encodeURIComponent(company)}/${encodeURIComponent(frame.file)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Not found');
      const text = await res.text();
      setProblems(parseCSV(text));
    } catch {
      // Try fallback to "5. All.csv" if specific timeframe not available
      try {
        const fallback = `${GITHUB_BASE}/${encodeURIComponent(company)}/5.%20All.csv`;
        const res2 = await fetch(fallback);
        const text2 = await res2.text();
        setProblems(parseCSV(text2));
      } catch {
        setProblems([]);
      }
    }
    setLoadingProblems(false);
  }, []);

  useEffect(() => {
    if (selectedCompany) fetchProblems(selectedCompany, timeframe);
  }, [selectedCompany, timeframe, fetchProblems]);

  const filteredCompanies = companies.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // ── Company Detail View ───────────────────────────────────────────────────
  if (selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setSelectedCompany(null); setProblems([]); }}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shrink-0"
              title="Back to companies"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" />
                <h1 className="text-xl font-bold">{selectedCompany}</h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Company-wise LeetCode problems</p>
            </div>
          </div>

          {/* Timeframe tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.key}
                onClick={() => setTimeframe(tf.key)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  timeframe === tf.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <ProblemTable problems={problems} isLoading={loadingProblems} />
        </div>
      </div>
    );
  }

  // ── Company List View ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 size={22} className="text-blue-400" />
              Company Problems
            </h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-6 ml-12">
        
        </p>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company..."
            className="w-full bg-gray-800 text-white text-sm pl-8 pr-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Stats */}
        {!loadingCompanies && (
          <p className="text-xs text-gray-500 mb-4">{filteredCompanies.length} companies</p>
        )}

        {/* Company Grid */}
        {loadingCompanies ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-blue-400 animate-spin" size={28} />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No companies found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCompanies.map(company => (
              <CompanyCard
                key={company}
                name={company}
                onClick={() => setSelectedCompany(company)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
