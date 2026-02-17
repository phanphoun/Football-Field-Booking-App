import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API service methods
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

export const fieldsService = {
    getAll: (params) => api.get('/fields', { params }),
    getById: (id) => api.get(`/fields/${id}`),
    create: (fieldData) => api.post('/fields', fieldData),
    update: (id, fieldData) => api.put(`/fields/${id}`, fieldData),
    delete: (id) => api.delete(`/fields/${id}`),
};

export const bookingsService = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (bookingData) => api.post('/bookings', bookingData),
    update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
    cancel: (id) => api.delete(`/bookings/${id}`),
};

export const teamsService = {
    getAll: (params) => api.get('/teams', { params }),
    getById: (id) => api.get(`/teams/${id}`),
    create: (teamData) => api.post('/teams', teamData),
    update: (id, teamData) => api.put(`/teams/${id}`, teamData),
    delete: (id) => api.delete(`/teams/${id}`),
    joinTeam: (id) => api.post(`/teams/${id}/join`),
    leaveTeam: (id) => api.post(`/teams/${id}/leave`),
};

export const matchmakingService = {
    findOpponents: (params) => api.get('/matchmaking', { params }),
    createMatchRequest: (requestData) => api.post('/matchmaking', requestData),
};

export const leaguesService = {
    getMatches: (params) => api.get('/leagues/matches', { params }),
    getStandings: (league) => api.get(`/leagues/${league}/standings`),
    getTopScorers: (league) => api.get(`/leagues/${league}/scorers`),
};

export default api;
