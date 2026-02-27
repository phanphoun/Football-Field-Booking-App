import apiService from './api';

const teamService = {
  // Get all teams
  getAllTeams: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status,
      skillLevel: filters.skillLevel,
      city: filters.city,
      search: filters.search
    };

    const response = await apiService.get('/teams', params);
    return response;
  },

  // Get team by ID
  getTeamById: async (teamId) => {
    const response = await apiService.get(`/teams/${teamId}`);
    return response;
  },

  // Create new team
  createTeam: async (teamData) => {
    const response = await apiService.post('/teams', teamData);
    return response;
  },

  // Update team
  updateTeam: async (teamId, teamData) => {
    const response = await apiService.put(`/teams/${teamId}`, teamData);
    return response;
  },

  // Delete team
  deleteTeam: async (teamId) => {
    const response = await apiService.delete(`/teams/${teamId}`);
    return response;
  },

  // Get current user's teams
  getMyTeams: async () => {
    const response = await apiService.get('/teams/my-teams');
    return response;
  },

  // Get teams where user is captain
  getCaptainedTeams: async () => {
    const response = await apiService.get('/teams/captained');
    return response;
  },

  // Join team
  joinTeam: async (teamId, requestData = {}) => {
    const response = await apiService.post(`/teams/${teamId}/join`, requestData);
    return response;
  },

  // Leave team
  leaveTeam: async (teamId) => {
    const response = await apiService.post(`/teams/${teamId}/leave`);
    return response;
  },

  // Add member to team (captain only)
  addMember: async (teamId, memberData) => {
    const response = await apiService.post(`/teams/${teamId}/members`, memberData);
    return response;
  },

  // Remove member from team (captain only)
  removeMember: async (teamId, userId) => {
    const response = await apiService.delete(`/teams/${teamId}/members/${userId}`);
    return response;
  },

  // Update member role (captain only)
  updateMemberRole: async (teamId, userId, role) => {
    const response = await apiService.put(`/teams/${teamId}/members/${userId}`, { role });
    return response;
  },

  // Get team members
  getTeamMembers: async (teamId) => {
    const response = await apiService.get(`/teams/${teamId}/members`);
    return response;
  },

  // Search teams
  searchTeams: async (searchTerm, filters = {}) => {
    const params = {
      q: searchTerm,
      ...filters
    };

    const response = await apiService.get('/teams/search', params);
    return response;
  },

  // Get team statistics
  getTeamStats: async (teamId) => {
    const response = await apiService.get(`/teams/${teamId}/stats`);
    return response;
  },

  // Get team match history
  getTeamMatchHistory: async (teamId, filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status
    };

    const response = await apiService.get(`/teams/${teamId}/matches`, params);
    return response;
  },

  // Upload team logo
  uploadTeamLogo: async (teamId, imageFile) => {
    const formData = new FormData();
    formData.append('logo', imageFile);

    const response = await apiService.upload(`/teams/${teamId}/logo`, formData);
    return response;
  },

  // Helper method to format team data for API
  formatTeamData: (rawData) => {
    return {
      name: rawData.name,
      description: rawData.description || '',
      jerseyColor: rawData.jerseyColor || '',
      secondaryColor: rawData.secondaryColor || '',
      homeFieldLocation: rawData.homeFieldLocation || '',
      skillLevel: rawData.skillLevel || 'intermediate',
      preferredTime: rawData.preferredTime || 'flexible',
      maxPlayers: parseInt(rawData.maxPlayers) || 11
    };
  },

  // Helper method to validate team data
  validateTeamData: (teamData) => {
    const errors = [];

    if (!teamData.name || teamData.name.trim().length < 3) {
      errors.push('Team name must be at least 3 characters long');
    }

    if (teamData.name && teamData.name.trim().length > 50) {
      errors.push('Team name cannot exceed 50 characters');
    }

    if (teamData.description && teamData.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    if (!teamData.maxPlayers || teamData.maxPlayers < 5) {
      errors.push('Maximum players must be at least 5');
    }

    if (teamData.maxPlayers && teamData.maxPlayers > 30) {
      errors.push('Maximum players cannot exceed 30');
    }

    if (!teamData.skillLevel) {
      errors.push('Skill level is required');
    }

    const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
    if (teamData.skillLevel && !validSkillLevels.includes(teamData.skillLevel)) {
      errors.push('Invalid skill level');
    }

    const validPreferredTimes = ['morning', 'afternoon', 'evening', 'flexible'];
    if (teamData.preferredTime && !validPreferredTimes.includes(teamData.preferredTime)) {
      errors.push('Invalid preferred time');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Helper method to check if user can manage team
  canManageTeam: (team, user) => {
    if (!team || !user) return false;
    
    // User can manage if they are the captain or an admin
    return team.captainId === user.id || user.role === 'admin';
  },

  // Helper method to check if user is team member
  isTeamMember: (team, user) => {
    if (!team || !user) return false;
    
    // Check if user is captain
    if (team.captainId === user.id) return true;
    
    // Check if user is in team members
    return team.members && team.members.some(member => member.id === user.id);
  },

  // Helper method to get team member status
  getMemberStatus: (team, user) => {
    if (!team || !user) return null;
    
    if (team.captainId === user.id) return 'captain';
    
    const member = team.members && team.members.find(member => member.id === user.id);
    return member ? member.status : null;
  }
};

export default teamService;
