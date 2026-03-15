import { create } from 'zustand';
import { reports as reportsApi, votes as votesApi } from '../services/api';
import { mockReports } from '../mocks/mockReports';

const useReportStore = create((set, get) => ({
  // ----- State -----
  reports: [],
  currentReport: null,
  lastSubmittedReport: null,  // Store AI result from submission
  filters: {
    category: '',
    severity: '',
    status: '',
    search: '',
    sortBy: 'newest',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,

  // ----- Wizard State -----
  category: null,
  location: null,
  image: null,
  description: '',

  // ----- Wizard Actions -----
  setCategory: (category) => set({ category }),
  setLocation: (location) => set({ location }),
  setImage: (image) => set({ image }),
  setDescription: (description) => set({ description }),
  clearReport: () => set({ category: null, location: null, image: null, description: '', lastSubmittedReport: null }),

  // ----- Actions -----
  fetchReports: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[STORE] Fetching real reports from API...');
      const filters = { ...get().filters, ...params };

      // Try real API first
      const res = await reportsApi.getNearby({
        lat: params.lat || 27.7172,
        lng: params.lng || 85.3240,
        radius: 5000,
        limit: 50,
      });

      let reports = res.data || [];
      console.log('[STORE] ✅ Reports loaded:', reports.length);

      // Apply client-side filters
      if (filters.category) {
        reports = reports.filter((r) => r.category === filters.category);
      }
      if (filters.severity) {
        reports = reports.filter((r) => r.ai_severity === filters.severity);
      }
      if (filters.status) {
        reports = reports.filter((r) => r.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        reports = reports.filter(
          (r) =>
            (r.title || '').toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q)
        );
      }

      // Sort
      if (filters.sortBy === 'newest') {
        reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filters.sortBy === 'oldest') {
        reports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (filters.sortBy === 'most_upvoted') {
        reports.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      }

      set({
        reports,
        pagination: {
          page: 1,
          limit: 10,
          total: reports.length,
          totalPages: Math.ceil(reports.length / 10),
        },
        filters,
        isLoading: false,
      });
    } catch (err) {
      console.warn('[STORE] API fetch failed, falling back to mock data:', err.message);
      // Fallback to mock data
      const filters = { ...get().filters, ...params };
      let filtered = [...mockReports];

      if (filters.category) {
        filtered = filtered.filter((r) => r.category === filters.category);
      }
      if (filters.severity) {
        filtered = filtered.filter((r) => r.ai_severity === filters.severity);
      }
      if (filters.status) {
        filtered = filtered.filter((r) => r.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
        );
      }

      if (filters.sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filters.sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (filters.sortBy === 'most_upvoted') {
        filtered.sort((a, b) => b.upvotes - a.upvotes);
      }

      set({
        reports: filtered,
        pagination: {
          page: 1,
          limit: 10,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / 10),
        },
        filters,
        isLoading: false,
      });
    }
  },

  fetchReportById: async (id) => {
    set({ isLoading: true, error: null, currentReport: null });
    try {
      console.log('[STORE] Fetching report by ID from API:', id);
      const res = await reportsApi.getById(id);
      const report = res.data;
      console.log('[STORE] ✅ Report loaded:', report.id);
      set({ currentReport: report, isLoading: false });
    } catch (err) {
      console.warn('[STORE] Report fetch failed, using mock:', err.message);
      const report = mockReports.find((r) => r.id === id || r.id === Number(id));
      if (!report) {
        set({ isLoading: false, error: 'Report not found' });
        return;
      }
      set({ currentReport: report, isLoading: false });
    }
  },

  submitReport: async (reportData) => {
    set({ isSubmitting: true, error: null });
    try {
      console.log('[STORE] Submitting report to real API...');

      // Build FormData for multipart upload
      const formData = new FormData();
      if (reportData.image) {
        formData.append('image', reportData.image);
      }
      formData.append('latitude', reportData.latitude || reportData.location?.lat || 27.7172);
      formData.append('longitude', reportData.longitude || reportData.location?.lng || 85.3240);
      formData.append('category_id', reportData.category_id || reportData.category || 'road_damage');
      formData.append('description', reportData.description || '');

      const token = localStorage.getItem('jana_sunuwaai_token');
      const res = await fetch(
        (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1') + '/reports/',
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const newReport = await res.json();
      console.log('[STORE] ✅ Report submitted. AI result:', {
        severity: newReport.ai_severity,
        confidence: newReport.ai_detection_confidence,
        report_id: newReport.id,
      });

      set((state) => ({
        reports: [newReport, ...state.reports],
        lastSubmittedReport: newReport,
        isSubmitting: false,
      }));

      return { success: true, report: newReport };
    } catch (err) {
      console.warn('[STORE] Report submit failed:', err.message);
      // Mock fallback
      const newReport = {
        id: Date.now(),
        ...reportData,
        status: 'submitted',
        ai_severity: 'medium',
        ai_detection_confidence: 0.65,
        ai_category: reportData.category || 'infrastructure',
        ai_summary: 'AI-generated summary of the reported issue.',
        ai_priority_score: 65,
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set((state) => ({
        reports: [newReport, ...state.reports],
        lastSubmittedReport: newReport,
        isSubmitting: false,
      }));

      return { success: true, report: newReport };
    }
  },

  upvoteReport: async (id) => {
    try {
      console.log('[STORE] Voting like on report:', id);

      // Optimistic update
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id ? { ...r, like_count: (r.like_count || r.upvotes || 0) + 1 } : r
        ),
        currentReport:
          state.currentReport?.id === id
            ? { ...state.currentReport, like_count: (state.currentReport.like_count || state.currentReport.upvotes || 0) + 1 }
            : state.currentReport,
      }));

      // Real API call
      await votesApi.castVote(id, 'like');
      console.log('[STORE] ✅ Vote recorded');
    } catch (err) {
      if (err.response?.status === 409) {
        console.warn('[STORE] Already voted on this report');
      } else {
        console.warn('[STORE] Vote failed:', err.message);
      }
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        category: '',
        severity: '',
        status: '',
        search: '',
        sortBy: 'newest',
      },
    });
  },

  clearError: () => set({ error: null }),
  clearCurrentReport: () => set({ currentReport: null }),
}));

export default useReportStore;
