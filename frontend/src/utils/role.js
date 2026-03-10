// Role Management Utility
// This file manages role-based routing and access control

// Role Constants
export const ROLES = {
  ADMIN: 'admin',
  PLAYER: 'player',
  FIELD_OWNER: 'field_owner'
};

// Role Display Names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PLAYER]: 'Player',
  [ROLES.FIELD_OWNER]: 'Field Owner'
};

// Role-based Route Paths
export const ROLE_ROUTES = {
  [ROLES.ADMIN]: '/admin-dashboard',
  [ROLES.PLAYER]: '/player-dashboard',
  [ROLES.FIELD_OWNER]: '/field-owner-dashboard'
};

// Get route based on role
export const getRouteByRole = (role) => {
  return ROLE_ROUTES[role] || '/';
};

// Get display name based on role
export const getDisplayNameByRole = (role) => {
  return ROLE_DISPLAY_NAMES[role] || 'Unknown';
};

// Check if role is valid
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

// Get all available roles as array
export const getAllRoles = () => [
  { value: ROLES.ADMIN, label: ROLE_DISPLAY_NAMES[ROLES.ADMIN] },
  { value: ROLES.PLAYER, label: ROLE_DISPLAY_NAMES[ROLES.PLAYER] },
  { value: ROLES.FIELD_OWNER, label: ROLE_DISPLAY_NAMES[ROLES.FIELD_OWNER] }
];

export default {
  ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_ROUTES,
  getRouteByRole,
  getDisplayNameByRole,
  isValidRole,
  getAllRoles
};

