import { create } from 'zustand';
import { auth } from '../services/api';

console.log('[PHASE 1] Stores initialized');

const useAuthStore = create((set, get) => ({
  // ----- State -----
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  // ----- Actions -----
  login: async (email, password) => {
    console.log('[AUTH] 🔄 Login started...');
    set({ isLoading: true, error: null });
    try {
      const res = await auth.login(email, password);
      const { access_token, user } = res;

      localStorage.setItem('token', access_token);

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        error: null,
      });

      console.log('[AUTH] ✅ Login success:', user.email);
      return { success: true, user };
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map(e => e.msg).join(', ');
      } else {
        msg = detail || err.message || 'Login failed';
      }
      console.error('[AUTH] ❌ Login failed:', msg);
      set({ isLoading: false, error: msg, isAuthenticated: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    console.log('[AUTH] 🔄 Register started...');
    set({ isLoading: true, error: null });
    try {
      const res = await auth.register(name, email, password);
      const { access_token, user } = res;

      localStorage.setItem('token', access_token);

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        error: null,
      });

      console.log('[AUTH] ✅ Register success:', user.email);
      return { success: true, user };
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map(e => e.msg).join(', ');
      } else {
        msg = detail || err.message || 'Registration failed';
      }
      console.error('[AUTH] ❌ Register failed:', msg);
      set({ isLoading: false, error: msg, isAuthenticated: false });
      return { success: false, error: msg };
    }
  },

  hydrateUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[AUTH] No token found during hydration');
      set({ isHydrated: true, isAuthenticated: false, token: null });
      return;
    }

    set({ isLoading: true });
    try {
      console.log('[AUTH] Validating token via /auth/me...');
      const user = await auth.getMe();
      set({
        user,
        token,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
      });
      console.log('[AUTH] ✅ Hydration success:', user.email);
    } catch (err) {
      console.warn('[AUTH] Token validation failed:', err.message);
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrated: true,
        isLoading: false,
      });
    }
  },

  logout: () => {
    console.log('[AUTH] Logging out...');
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
      error: null,
    });
    console.log('[AUTH] ✅ Logged out');
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
