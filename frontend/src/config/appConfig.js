const RAW_API_BASE_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');
const API_ORIGIN =
  typeof window !== 'undefined' && RAW_API_BASE_URL.startsWith('/')
    ? window.location.origin
    : RAW_API_BASE_URL.replace(/\/api\/?$/, '');

export const APP_CONFIG = {
  apiBaseUrl: RAW_API_BASE_URL,
  apiOrigin: API_ORIGIN,
  defaultProfilePath: '/uploads/profile/default_profile.jpg',
  brand: {
    shortName: 'FA',
    englishName: 'Football Booking',
    displayName: 'អាណាចក្រភ្នំស្វាយ'
  }
};

export const API_BASE_URL = APP_CONFIG.apiBaseUrl;
export const API_ORIGIN_URL = APP_CONFIG.apiOrigin;

export const buildAssetUrl = (assetPath, fallbackPath = APP_CONFIG.defaultProfilePath) => {
  const rawPath = assetPath || fallbackPath;
  if (!rawPath) return '';
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${APP_CONFIG.apiOrigin}${normalizedPath}`;
};
