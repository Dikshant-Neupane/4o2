import { create } from 'zustand';
import { mockReports } from '../mocks/mockReports';

const useReportStore = create((set, get) => ({
  // ----- State -----
  reports: [],
  currentReport: null,
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
  clearReport: () => set({ category: null, location: null, image: null, description: '' }),

  // ----- Actions -----
  fetchReports: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const res = await axios.get('/api/reports', { params: { ...get().filters, ...params } });
      await new Promise((resolve) => setTimeout(resolve, 600));

      const filters = { ...get().filters, ...params };
      let filtered = [...mockReports];

      // Apply filters
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

      // Sort
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
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to fetch reports';
      set({ isLoading: false, error: message });
    }
  },

  fetchReportById: async (id) => {
    set({ isLoading: true, error: null, currentReport: null });
    try {
      // TODO: Replace with real API call
      // const res = await axios.get(`/api/reports/${id}`);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const report = mockReports.find((r) => r.id === id || r.id === Number(id));
      if (!report) throw new Error('Report not found');

      set({ currentReport: report, isLoading: false });
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to fetch report';
      set({ isLoading: false, error: message });
    }
  },

  submitReport: async (reportData) => {
    set({ isSubmitting: true, error: null });
    try {
      // TODO: Replace with real API call
      // const res = await axios.post('/api/reports', reportData);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newReport = {
        id: Date.now(),
        ...reportData,
        status: 'submitted',
        ai_severity: 'medium',
        ai_category: reportData.category || 'infrastructure',
        ai_summary: 'AI-generated summary of the reported issue.',
        ai_priority_score: 65,
        ai_duplicate_flag: false,
        ai_sentiment: 'concerned',
        upvotes: 0,
        comment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set((state) => ({
        reports: [newReport, ...state.reports],
        isSubmitting: false,
      }));

      return { success: true, report: newReport };
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to submit report';
      set({ isSubmitting: false, error: message });
      return { success: false, error: message };
    }
  },

  upvoteReport: async (id) => {
    try {
      // TODO: Replace with real API call
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r
        ),
        currentReport:
          state.currentReport?.id === id
            ? { ...state.currentReport, upvotes: state.currentReport.upvotes + 1 }
            : state.currentReport,
      }));
    } catch (err) {
      console.error('Upvote failed:', err);
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
