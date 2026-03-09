import apiService from './api';

const paymentService = {
  // Get Stripe payment configuration
  getConfig: async () => {
    const response = await apiService.get('/payments/config');
    return response;
  }
};

export default paymentService;

