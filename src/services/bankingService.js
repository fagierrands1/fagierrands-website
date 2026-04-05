// src/services/bankingService.js
import axios from '../utils/axiosConfig';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://fagierrands-server.vercel.app/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Set to false since we're using token authentication, not cookies
  withCredentials: false 
});

// Add request interceptor to attach auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Banking service functions
const bankingService = {
  // Create a new banking order
  createBankingOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/orders/banking/orders/', orderData);
      return response;
    } catch (error) {
      console.error('createBankingOrder error details:', {
        message: error.message,
        data: orderData,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response'
      });
      throw error;
    }
  },
  
  // Get details of a specific banking order
  getBankingOrder: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/banking/orders/${orderId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching banking order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Cancel a banking order
  cancelBankingOrder: async (orderId) => {
    try {
      const response = await apiClient.post(`/orders/banking/orders/${orderId}/cancel/`);
      return response;
    } catch (error) {
      console.error(`Error cancelling banking order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Get list of user's banking orders
  getUserBankingOrders: async () => {
    try {
      const response = await apiClient.get('/orders/banking/orders/');
      return response;
    } catch (error) {
      console.error('Error fetching user banking orders:', error);
      throw error;
    }
  }
};

export default bankingService;
