export const ROLES = {
  ADMIN: 'admin',
  EXPERT: 'expert',
  FARMER: 'farmer',
};

export const ALERT_TYPES = ['warning', 'info', 'success', 'critical'];

export const MARKET_TRENDS = ['up', 'down', 'stable'];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export const DEFAULT_LOCATION = 'Bari Brahmana, J&K';
export const DEFAULT_MANDI = 'Samba Mandi';

export const UPLOAD_LIMITS = {
  PROFILE_IMAGE: 2 * 1024 * 1024,
  POST_IMAGE: 5 * 1024 * 1024,
  POST_VIDEO: 20 * 1024 * 1024,
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
