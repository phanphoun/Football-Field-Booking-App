import apiService from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    
    // Store token and user data
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    
    // Store token and user data
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiService.get('/auth/profile');
    
    // Update stored user data
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiService.put('/auth/profile', userData);
    
    // Update stored user data
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && user.role === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roles) => {
    const user = authService.getCurrentUser();
    return user && roles.includes(user.role);
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.hasRole('admin');
  },

  // Check if user is field owner
  isFieldOwner: () => {
    return authService.hasRole('field_owner');
  },

  // Check if user is captain
  isCaptain: () => {
    return authService.hasRole('captain');
  },

  // Check if user is player
  isPlayer: () => {
    return authService.hasRole('player');
  },

  // Get user permissions based on role
  getPermissions: () => {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const rolePermissions = {
      admin: [
        'create_field', 'edit_field', 'delete_field',
        'create_booking', 'edit_booking', 'delete_booking',
        'create_team', 'edit_team', 'delete_team',
        'manage_users', 'view_analytics'
      ],
      field_owner: [
        'create_field', 'edit_field', 'delete_field',
        'view_own_bookings', 'manage_own_fields'
      ],
      captain: [
        'create_team', 'edit_own_team', 'manage_team_members',
        'create_booking', 'edit_own_booking'
      ],
      player: [
        'view_fields', 'create_booking', 'edit_own_booking',
        'join_team', 'view_own_bookings'
      ],
      guest: [
        'view_fields', 'view_public_teams'
      ]
    };

    return rolePermissions[user.role] || rolePermissions.guest;
  },

  // Check if user has specific permission
  hasPermission: (permission) => {
    const permissions = authService.getPermissions();
    return permissions.includes(permission);
  }
};

export default authService;
