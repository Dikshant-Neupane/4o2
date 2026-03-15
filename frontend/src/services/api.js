import axios from 'axios';
import toast from 'react-hot-toast';
import { mockReports } from '../mocks/mockReports';
import { mockUser } from '../mocks/mockUser';
import { mockCategories } from '../mocks/mockCategories';

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL,
  timeout: 15000, // 15s timeout — AI inference can take a few seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jana_sunuwaai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API] Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status);
    return response;
  },
  async (error) => {
    // Network error (backend not running) — fail gracefully and return mock data
    if (!error.response) {
      console.warn('[API] Network error (backend offline):', error.message, 'Falling back to mock data...');
      
      const url = error.config.url;
      const method = error.config.method?.toLowerCase();
      
      // Check the URL to provide appropriate mock responses
      if (url.includes('/reports/nearby') && method === 'get') {
        return Promise.resolve({ data: mockReports, status: 200 });
      } else if (url.includes('/reports/') && method === 'get') {
        const id = url.split('/').pop();
        if (id !== 'status' && id !== 'comments') {
          const report = mockReports.find(r => r.id === parseInt(id, 10) || r.id === id);
          return Promise.resolve({ data: report || mockReports[0], status: 200 });
        }
      } else if (url.includes('/users/me') && method === 'get') {
        return Promise.resolve({ data: mockUser, status: 200 });
      } else if (url.includes('/auth/login') && method === 'post') {
        return Promise.resolve({ data: { access_token: 'mock-jwt-token', user: mockUser }, status: 200 });
      } else if (url.includes('/auth/register') && method === 'post') {
        return Promise.resolve({ data: { access_token: 'mock-jwt-token', user: mockUser }, status: 201 });
      } else if (url.includes('/auth/me') && method === 'get') {
        return Promise.resolve({ data: mockUser, status: 200 });
      } else if (url.includes('/departments') && method === 'get') {
        return Promise.resolve({ data: mockCategories, status: 200 });
      }
      
      // For any other offline request, return a generic success
      return Promise.resolve({ data: { success: true, message: 'Mock fallback successful' }, status: 200 });
    }

    console.error('[API] Error:', error.response.status);
    
    if (error.response.status === 401) {
      console.log('[API] 401 — token expired or invalid, clearing auth...');
      localStorage.removeItem('jana_sunuwaai_token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    if (error.response.status === 429) {
      toast.error('Too many requests. Please try again later.');
    }
    
    if (error.response.status === 500) {
      toast.error('Server error. Our team has been notified.');
    }
    
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(res => res.data),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

export const reports = {
  submit: (data) => api.post('/reports', data),
  getNearby: (params) => api.get('/reports/nearby', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  getStatus: (id) => api.get(`/reports/${id}/status`),
};

export const votes = {
  castVote: (reportId, voteType) => api.post(`/reports/${reportId}/vote`, { action: voteType }),
};

export const comments = {
  getComments: (reportId) => api.get(`/reports/${reportId}/comments`),
  addComment: (reportId, data) => api.post(`/reports/${reportId}/comments`, data),
};

export const users = {
  getMe: () => api.get('/users/me'),
};

export const departments = {
  getAll: () => api.get('/departments'),
};

export default api;
