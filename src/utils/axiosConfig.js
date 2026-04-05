import axios from 'axios';
import config from '../config';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 60000, // Increased from 45 to 60 seconds for dashboard requests
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Ensure proper URL construction
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    const fullUrl = (config.baseURL || '').replace(/\/$/, '') + config.url;
    console.log('Making request to:', fullUrl);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and retries
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Response interceptor error:', error);
    
    const config = error.config;
    
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - possibly CORS related:', error.message);
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userType');
      localStorage.removeItem('normalizedUserType');
      localStorage.removeItem('profileData');
      localStorage.removeItem('userId');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Retry logic for 500 errors and network errors
    if (config && !config.__isRetryRequest) {
      const shouldRetry = (
        error.response?.status >= 500 || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNABORTED'
      );
      
      if (shouldRetry && config.retry > 0) {
        config.__isRetryRequest = true;
        config.retry -= 1;
        
        console.log(`Retrying request... ${config.retry} attempts remaining`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
        
        return axiosInstance(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;