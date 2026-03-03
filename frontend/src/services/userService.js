import apiService from './api';

const userService = {
  // search users by partial username or email
  searchUsers: async (query, options = {}) => {
    const response = await apiService.get('/users/search', { q: query, ...options });
    return response;
  }
};

export default userService;
