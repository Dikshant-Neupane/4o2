import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  // ----- State -----
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // ----- Actions -----
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      // TODO: Replace with real API call
      // const res = await axios.get('/api/notifications');
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockNotifications = [
        {
          id: 1,
          type: 'status_update',
          title: 'Report Status Updated',
          message: 'Your report "Pothole on Main Street" is now under review.',
          reportId: 1,
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 2,
          type: 'comment',
          title: 'New Comment',
          message: 'Someone commented on your report "Broken Street Light".',
          reportId: 2,
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: 3,
          type: 'upvote',
          title: 'Report Upvoted',
          message: 'Your report "Water Leak on Elm Avenue" received 5 new upvotes.',
          reportId: 3,
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];

      const unreadCount = mockNotifications.filter((n) => !n.read).length;
      set({ notifications: mockNotifications, unreadCount, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      // TODO: Replace with real API call
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      // TODO: Replace with real API call
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [
        { ...notification, id: Date.now(), read: false, created_at: new Date().toISOString() },
        ...state.notifications,
      ],
      unreadCount: state.unreadCount + 1,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.read ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
