import apiService from './api';

const matchResultService = {
  getAllMatchResults: async (filters = {}) => {
    const response = await apiService.get('/match-results', filters);
    return response;
  },

  recordMatchResult: async (payload) => {
    const response = await apiService.post('/match-results', payload);
    return response;
  }
};

export default matchResultService;
