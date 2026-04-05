import axios from '../utils/axiosConfig';

// Create Axios instance pointing to your Django backend
const API = axios.create({
  baseURL: 'https://fagierrands-server.vercel.app/',
  withCredentials: true // Optional, depending on your Django auth/cookie setup
});

const bankingServiceAuth = {
  // Get all banks
  getBanks: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.get('/orders/banking/banks/', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching banks:', error);
      throw error;
    }
  },

  // Create a new banking order
  createBankingOrder: async (orderData) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.post('/orders/banking/orders/', orderData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating banking order:', error);
      throw error;
    }
  },

  // Get user's banking orders
  getUserBankingOrders: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.get('/orders/banking/orders/', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching user banking orders:', error);
      throw error;
    }
  },

  // Get a specific banking order
  getBankingOrder: async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.get(\`/orders/banking/orders/\${orderId}/\`, { headers });
      return response.data;
    } catch (error) {
      console.error(\`Error fetching banking order \${orderId}:\`, error);
      throw error;
    }
  },

  // Cancel a banking order
  cancelBankingOrder: async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.post(\`/orders/banking/orders/\${orderId}/cancel/\`, null, { headers });
      return response.data;
    } catch (error) {
      console.error(\`Error cancelling banking order \${orderId}:\`, error);
      throw error;
    }
  }
};

export default bankingServiceAuth;

