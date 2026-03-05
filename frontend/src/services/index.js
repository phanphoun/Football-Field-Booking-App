// Export all services for easy importing
import apiService from './api';
import authService from './authService';
import fieldService from './fieldService';
import bookingService from './bookingService';
import teamService from './teamService';
import matchResultService from './matchResultService';
import ratingService from './ratingService';

const services = {
  api: apiService,
  auth: authService,
  field: fieldService,
  booking: bookingService,
  team: teamService,
  matchResult: matchResultService,
  rating: ratingService
};

export default services;

// Named exports for individual services
export {
  apiService,
  authService,
  fieldService,
  bookingService,
  teamService,
  matchResultService,
  ratingService
};
