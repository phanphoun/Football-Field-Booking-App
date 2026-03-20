import apiService from './api';

const notificationService = {
  getAll: async (filters = {}) => {
    const response = await apiService.get('/notifications', filters);
    return response;
  },

  markRead: async (id) => {
    const response = await apiService.put(`/notifications/${id}/read`);
    return response;
  },

  markAllRead: async () => {
    const response = await apiService.put('/notifications/mark-all-read');
    return response;
  },

  create: async (payload) => {
    const response = await apiService.post('/notifications', payload);
    return response;
  }
};

export default notificationService;

