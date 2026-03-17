import { create } from 'zustand';

type Theme = 'dark' | 'light';

const getStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem('devflow-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
};

const applyTheme = (theme: Theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
};

// Apply on load immediately
const initialTheme = getStoredTheme();
applyTheme(initialTheme);

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    try { localStorage.setItem('devflow-theme', newTheme); } catch {}
    return { theme: newTheme };
  }),
}));
