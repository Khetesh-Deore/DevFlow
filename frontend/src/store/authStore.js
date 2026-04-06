import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (userData) => set({ user: userData }),

  setLoading: (bool) => set({ isLoading: bool })
}));

export const selectIsAdmin = (state) =>
  state.user?.role === 'admin' || state.user?.role === 'superadmin';

export default useAuthStore;
