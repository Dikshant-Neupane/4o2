import { create } from 'zustand';
import { mockUser } from '../mocks/mockUser';

console.log('[PHASE 1] Stores initialized');

const useAuthStore = create((set, get) => ({
  // ----- State -----
  user: null,
  token: localStorage.getItem('jana_sunuwaai_token') || null,
  isAuthenticated: !!localStorage.getItem('jana_sunuwaai_token'),
  isLoading: false,
  error: null,

  // ----- Actions -----
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const res = await axios.post('/api/auth/login', { email, password });
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fakeToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('jana_sunuwaai_token', fakeToken);

      set({
        user: mockUser,
        token: fakeToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const res = await axios.post('/api/auth/register', userData);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fakeToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('jana_sunuwaai_token', fakeToken);

      set({
        user: { ...mockUser, ...userData },
        token: fakeToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Registration failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('jana_sunuwaai_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const currentUser = get().user;
      set({
        user: { ...currentUser, ...updates },
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Update failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),

  // Hydrate user from token on app load
  hydrateUser: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoading: true });
    try {
      // TODO: Replace with real API call
      // const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      await new Promise((resolve) => setTimeout(resolve, 300));

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('jana_sunuwaai_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

export default useAuthStore;
