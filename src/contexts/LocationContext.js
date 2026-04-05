import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';
import { trackingService } from '../services/trackingService';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    // Try to load saved location when context initializes
    const fetchSavedLocation = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `locations/current/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
          setUserLocation({
            id: response.data.id,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            name: response.data.address || 'Saved Location'
          });
        }
      } catch (error) {
        console.log("No saved location found or error accessing location API");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedLocation();
  }, []);

  // Save location to backend whenever it changes
  useEffect(() => {
    if (userLocation) {
      const saveLocation = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          await axios.post(
            `locations/current/update/`,
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              address: userLocation.name
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Update any active order tracking with new location
          await updateActiveOrderTracking();
        } catch (error) {
          console.error("Error saving location:", error);
        }
      };

      saveLocation();
    }
  }, [userLocation]);

  // Function to update active order tracking when location changes
  const updateActiveOrderTracking = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token || !userLocation) return;

      // Only update tracking if user is an assistant
      // Get user info to check this - use correct endpoint
      let userType = null;
      try {
        const userResponse = await axios.get(
          `accounts/user/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (userResponse.data) {
          userType = userResponse.data.user_type;
        }
      } catch (userError) {
        // If user endpoint fails, try to get from localStorage or profile
        try {
          const profileResponse = await axios.get(
            `accounts/profile/`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (profileResponse.data && profileResponse.data.user) {
            userType = profileResponse.data.user.user_type;
          }
        } catch (profileError) {
          // If both fail, check localStorage
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              userType = userData.user_type;
            } catch (e) {
              console.warn('Could not parse stored user data');
            }
          }
        }
      }

      if (!userType || userType !== 'assistant') {
        return; // Only assistants can update tracking
      }

      // Get user's active orders (assigned or in_progress)
      const ordersResponse = await axios.get(
        `orders/assistant/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
        const activeOrders = ordersResponse.data.filter(order => 
          order.status === 'assigned' || order.status === 'in_progress'
        );

        // Update tracking for each active order
        for (const order of activeOrders) {
          try {
            await axios.patch(
              `orders/${order.id}/tracking/`,
              {
                current_latitude: userLocation.latitude,
                current_longitude: userLocation.longitude
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add to location history
            const trackingResponse = await axios.get(
              `orders/${order.id}/tracking/`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (trackingResponse.data && trackingResponse.data.id) {
              await axios.post(
                `tracking/${trackingResponse.data.id}/history/`,
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch (orderError) {
            console.error(`Error updating tracking for order ${order.id}:`, orderError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating active order tracking:', error);
    }
  };

  const value = {
    userLocation,
    setUserLocation,
    loading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
