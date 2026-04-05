// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/';

// User Roles
export const USER_ROLES = {
  CLIENT: 'client',
  ASSISTANT: 'assistant',
  HANDLER: 'handler',
  ADMIN: 'admin'
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Service Types
export const SERVICE_TYPES = {
  SHOP: 'shop',
  PICKUP_DELIVERY: 'pickup_delivery',
  CARGO_DELIVERY: 'cargo_delivery',
  BANKING: 'banking',
  HOME_MAINTENANCE: 'handyman'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  WALLET: 'wallet'
};

// App Colors
export const COLORS = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  danger: '#f72585',
  warning: '#f9c74f',
  info: '#90e0ef',
  light: '#f8f9fa',
  dark: '#212529'
};

// Map Settings
export const MAP_SETTINGS = {
  initialZoom: 12,
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
};

// Form Validation Messages
export const VALIDATION = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: 'Password must be at least 8 characters with at least one number, one uppercase and one lowercase letter',
  PHONE: 'Please enter a valid phone number',
  MATCH: 'Passwords do not match'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  LOCATION: 'last_location'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  ACCOUNT: 'account',
  PROMOTION: 'promotion',
  SYSTEM: 'system'
};