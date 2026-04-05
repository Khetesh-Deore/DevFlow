import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axiosConfig';
import { createProblem, updateProblem } from '../../api/problemApi';

const LANGUAGES = ['python', 'cpp', 'c', 'java', 'javascript'];

const INIT = {
  title: '',
  difficulty: 'Easy',
  tags: [],
  timeLimit: 2000,
  memoryLimit: 256,
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  examples: [{ input: '', output: '', explanation: '' }],
  adminSolution: { language: 'python', code: '' },
  hints: [''],
  isPublished: false
};

const inputClass = 'w-full bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500';
const textareaClass = `${inputClass} font-mono resize-y`;

function SectionTitle({ children }) {
  return <h2 className="text-base font-semibold text-white mb-4 pb-2 border-b border-gray-800">{children}</h2>;
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = (val) => {
    const tag = val.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className="flex flex-wrap gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-blue-500 min-h-[42px]">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length ? '' : 'Add tags (Enter or comma)'}
        className="bg-transparent text-white text-sm outline-none flex-1 min-w-[120px]"
      />
    </div>
  );
}

export default function AdminProblemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-problem', id],
    queryFn: () => api.get(`/problems/admin/${id}`).then(r => r.data),
    enabled: isEdit
  });

  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      setForm({
        title: p.title || '',
        difficulty: p.difficulty || 'Easy',
        tags: p.tags || [],
        timeLimit: p.timeLimit || 2000,
        memoryLimit: p.memoryLimit || 256,
        description: p.description || '',
        inputFormat: p.inputFormat || '',
        outputFormat: p.outputFormat || '',
        constraints: p.constraints || '',
        examples: p.examples?.length ? p.examples : [{ input: '', output: '', explanation: '' }],
        adminSolution: p.adminSolution || { language: 'python', code: '' },
        hints: p.hints?.length ? p.hints : [''],
        isPublished: p.isPublished || false
      });
    }
  }, [data]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setNum = (key) => (e) => setForm(f => ({ ...f, [key]: Number(e.target.value) }));

  // Examples
  const setExample = (i, key, val) => setForm(f => {
    const examples = [...f.examples];
    examples[i] = { ...examples[i], [key]: val };
    return { ...f, examples };
  });
  const addExample = () => setForm(f => ({ ...f, examples: [...f.examples, { input: '', output: '', explanation: '' }] }));
  const removeExample = (i) => setForm(f => ({ ...f, examples: f.examples.filter((_, idx) => idx !== i) }));

  // Hints
  const setHint = (i, val) => setForm(f => {
    const hints = [...f.hints];
    hints[i] = val;
    return { ...f, hints };
  });
  const addHint = () => setForm(f => ({ ...f, hints: [...f.hints, ''] }));
  const removeHint = (i) => setForm(f => ({ ...f, hints: f.hints.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (publish) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        hints: form.hints.filter(h => h.trim()),
        isPublished: publish
      };
      if (isEdit) await updateProblem(id, payload);
      else await createProblem(payload);
      toast.success(isEdit ? 'Problem updated' : 'Problem created');
      navigate('/admin/problems');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl font-bold mb-8">{isEdit ? 'Edit Problem' : 'Create Problem'}</h1>

        <div className="flex flex-col gap-8">

          {/* Basic Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Basic Info</SectionTitle>
            <div className="flex flex-col gap-4">

              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Two Sum" className={inputClass} />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={set('difficulty')} className={inputClass}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time Limit (ms)</label>
                  <input type="number" value={form.timeLimit} onChange={setNum('timeLimit')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Memory Limit (MB)</label>
                  <input type="number" value={form.memoryLimit} onChange={setNum('memoryLimit')} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags</label>
                <TagInput tags={form.tags} onChange={(tags) => setForm(f => ({ ...f, tags }))} />
              </div>

            </div>
          </div>

          {/* Problem Statement */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Problem Statement</SectionTitle>
            <div className="flex flex-col gap-4">

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Description * <span className="text-gray-600">(Markdown supported)</span>
                </label>
                <textarea rows={8} value={form.description} onChange={set('description')}
                  placeholder="Write the full problem statement here. Markdown is supported." className={textareaClass} />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Input Format</label>
                <textarea rows={3} value={form.inputFormat} onChange={set('inputFormat')}
                  placeholder="Describe the input format" className={textareaClass} />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Output Format</label>
                <textarea rows={3} value={form.outputFormat} onChange={set('outputFormat')}
                  placeholder="Describe the output format" className={textareaClass} />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Constraints</label>
                <textarea rows={3} value={form.constraints} onChange={set('constraints')}
                  placeholder="e.g. 1 ≤ n ≤ 10^5" className={textareaClass} />
              </div>

            </div>
          </div>

          {/* Examples */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Examples (shown to users)</SectionTitle>
            <div className="flex flex-col gap-4">
              {form.examples.map((ex, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-300">Example {i + 1}</span>
                    {form.examples.length > 1 && (
                      <button onClick={() => removeExample(i)} className="text-red-400 hover:text-red-300">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Input</label>
                      <textarea rows={3} value={ex.input}
                        onChange={e => setExample(i, 'input', e.target.value)}
                        className={textareaClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Output</label>
                      <textarea rows={3} value={ex.output}
                        onChange={e => setExample(i, 'output', e.target.value)}
                        className={textareaClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Explanation (optional)</label>
                    <textarea rows={2} value={ex.explanation}
                      onChange={e => setExample(i, 'explanation', e.target.value)}
                      placeholder="Explain the example..." className={textareaClass} />
                  </div>
                </div>
              ))}
              <button onClick={addExample}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 w-fit">
                <Plus size={14} /> Add Example
              </button>
            </div>
          </div>

          {/* Admin Solution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Admin Solution</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">
              This solution is used for reference only. Add test cases separately.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Language</label>
                <select value={form.adminSolution.language}
                  onChange={e => setForm(f => ({ ...f, adminSolution: { ...f.adminSolution, language: e.target.value } }))}
                  className={`${inputClass} w-40`}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Solution Code</label>
                <textarea rows={10} value={form.adminSolution.code}
                  onChange={e => setForm(f => ({ ...f, adminSolution: { ...f.adminSolution, code: e.target.value } }))}
                  placeholder="Paste your reference solution here..."
                  className={textareaClass} />
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle>Hints (optional)</SectionTitle>
            <div className="flex flex-col gap-2">
              {form.hints.map((hint, i) => (
                <div key={i} className="flex gap-2">
                  <input value={hint} onChange={e => setHint(i, e.target.value)}
                    placeholder={`Hint ${i + 1}`} className={`${inputClass} flex-1`} />
                  <button onClick={() => removeHint(i)} className="text-red-400 hover:text-red-300 px-2">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addHint}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 w-fit mt-1">
                <Plus size={14} /> Add Hint
              </button>
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
            <button onClick={() => navigate('/admin/problems')}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
