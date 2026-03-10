import apiService, { clearAuth } from './api';

const authService = {
  // Register new user (token now in httpOnly cookie)
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    
    // Store user data (token is in httpOnly cookie)
    if (response.success && response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Login user (token now in httpOnly cookie)
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    
    // Store user data (token is in httpOnly cookie)
    if (response.success && response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiService.get('/auth/profile');
    
    // Update stored user data
    if (response.success && response.data) {
      const resolvedUser = response.data.user || response.data;
      if (resolvedUser && typeof resolvedUser === 'object') {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
      }
    }
    
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiService.put('/auth/profile', userData);
    
    // Update stored user data
    if (response.success && response.data) {
      const resolvedUser = response.data.user || response.data;
      if (resolvedUser && typeof resolvedUser === 'object') {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
      }
    }
    
    return response;
  },

  // Upload profile avatar
  uploadAvatar: async (formData) => {
    const response = await apiService.upload('/auth/profile/avatar', formData, {
      timeout: 30000
    });

    if (response.success && response.data) {
      const resolvedUser = response.data.user || response.data;
      if (resolvedUser && typeof resolvedUser === 'object') {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
      }
    }

    return response;
  },

  // Delete profile avatar
  deleteAvatar: async () => {
    const response = await apiService.delete('/auth/profile/avatar');

    if (response.success && response.data) {
      const resolvedUser = response.data.user || response.data;
      if (resolvedUser && typeof resolvedUser === 'object') {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
      }
    }

    return response;
  },

  // Logout user (clear cookie on backend, clear localStorage)
  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Logout even if API call fails
      console.error('Logout error:', error);
    }
    // Clear local auth data
    clearAuth();
  },

  // Check if user is authenticated (token in cookie, user in localStorage)
  isAuthenticated: () => {
    const user = localStorage.getItem('user');
    // Token validation happens automatically through cookie
    return !!user;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  },

  // No more getToken - token is in httpOnly cookie and automatic
  getToken: () => {
    // Token is in secure httpOnly cookie, not accessible from JS
    return 'token_in_cookie';  // Indicator that token is secure
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
  getPermissions: (userArg = null) => {
    const user = userArg || authService.getCurrentUser();
    if (!user || !user.role) return [
      'view_fields', 'view_public_teams'
    ];

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
