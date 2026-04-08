import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: (userData, token) => {
    localStorage.setItem('token', token);
    // Clear React Query cache so previous user's data is gone
    import('../App').then(({ queryClient }) => queryClient.clear());
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    // Clear React Query cache on logout
    import('../App').then(({ queryClient }) => queryClient.clear());
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (userData) => set({ user: userData }),
  setLoading: (bool) => set({ isLoading: bool })
}));

export const selectIsAdmin = (state) =>
  state.user?.role === 'admin' || state.user?.role === 'superadmin';

export default useAuthStore;
