// Custom hook for managing order tracking
import { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';
import { trackingService } from '../services/trackingService';

const API_BASE_URL = getApiBaseUrl();

export const useOrderTracking = (orderId) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);

  // Fetch tracking data
  const fetchTrackingData = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(
        `orders/${orderId}/tracking/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTrackingData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(err.response?.data?.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch location history
  const fetchLocationHistory = useCallback(async () => {
    if (!trackingData?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `tracking/${trackingData.id}/history/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocationHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching location history:', err);
    }
  }, [trackingData?.id]);

  // Update tracking location
  const updateTrackingLocation = useCallback(async (latitude, longitude) => {
    if (!orderId) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `orders/${orderId}/tracking/`,
        {
          current_latitude: latitude,
          current_longitude: longitude
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh tracking data
      await fetchTrackingData();
    } catch (err) {
      console.error('Error updating tracking location:', err);
      throw err;
    }
  }, [orderId, fetchTrackingData]);

  // Add tracking event
  const addTrackingEvent = useCallback(async (eventType, description, location = null) => {
    if (!trackingData?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const eventData = {
        event_type: eventType,
        description: description
      };

      if (location) {
        eventData.latitude = location.latitude;
        eventData.longitude = location.longitude;
      }

      await axios.post(
        `tracking/${trackingData.id}/events/`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh tracking data
      await fetchTrackingData();
    } catch (err) {
      console.error('Error adding tracking event:', err);
      throw err;
    }
  }, [trackingData?.id, fetchTrackingData]);

  // Initialize tracking for an order (assistant only)
  const initializeTracking = useCallback(async () => {
    if (!orderId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `orders/${orderId}/tracking/initialize/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Tracking initialized:', response.data);
      
      // Refresh tracking data
      await fetchTrackingData();
      return response.data;
    } catch (err) {
      console.error('Error initializing tracking:', err);
      throw err;
    }
  }, [orderId, fetchTrackingData]);

  // Start automatic tracking for assistant
  const startTracking = useCallback((assistantId) => {
    if (orderId && assistantId) {
      trackingService.startTracking(orderId, assistantId);
    }
  }, [orderId]);

  // Stop automatic tracking
  const stopTracking = useCallback(() => {
    if (orderId) {
      trackingService.stopTracking(orderId);
    }
  }, [orderId]);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1, point2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }, []);

  // Get current tracking status
  const getTrackingStatus = useCallback(() => {
    if (!trackingData) return 'unknown';
    
    if (trackingData.current_latitude && trackingData.current_longitude) {
      return 'active';
    }
    return 'inactive';
  }, [trackingData]);

  // Initialize tracking data
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Fetch location history when tracking data is available
  useEffect(() => {
    if (trackingData?.id) {
      fetchLocationHistory();
    }
  }, [fetchLocationHistory, trackingData?.id]);

  return {
    trackingData,
    locationHistory,
    loading,
    error,
    fetchTrackingData,
    fetchLocationHistory,
    updateTrackingLocation,
    addTrackingEvent,
    initializeTracking,
    startTracking,
    stopTracking,
    calculateDistance,
    getTrackingStatus
  };
};

export default useOrderTracking;
