import { create } from 'zustand';
import queryClient from '../api/queryClient';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: (userData, token) => {
    localStorage.setItem('token', token);
    queryClient.clear();
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    queryClient.clear();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (userData) => set({ user: userData }),
  setLoading: (bool) => set({ isLoading: bool })
}));

export const selectIsAdmin = (state) =>
  state.user?.role === 'admin' || state.user?.role === 'superadmin';

export default useAuthStore;
