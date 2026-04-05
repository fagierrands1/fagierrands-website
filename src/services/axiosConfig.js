// services/axiosConfig.js
import axios from '../utils/axiosConfig';
import config from '../config';

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
});

// Add a request interceptor to automatically add the token
axiosInstance.interceptors.request.use(
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

// Add a response interceptor to handle 401 errors consistently
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't automatically log out on 401 errors
    // Instead, let individual components handle authentication errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
