import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { DEFAULT_TEMPLATES } from '../components/Editor/CodeEditor';

const STORAGE_KEY = (userId, problemId) => `editor_${userId}_${problemId}`;

export default function useEditorSession(problemId) {
  const { user } = useAuthStore();
  const userId = user?.id || user?._id || 'guest';

  const load = useCallback(() => {
    if (!problemId) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId, problemId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [userId, problemId]);

  const saved = load();

  const [language, setLanguageState] = useState(saved?.language || 'python');
  const [code, setCodeState] = useState(
    saved?.code ?? DEFAULT_TEMPLATES[saved?.language || 'python']
  );

  // Persist on every change
  const persist = useCallback((lang, c) => {
    if (!problemId) return;
    try {
      localStorage.setItem(STORAGE_KEY(userId, problemId), JSON.stringify({ language: lang, code: c }));
    } catch {}
  }, [userId, problemId]);

  const setLanguage = useCallback((lang) => {
    // Only reset code to template if current code is still a template
    setCodeState(prev => {
      const isTemplate = Object.values(DEFAULT_TEMPLATES).includes(prev);
      const next = isTemplate ? (DEFAULT_TEMPLATES[lang] || '') : prev;
      persist(lang, next);
      return next;
    });
    setLanguageState(lang);
  }, [persist]);

  const setCode = useCallback((c) => {
    setCodeState(c);
    persist(language, c);
  }, [language, persist]);

  // Reload when problemId changes (navigating between problems)
  useEffect(() => {
    const s = load();
    if (s) {
      setLanguageState(s.language || 'python');
      setCodeState(s.code ?? DEFAULT_TEMPLATES[s.language || 'python']);
    } else {
      setLanguageState('python');
      setCodeState(DEFAULT_TEMPLATES.python);
    }
  }, [problemId]);

  const reset = useCallback(() => {
    const tpl = DEFAULT_TEMPLATES[language] || '';
    setCodeState(tpl);
    persist(language, tpl);
  }, [language, persist]);

  return { language, setLanguage, code, setCode, reset };
}
