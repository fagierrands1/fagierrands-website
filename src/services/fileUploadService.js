import axios from '../utils/axiosConfig';

// Use the configured axios instance directly instead of creating a new one
// This ensures it uses the correct base URL and interceptors
const api = axios;

const setupAuthInterceptor = () => {
  api.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );
};

setupAuthInterceptor();

export const fileUploadService = {
  uploadOrderImage: async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`/orders/${orderId}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload image error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Upload failed'
      };
    }
  },

  uploadOrderAttachment: async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/orders/${orderId}/attachments/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload attachment error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Upload failed'
      };
    }
  },

  getOrderImages: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/images/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get images error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to get images'
      };
    }
  },

  getOrderAttachments: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/attachments/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get attachments error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to get attachments'
      };
    }
  },

  validateFile: (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Invalid file type: ${file.type}. Please select an image or PDF.` };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  }
};

export default fileUploadService;
