import apiService from './api';

const userService = {
  // get all users (admin)
  getAllUsers: async (params = {}) => {
    const response = await apiService.get('/users', params);
    return response;
  },

  // get one user by id (admin)
  getUserById: async (id) => {
    const response = await apiService.get(`/users/${id}`);
    return response;
  },

  // update user by id (admin)
  updateUser: async (id, payload) => {
    const response = await apiService.put(`/users/${id}`, payload);
    return response;
  },

  // delete user by id (admin)
  deleteUser: async (id) => {
    const response = await apiService.delete(`/users/${id}`);
    return response;
  },

  // search users by partial username or email
  searchUsers: async (query, options = {}) => {
    const response = await apiService.get('/users/search', { q: query, ...options });
    return response;
  }
};

export default userService;
