import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, ChevronUp, ChevronDown, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosConfig';
import { createContest, updateContest } from '../../api/contestApi';
import { getAdminProblems } from '../../api/adminApi';
import DifficultyBadge from '../../components/Problem/DifficultyBadge';

const inputClass = 'w-full bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500';
const taClass = `${inputClass} resize-y`;

const INIT = {
  title: '', description: '', type: 'unrated', scoringType: 'points',
  penaltyMinutes: 20, startTime: '', endTime: '',
  registrationRequired: true, rules: '', isPublished: false
};

function SectionTitle({ children }) {
  return <h2 className="text-base font-semibold text-white mb-4 pb-2 border-b border-gray-800">{children}</h2>;
}

function computeDuration(start, end) {
  if (!start || !end) return null;
  const diff = new Date(end) - new Date(start);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h} hour${h > 1 ? 's' : ''}`;
  return `${h} hour${h > 1 ? 's' : ''} ${m} minutes`;
}

export default function AdminContestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INIT);
  const [problems, setProblems] = useState([]); // [{problemId, title, difficulty, points, label, order}]
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing contest
  const { data: contestData, isLoading: loadingContest } = useQuery({
    queryKey: ['admin-contest-edit', id],
    queryFn: () => api.get(`/contests/${id}`).then(r => r.data),
    enabled: isEdit
  });

  useEffect(() => {
    if (contestData?.data) {
      const c = contestData.data;
      setForm({
        title: c.title || '',
        description: c.description || '',
        type: c.type || 'unrated',
        scoringType: c.scoringType || 'points',
        penaltyMinutes: c.penaltyMinutes || 20,
        startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : '',
        endTime: c.endTime ? new Date(c.endTime).toISOString().slice(0, 16) : '',
        registrationRequired: c.registrationRequired ?? true,
        rules: c.rules || '',
        isPublished: c.isPublished || false
      });
      setProblems((c.problems || []).map((p, i) => ({
        problemId: p.problemId?._id || p.problemId,
        title: p.problemId?.title || '',
        difficulty: p.problemId?.difficulty || '',
        points: p.points || 100,
        label: p.label || String.fromCharCode(65 + i),
        order: p.order || i + 1
      })));
    }
  }, [contestData]);

  // Problem search — load all on mount, filter by search
  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ['admin-problem-search', search],
    queryFn: () => getAdminProblems({ search, limit: 50 }),
    staleTime: 30000
  });

  const searchResults = (searchData?.data || []).filter(
    p => !problems.find(ep => ep.problemId === p._id)
  );

  const addProblem = (p) => {
    const order = problems.length + 1;
    setProblems(prev => [...prev, {
      problemId: p._id,
      title: p.title,
      difficulty: p.difficulty,
      points: 100,
      label: String.fromCharCode(64 + order),
      order
    }]);
    setSearch('');
  };

  const removeProblem = (idx) => setProblems(prev => prev.filter((_, i) => i !== idx));

  const moveProblem = (idx, dir) => {
    const next = [...problems];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    next.forEach((p, i) => { p.order = i + 1; });
    setProblems(next);
  };

  const updateProblem = (idx, key, val) => setProblems(prev => {
    const next = [...prev];
    next[idx] = { ...next[idx], [key]: val };
    return next;
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (!form.endTime) e.endTime = 'End time is required';
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime))
      e.endTime = 'End time must be after start time';
    if (!isEdit && form.startTime && new Date(form.startTime) <= Date.now())
      e.startTime = 'Start time must be in the future';
    if (problems.length === 0) e.problems = 'Add at least one problem';
    if (problems.some(p => !p.points || p.points <= 0)) e.problems = 'All problems must have points > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (publish) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        isPublished: publish,
        problems: problems.map((p, i) => ({
          problemId: p.problemId,
          order: i + 1,
          points: Number(p.points),
          label: p.label
        }))
      };
      if (isEdit) await updateContest(id, payload);
      else await createContest(payload);
      toast.success(isEdit ? 'Contest updated' : 'Contest created');
      navigate('/admin/contests');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const duration = computeDuration(form.startTime, form.endTime);

  if (isEdit && loadingContest) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">{isEdit ? 'Edit Contest' : 'Create Contest'}</h1>

        <div className="flex flex-col gap-6">

          {/* Basic Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Basic Info</SectionTitle>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} placeholder="Contest title" className={inputClass} />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={set('description')} className={taClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <div className="flex flex-col gap-2">
                    {['rated', 'unrated', 'practice'].map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value={t} checked={form.type === t}
                          onChange={set('type')} className="accent-blue-500" />
                        <span className="text-sm text-gray-300 capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Scoring</label>
                  <div className="flex flex-col gap-2">
                    {[['points', 'Points-based'], ['icpc', 'ICPC']].map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="scoring" value={val} checked={form.scoringType === val}
                          onChange={set('scoringType')} className="accent-blue-500" />
                        <span className="text-sm text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                  {form.scoringType === 'icpc' && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">Penalty (min per wrong)</label>
                      <input type="number" value={form.penaltyMinutes}
                        onChange={e => setForm(f => ({ ...f, penaltyMinutes: Number(e.target.value) }))}
                        className={`${inputClass} w-24`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Schedule</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Time *</label>
                <input type="datetime-local" value={form.startTime} onChange={set('startTime')} className={inputClass} />
                {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Time *</label>
                <input type="datetime-local" value={form.endTime} onChange={set('endTime')} className={inputClass} />
                {errors.endTime && <p className="text-red-400 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>
            {duration && (
              <p className="text-sm text-blue-400 mt-3">Duration: {duration}</p>
            )}
          </div>

          {/* Problems */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Problems</SectionTitle>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search problems to add..."
                className={`${inputClass} pl-8`} />
            </div>

            {/* Search Results — always visible */}
            <div className="border border-gray-700 rounded-lg mb-4 overflow-hidden max-h-60 overflow-y-auto">
              {searching ? (
                <div className="p-3 text-center text-gray-500 text-sm">Loading problems...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {search ? 'No matching problems' : 'No problems available'}
                </div>
              ) : (
                searchResults.map(p => (
                  <div key={p._id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 last:border-0 hover:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <DifficultyBadge difficulty={p.difficulty} />
                      <span className="text-sm text-white">{p.title}</span>
                    </div>
                    <button onClick={() => addProblem(p)}
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Added Problems */}
            {errors.problems && <p className="text-red-400 text-xs mb-3">{errors.problems}</p>}
            {problems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No problems added yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {problems.map((p, i) => (
                  <div key={p.problemId} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveProblem(i, -1)} disabled={i === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-30"><ChevronUp size={12} /></button>
                      <button onClick={() => moveProblem(i, 1)} disabled={i === problems.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-30"><ChevronDown size={12} /></button>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <DifficultyBadge difficulty={p.difficulty} />
                      <span className="text-sm text-white flex-1">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Label</label>
                        <input value={p.label} onChange={e => updateProblem(i, 'label', e.target.value)}
                          className="w-12 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none text-center" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Points</label>
                        <input type="number" value={p.points} onChange={e => updateProblem(i, 'points', Number(e.target.value))}
                          className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none" />
                      </div>
                      <button onClick={() => removeProblem(i)} className="text-red-400 hover:text-red-300 ml-1">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.registrationRequired}
                  onChange={e => setForm(f => ({ ...f, registrationRequired: e.target.checked }))}
                  className="accent-blue-500 w-4 h-4" />
                <span className="text-sm text-gray-300">Registration Required</span>
              </label>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rules</label>
                <textarea rows={4} value={form.rules} onChange={set('rules')}
                  placeholder="Contest rules and guidelines..." className={taClass} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pb-8">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save as Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save & Publish
            </button>
            <button onClick={() => navigate('/admin/contests')}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
