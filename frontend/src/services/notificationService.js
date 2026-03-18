import apiService from './api';

const notificationService = {
  getAll: async (filters = {}) => {
    const response = await apiService.get('/notifications', filters);
    return response;
  },

  markRead: async (id) => {
    const response = await apiService.put(`/notifications/${id}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
    return response;
  },

  markAllRead: async () => {
    const response = await apiService.get('/notifications', { isRead: false });
    const unread = Array.isArray(response?.data) ? response.data : [];
    await Promise.allSettled(
      unread.map((item) =>
        apiService.put(`/notifications/${item.id}`, {
          isRead: true,
          readAt: new Date().toISOString()
        })
      )
    );
    return { success: true };
  },

  create: async (payload) => {
    const response = await apiService.post('/notifications', payload);
    return response;
  }
};

export default notificationService;

