import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Search, Building2, ArrowLeft, ExternalLink, ChevronRight, Loader2, X } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const GITHUB_BASE = 'https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main';
const GITHUB_API  = 'https://api.github.com/repos/liquidslr/leetcode-company-wise-problems/contents';

const TIMEFRAMES = [
  { key: '1', label: '30 Days',       file: '1. Thirty Days.csv' },
  { key: '2', label: '3 Months',      file: '2. Three Months.csv' },
  { key: '3', label: '6 Months',      file: '3. Six Months.csv' },
  { key: '4', label: 'More Than 6M',  file: '4. More Than Six Months.csv' },
  { key: '5', label: 'All Time',      file: '5. All.csv' },
];

const DIFF_STYLE = {
  EASY:   'bg-green-400/10 text-green-400',
  MEDIUM: 'bg-yellow-400/10 text-yellow-400',
  HARD:   'bg-red-400/10 text-red-400',
};

const HOT_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Adobe', 'Flipkart', 'Goldman Sachs', 'Bloomberg', 'Uber', 'Apple'];

// ── LeetCode Icon ─────────────────────────────────────────────────────────────
const LeetCodeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const match = line.match(/^([^,]+),([^,]+),([\d.]+),([\d.]+),(https?:\/\/[^,]+),"?([^"]*)"?$/);
    if (!match) {
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

// ── Company Card ──────────────────────────────────────────────────────────────
function CompanyCard({ name, onClick }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-blue-500 to-blue-700', 'from-purple-500 to-purple-700',
    'from-green-500 to-green-700', 'from-orange-500 to-orange-700',
    'from-pink-500 to-pink-700', 'from-cyan-500 to-cyan-700',
    'from-yellow-500 to-yellow-700', 'from-red-500 to-red-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <Link
      to={`/company-problems/${encodeURIComponent(name)}`}
      onClick={onClick}
      className="group flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:bg-gray-800/50 text-left w-full"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
        {initials}
      </div>
      <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate flex-1">{name}</span>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-blue-400 shrink-0 transition-colors" />
    </Link>
  );
}

