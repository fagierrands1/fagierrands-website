// Environment detection utility

/**
 * Determines if the application is running in a local development environment
 * @returns {boolean} True if running locally, false if in production
 */
export const isLocalEnvironment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

/**
 * Gets the appropriate API base URL based on the current environment
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Check if we're in a local environment
  if (isLocalEnvironment()) {
    return 'https://errandserver.fagitone.com/api';
  }
  
  // Use the actual API server URL for production
  // Note: If the primary server is down, the retry logic in axiosConfig will handle it
  return 'https://errandserver.fagitone.com/api';
};

/**
 * Gets fallback API URLs in case the primary server is down
 * @returns {string[]} Array of fallback API URLs
 */
export const getFallbackApiUrls = () => {
  return [
    'https://fagierrands-server.onrender.com/api',
    // Add more fallback URLs here if you have multiple deployments
  ];
};

/**
 * Gets the appropriate API base URL without the /api suffix
 * @returns {string} The API base URL without /api
 */
export const getApiServerUrl = () => {
  // Check if we're in a local environment
  if (isLocalEnvironment()) {
    return 'https://errandserver.fagitone.com';
  }
  
  // Use the actual API server URL for production
  return 'https://errandserver.fagitone.com';
};

/**
 * Gets the frontend URL based on the current environment
 * @returns {string} The frontend URL
 */
export const getFrontendUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_FRONTEND_URL) {
    return process.env.REACT_APP_FRONTEND_URL;
  }
  
  return isLocalEnvironment()
    ? 'http://localhost:3000'
    : 'https://fagierrand.fagitone.com';
};

/**
 * Properly joins URL parts, ensuring no double slashes
 * @param {string} base - Base URL
 * @param {string} path - Path to append
 * @returns {string} Properly joined URL
 */
export const joinUrl = (base, path) => {
  const cleanBase = base.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, ''); // Remove leading slashes
  return `${cleanBase}/${cleanPath}`;
};

export default {
  isLocalEnvironment,
  getApiBaseUrl,
  getApiServerUrl,
  getFrontendUrl,
  joinUrl
};