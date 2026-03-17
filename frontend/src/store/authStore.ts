import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Restore session from localStorage
const getStoredAuth = (): { user: User | null; token: string | null } => {
  try {
    const user = localStorage.getItem('devflow-user');
    const token = localStorage.getItem('devflow-token');
    if (user && token) return { user: JSON.parse(user), token };
  } catch {}
  return { user: null, token: null };
};

const stored = getStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: stored.user,
  token: stored.token,
  isAuthenticated: !!stored.token,
  isLoading: false,
  login: (user, token) => {
    try {
      localStorage.setItem('devflow-user', JSON.stringify(user));
      localStorage.setItem('devflow-token', token);
    } catch {}
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    try {
      localStorage.removeItem('devflow-user');
      localStorage.removeItem('devflow-token');
    } catch {}
    set({ user: null, token: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
