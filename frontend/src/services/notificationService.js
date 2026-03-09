import apiService from './api';

const notificationService = {
  // Get all notifications
  getAll: async (filters = {}) => {
    const response = await apiService.get('/notifications', filters);
    return response;
  },

  // Get single notification by ID
  getById: async (id) => {
    const response = await apiService.get(`/notifications/${id}`);
    return response;
  },

  // Mark notification as read
  markRead: async (id) => {
    const response = await apiService.put(`/notifications/${id}`, { isRead: true });
    return response;
  },

  // Mark all notifications as read
  markAllRead: async () => {
    // Get all unread notifications and mark each as read
    const response = await notificationService.getAll({ isRead: false });
    if (response.success && response.data) {
      const unreadIds = response.data.map(n => n.id);
      await Promise.all(
        unreadIds.map(id => apiService.put(`/notifications/${id}`, { isRead: true }))
      );
    }
    return { success: true, message: 'All notifications marked as read' };
  },

  // Delete notification
  delete: async (id) => {
    const response = await apiService.delete(`/notifications/${id}`);
    return response;
  }
};

export default notificationService;

