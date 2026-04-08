import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { DEFAULT_TEMPLATES } from '../components/Editor/CodeEditor';

// Storage key per user + problem + language
const codeKey = (userId, problemId, lang) => `code_${userId}_${problemId}_${lang}`;
const langKey = (userId, problemId) => `lang_${userId}_${problemId}`;

function saveCode(userId, problemId, lang, code) {
  try { localStorage.setItem(codeKey(userId, problemId, lang), code); } catch { }
}

function loadCode(userId, problemId, lang) {
  try { return localStorage.getItem(codeKey(userId, problemId, lang)) ?? null; } catch { return null; }
}

function saveLang(userId, problemId, lang) {
  try { localStorage.setItem(langKey(userId, problemId), lang); } catch { }
}

function loadLang(userId, problemId) {
  try { return localStorage.getItem(langKey(userId, problemId)) ?? 'python'; } catch { return 'python'; }
}

export default function useEditorSession(problemId) {
  const { user } = useAuthStore();
  const userId = user?.id || user?._id || 'guest';

  const [language, setLanguageState] = useState(() =>
    problemId ? loadLang(userId, problemId) : 'python'
  );

  const [code, setCodeState] = useState(() => {
    if (!problemId) return DEFAULT_TEMPLATES.python;
    const lang = loadLang(userId, problemId);
    return loadCode(userId, problemId, lang) ?? DEFAULT_TEMPLATES[lang] ?? '';
  });

  // When problemId changes (navigating between problems), restore that problem's session
  useEffect(() => {
    if (!problemId) return;
    const lang = loadLang(userId, problemId);
    const saved = loadCode(userId, problemId, lang) ?? DEFAULT_TEMPLATES[lang] ?? '';
    setLanguageState(lang);
    setCodeState(saved);
  }, [problemId, userId]);

  // Switch language — save current code for old lang, load saved code for new lang
  const setLanguage = useCallback((newLang) => {
    if (!problemId) { setLanguageState(newLang); return; }

    // Save current code under current language before switching
    setCodeState(prev => {
      saveCode(userId, problemId, language, prev);
      return prev;
    });

    // Load saved code for new language (or template if never written)
    const saved = loadCode(userId, problemId, newLang) ?? DEFAULT_TEMPLATES[newLang] ?? '';
    saveLang(userId, problemId, newLang);
    setLanguageState(newLang);
    setCodeState(saved);
  }, [userId, problemId, language]);

  // Persist code on every keystroke
  const setCode = useCallback((newCode) => {
    setCodeState(newCode);
    if (problemId) saveCode(userId, problemId, language, newCode);
  }, [userId, problemId, language]);

  // Reset current language to template
  const reset = useCallback(() => {
    const tpl = DEFAULT_TEMPLATES[language] ?? '';
    setCodeState(tpl);
    if (problemId) saveCode(userId, problemId, language, tpl);
  }, [userId, problemId, language]);

  return { language, setLanguage, code, setCode, reset };
}