// ── Problem Table ─────────────────────────────────────────────────────────────
function ProblemTable({ problems, isLoading }) {
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const filtered = problems.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
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
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                diffFilter === d
                  ? d === 'EASY' ? 'bg-green-600 text-white'
                    : d === 'MEDIUM' ? 'bg-yellow-600 text-white'
                    : d === 'HARD' ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
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
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No problems found</td></tr>
            ) : filtered.map((p, i) => (
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
                      <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{t.trim()}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(p.frequency, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5 block">{p.frequency?.toFixed(0)}%</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-7 h-7 text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-lg transition-colors"
                    title={`Open on LeetCode: ${p.title}`}
                    aria-label={`Solve ${p.title} on LeetCode`}>
                    <LeetCodeIcon size={16} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CompanyProblemsPage() {
  const navigate = useNavigate();
  const { company: urlCompany } = useParams();   // from /company-problems/:company
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [search, setSearch] = useState('');

  // selectedCompany comes from URL param OR state click
  const [selectedCompany, setSelectedCompany] = useState(
    urlCompany ? decodeURIComponent(urlCompany) : null
  );
  const [timeframe, setTimeframe] = useState('5');
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Sync URL param → state when navigating directly to /company-problems/Google
  useEffect(() => {
    if (urlCompany) setSelectedCompany(decodeURIComponent(urlCompany));
  }, [urlCompany]);

  useEffect(() => {
    fetch(GITHUB_API)
      .then(r => r.json())
      .then(data => {
        setCompanies(data.filter(i => i.type === 'dir').map(d => d.name));
        setLoadingCompanies(false);
      })
      .catch(() => setLoadingCompanies(false));
  }, []);

  const fetchProblems = useCallback(async (company, tf) => {
    const frame = TIMEFRAMES.find(t => t.key === tf);
    if (!company || !frame) return;
    setLoadingProblems(true);
    setProblems([]);
    try {
      const url = `${GITHUB_BASE}/${encodeURIComponent(company)}/${encodeURIComponent(frame.file)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setProblems(parseCSV(await res.text()));
    } catch {
      try {
        const res2 = await fetch(`${GITHUB_BASE}/${encodeURIComponent(company)}/5.%20All.csv`);
        setProblems(parseCSV(await res2.text()));
      } catch { setProblems([]); }
    }
    setLoadingProblems(false);
  }, []);

  useEffect(() => {
    if (selectedCompany) fetchProblems(selectedCompany, timeframe);
  }, [selectedCompany, timeframe, fetchProblems]);

  const filteredCompanies = companies.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  // ── Company Detail View ───────────────────────────────────────────────────
  if (selectedCompany) {
    return (
      <>
        <Helmet>
          <title>{selectedCompany} DSA Interview Questions | Company Wise LeetCode Problems | DevFlow</title>
          <meta name="description" content={`Browse all ${selectedCompany} DSA interview questions sorted by frequency. Practice ${selectedCompany} LeetCode problems asked in 30 days, 3 months, 6 months, and all time.`} />
          <meta name="keywords" content={`${selectedCompany} interview questions, ${selectedCompany} DSA problems, ${selectedCompany} LeetCode questions, ${selectedCompany} coding interview, ${selectedCompany} software engineer interview`} />
          <link rel="canonical" href={`https://devflow26.vercel.app/company-problems`} />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": `${selectedCompany} DSA Interview Questions`,
            "description": `Company-wise LeetCode problems asked by ${selectedCompany} in software engineering interviews, sorted by frequency.`,
            "url": "https://devflow26.vercel.app/company-problems",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devflow26.vercel.app" },
                { "@type": "ListItem", "position": 2, "name": "Company Problems", "item": "https://devflow26.vercel.app/company-problems" },
                { "@type": "ListItem", "position": 3, "name": `${selectedCompany}` }
              ]
            }
          })}</script>
        </Helmet>

        <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setSelectedCompany(null); setProblems([]); navigate('/company-problems'); }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shrink-0"
                title="Back to companies">
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-400" />
                  <h1 className="text-xl font-bold">{selectedCompany} Interview Questions</h1>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Company-wise DSA problems sorted by interview frequency
                </p>
              </div>
            </div>

            {/* Timeframe tabs */}
            <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
              {TIMEFRAMES.map(tf => (
                <button key={tf.key} onClick={() => setTimeframe(tf.key)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                    timeframe === tf.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {tf.label}
                </button>
              ))}
            </div>

            <ProblemTable problems={problems} isLoading={loadingProblems} />
          </div>
        </div>
      </>
    );
  }

  // ── Company List View ─────────────────────────────────────────────────────
  return (
    <>
      {/* ── FULL SEO / AEO / GEO HEAD ── */}
      <Helmet>
        <title>Company Wise DSA Interview Questions | Google Amazon Microsoft Meta | DevFlow</title>
        <meta name="description" content="Browse 100+ companies most asked DSA interview questions FREE. Google, Amazon, Microsoft, Meta, Adobe, Flipkart LeetCode problems sorted by frequency — 30 days, 3 months, 6 months, all time. Updated August 2025." />
        <meta name="keywords" content="company wise DSA questions, company wise leetcode problems, google interview questions DSA, amazon interview DSA questions, microsoft interview questions, meta interview problems, adobe interview questions DSA, flipkart interview questions, company wise coding problems, DSA questions by company, leetcode company tag problems, top tech company interview questions, software engineer interview preparation, coding interview questions 2025, FAANG interview questions, company wise problem list" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://devflow26.vercel.app/company-problems" />
        <meta name="author" content="DevFlow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Company Wise DSA Questions — Google, Amazon, Microsoft, Meta & 100+ Companies | DevFlow" />
        <meta property="og:description" content="Free company-wise DSA interview questions for Google, Amazon, Microsoft, Meta, Adobe and 100+ top tech companies. Sorted by frequency, difficulty and time period. Updated regularly." />
        <meta property="og:url" content="https://devflow26.vercel.app/company-problems" />
        <meta property="og:site_name" content="DevFlow" />
        <meta property="og:image" content="https://devflow26.vercel.app/og-image.png" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Company Wise DSA Questions | 100+ Companies | DevFlow" />
        <meta name="twitter:description" content="Google, Amazon, Microsoft, Meta interview DSA questions sorted by frequency. Free, updated regularly." />
        <meta name="twitter:image" content="https://devflow26.vercel.app/og-image.png" />

        {/* WebPage + ItemList Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Company Wise DSA Interview Questions",
          "description": "Browse 100+ top tech companies most asked DSA interview questions sorted by frequency and time period.",
          "url": "https://devflow26.vercel.app/company-problems",
          "inLanguage": "en",
          "dateModified": new Date().toISOString().split('T')[0],
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devflow26.vercel.app" },
              { "@type": "ListItem", "position": 2, "name": "Company Problems", "item": "https://devflow26.vercel.app/company-problems" }
            ]
          },
          "mainEntity": {
            "@type": "ItemList",
            "name": "Company Wise DSA Question Banks",
            "description": "LeetCode problems by company used in technical interviews at top tech firms",
            "numberOfItems": 100,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Google DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 2, "name": "Amazon DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 3, "name": "Microsoft DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 4, "name": "Meta DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 5, "name": "Adobe DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 6, "name": "Flipkart DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 7, "name": "Goldman Sachs DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" },
              { "@type": "ListItem", "position": 8, "name": "Bloomberg DSA Interview Questions", "url": "https://devflow26.vercel.app/company-problems" }
            ]
          }
        })}</script>

        {/* FAQ Schema (AEO — answers shown in Google AI Overviews & SGE) */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What are company wise DSA questions?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Company wise DSA questions are Data Structures and Algorithms problems that have been reported as asked by specific tech companies like Google, Amazon, Microsoft, and Meta in their software engineering technical interviews. These are sourced from LeetCode company tags and community interview reports."
              }
            },
            {
              "@type": "Question",
              "name": "Which companies ask the most DSA questions in software engineering interviews?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Google, Amazon, Microsoft, Meta (Facebook), Adobe, Flipkart, Goldman Sachs, Bloomberg, Uber, and Apple are the top companies that rely most heavily on DSA problems in their technical interviews. Google and Amazon are known for the most diverse problem sets."
              }
            },
            {
              "@type": "Question",
              "name": "How to prepare for Google DSA interview questions?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To prepare for Google DSA interviews, focus on problems tagged as Google on LeetCode, especially Arrays, Trees, Graphs, Dynamic Programming, and String manipulation. Use the 30 days or 3 months filter to see the most recently asked problems. Sort by frequency to prioritize the most common ones."
              }
            },
            {
              "@type": "Question",
              "name": "What is the difference between 30 days and all time company questions?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "30 days shows LeetCode problems reported by interview candidates in the last 30 days — these are the most current and relevant for active job seekers. All time shows every problem ever reported for that company. For active preparation, use 30 days or 3 months filters."
              }
            },
            {
              "@type": "Question",
              "name": "Are these company wise DSA questions free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all company wise DSA questions on DevFlow are completely free. The data is sourced from the open-source GitHub repository liquidslr/leetcode-company-wise-problems and includes 100+ top tech companies with problems sorted by frequency."
              }
            },
            {
              "@type": "Question",
              "name": "How often are company wise interview questions updated?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The company wise question database is updated regularly based on community reports from LeetCode. The source repository is updated every few weeks to reflect the latest interview rounds."
              }
            }
          ]
        })}</script>

        {/* Dataset Schema (GEO — helps AI models understand your data) */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "Company Wise LeetCode DSA Interview Questions",
          "description": "A curated dataset of Data Structures and Algorithms problems asked by 100+ top tech companies including Google, Amazon, Microsoft, Meta, and Adobe in their software engineering interviews. Includes problem title, difficulty, frequency score, acceptance rate, topics, and direct LeetCode links.",
          "url": "https://devflow26.vercel.app/company-problems",
          "keywords": ["DSA", "LeetCode", "Interview Questions", "Company Wise", "Google", "Amazon", "Microsoft"],
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "creator": { "@type": "Organization", "name": "DevFlow" },
          "distribution": {
            "@type": "DataDownload",
            "encodingFormat": "text/csv",
            "contentUrl": "https://github.com/liquidslr/leetcode-company-wise-problems"
          },
          "temporalCoverage": "2020/..",
          "variableMeasured": ["Difficulty", "Frequency", "Acceptance Rate", "Topics", "Company"]
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Go back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 size={22} className="text-blue-400" />
                Company Wise DSA Interview Questions
              </h1>
            </div>
          </div>

          {/* SEO-rich description — visible to users AND crawlers */}
          <div className="ml-12 mb-6">
            <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
              Browse <strong className="text-gray-300">company-wise DSA questions</strong> asked by{' '}
              <strong className="text-gray-300">Google, Amazon, Microsoft, Meta, Adobe</strong> and 100+ top tech companies.
              Filter by frequency and time period — <em>30 days, 3 months, 6 months, or all time</em> — to focus on the most relevant problems for your interview prep.
              Free, open-source, updated regularly. 
              {/* <a href="https://github.com/liquidslr/leetcode-company-wise-problems" target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1">
                liquidslr/leetcode-company-wise-problems <ExternalLink size={11} />
              </a>. */}
            </p>

            {/* Quick-access company chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {HOT_COMPANIES.map(c => (
                <button key={c} onClick={() => setSearch(c)}
                  className="text-xs bg-gray-800 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/50 text-gray-400 hover:text-blue-400 px-3 py-1 rounded-full transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company (e.g. Google, Amazon, Infosys...)"
              className="w-full bg-gray-800 text-white text-sm pl-8 pr-8 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              aria-label="Search company wise DSA interview questions"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {!loadingCompanies && (
            <p className="text-xs text-gray-500 mb-4">
              {filteredCompanies.length} companies — click any to see their DSA interview problems
            </p>
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
                <CompanyCard key={company} name={company} onClick={() => setSelectedCompany(company)} />
              ))}
            </div>
          )}

          {/* AEO FAQ Section — answers common user questions (boosts AI Overview appearance) */}
          <section className="mt-16 border-t border-gray-800 pt-10" aria-label="Frequently asked questions about company wise DSA questions">
            <h2 className="text-lg font-bold mb-2 text-gray-300">
              Company Wise DSA Questions — FAQ
            </h2>
            <p className="text-xs text-gray-500 mb-6">Everything you need to know about interview preparation using company-tagged DSA problems.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  q: 'What are company wise DSA questions?',
                  a: 'Company wise DSA questions are Data Structures and Algorithms problems tagged by specific tech companies on LeetCode, based on community interview reports. They help you focus preparation on problems most relevant to your target company.'
                },
                {
                  q: 'Which companies ask the most DSA questions?',
                  a: 'Google, Amazon, Microsoft, Meta (Facebook), Adobe, Flipkart, Goldman Sachs, and Bloomberg are the top companies for DSA-heavy interviews. Google and Amazon typically have the largest problem banks.'
                },
                {
                  q: 'Should I use 30 days or All Time filter?',
                  a: 'Use 30 days or 3 months for active interview prep — these reflect what is being asked in current rounds. All Time is great for comprehensive study when you have more time before your interview.'
                },
                {
                  q: 'How to crack Google DSA interviews?',
                  a: 'Focus on Arrays, Trees, Graphs, Dynamic Programming, and Strings. Use the 30-day filter for Google to see what is being asked right now. Sort by frequency and start with the highest-frequency problems first.'
                },
                {
                  q: 'Are these DSA questions free?',
                  a: 'Yes, completely free. All data is sourced from the open-source repository liquidslr/leetcode-company-wise-problems on GitHub, which is community-maintained and updated regularly.'
                },
                {
                  q: 'What does frequency mean in company wise questions?',
                  a: 'Frequency indicates how often a specific problem has been reported by candidates who interviewed at that company. Higher frequency (closer to 100%) means the problem has been asked very recently and frequently.'
                }
              ].map(({ q, a }) => (
                <article key={q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-2">{q}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                </article>
              ))}
            </div>
          </section>

          {/* GEO — AI-readable plain text summary at page bottom */}
          <section className="mt-10 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">About This Resource</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              DevFlow Company Wise DSA Questions is a free, comprehensive database of Data Structures and Algorithms problems
              asked by 100+ top technology companies including Google, Amazon, Microsoft, Meta, Adobe, Flipkart, Goldman Sachs,
              Bloomberg, Uber, Apple, Samsung, and many more. Problems are organized by company, sortable by time period
              (last 30 days, 3 months, 6 months, all time), difficulty (Easy, Medium, Hard), and interview frequency.
              Each problem links directly to LeetCode for practice. This resource is ideal for software engineers preparing
              for technical interviews at FAANG, MAANG, and other top-tier technology companies.
              The dataset is sourced from open community contributions and updated regularly to reflect the latest interview rounds.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
