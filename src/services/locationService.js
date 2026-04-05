import axios from '../utils/axiosConfig';
import { getApiServerUrl } from '../utils/environment';

const API_BASE_URL = getApiServerUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

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

export const locationService = {
  getOrderTracking: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/tracking/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get order tracking error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to get tracking'
      };
    }
  },

  updateOrderTracking: async (orderId, locationData) => {
    try {
      const payload = {
        current_latitude: locationData.latitude,
        current_longitude: locationData.longitude,
      };

      if (locationData.heading !== undefined) {
        payload.heading = locationData.heading;
      }
      if (locationData.speed !== undefined) {
        payload.speed = locationData.speed;
      }
      if (locationData.accuracy !== undefined) {
        payload.accuracy = locationData.accuracy;
      }

      const response = await api.patch(`/orders/${orderId}/tracking/`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update order tracking error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to update tracking'
      };
    }
  },

  getCurrentLocation: async () => {
    try {
      const response = await api.get('/locations/current/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get current location error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to get current location'
      };
    }
  },

  updateCurrentLocation: async (coords) => {
    try {
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      if (coords.accuracy !== undefined) {
        payload.accuracy = coords.accuracy;
      }
      if (coords.heading !== undefined) {
        payload.heading = coords.heading;
      }
      if (coords.speed !== undefined) {
        payload.speed = coords.speed;
      }

      const response = await api.post('/locations/current/update/', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update current location error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to update location'
      };
    }
  },

  calculateDistance: (coord1, coord2) => {
    if (!coord1 || !coord2 || coord1.latitude === undefined || coord2.latitude === undefined) {
      return 0;
    }

    const R = 6371;
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  },

  getEstimatedTravelTime: (distance) => {
    const avgSpeedKmh = 30;
    const timeMinutes = (distance / avgSpeedKmh) * 60;
    return Math.round(timeMinutes);
  }
};

export default locationService;
