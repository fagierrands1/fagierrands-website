// Tracking service for managing order location updates
import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';

const API_BASE_URL = getApiBaseUrl();

class TrackingService {
  constructor() {
    this.activeTracking = new Map(); // Track active order tracking
    this.updateInterval = 30000; // 30 seconds
  }

  // Start tracking for an order
  startTracking(orderId, assistantId) {
    if (this.activeTracking.has(orderId)) {
      this.stopTracking(orderId);
    }

    const intervalId = setInterval(() => {
      this.updateOrderTracking(orderId, assistantId);
    }, this.updateInterval);

    this.activeTracking.set(orderId, intervalId);
    console.log(`Started tracking for order ${orderId}`);
  }

  // Stop tracking for an order
  stopTracking(orderId) {
    const intervalId = this.activeTracking.get(orderId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeTracking.delete(orderId);
      console.log(`Stopped tracking for order ${orderId}`);
    }
  }

  // Update order tracking with assistant's current location
  async updateOrderTracking(orderId, assistantId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Get assistant's current location
      const assistantLocation = await this.getAssistantLocation(assistantId);
      if (!assistantLocation) return;

      // Update order tracking
      await this.updateTrackingLocation(orderId, assistantLocation);
      
      // Add to location history
      await this.addLocationHistory(orderId, assistantLocation);

    } catch (error) {
      console.error(`Error updating tracking for order ${orderId}:`, error);
    }
  }

  // Get assistant's current location
  async getAssistantLocation(assistantId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `locations/current/`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { user_id: assistantId }
        }
      );

      if (response.data && response.data.latitude && response.data.longitude) {
        return {
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error fetching assistant location:', error);
    }
    return null;
  }

  // Update tracking location
  async updateTrackingLocation(orderId, location) {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `orders/${orderId}/tracking/`,
        {
          current_latitude: location.latitude,
          current_longitude: location.longitude
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating tracking location:', error);
    }
  }

  // Add location to history
  async addLocationHistory(orderId, location) {
    try {
      const token = localStorage.getItem('authToken');
      
      // First get the tracking ID
      const trackingResponse = await axios.get(
        `orders/${orderId}/tracking/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (trackingResponse.data && trackingResponse.data.id) {
        // Add to location history
        await axios.post(
          `tracking/${trackingResponse.data.id}/history/`,
          {
            latitude: location.latitude,
            longitude: location.longitude
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error adding location history:', error);
    }
  }

  // Calculate estimated arrival time based on distance and speed
  async calculateETA(orderId, currentLocation, destinationLocation) {
    try {
      const token = localStorage.getItem('authToken');
      
      // Calculate distance using the backend service
      const distanceResponse = await axios.post(
        `locations/calculate-distance/`,
        {
          start_lat: currentLocation.latitude,
          start_lng: currentLocation.longitude,
          end_lat: destinationLocation.latitude,
          end_lng: destinationLocation.longitude
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (distanceResponse.data && distanceResponse.data.distance) {
        const distance = distanceResponse.data.distance; // in km
        const averageSpeed = 30; // km/h - average city speed
        const etaMinutes = (distance / averageSpeed) * 60;
        
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + etaMinutes);

        // Update tracking with ETA
        await axios.patch(
          `orders/${orderId}/tracking/`,
          {
            estimated_arrival_time: eta.toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return eta;
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
    return null;
  }

  // Create tracking waypoints from order pickup/delivery locations
  async createTrackingWaypoints(orderId, order) {
    try {
      const token = localStorage.getItem('authToken');
      
      // Get or create tracking record
      const trackingResponse = await axios.get(
        `orders/${orderId}/tracking/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (trackingResponse.data && trackingResponse.data.id) {
        const trackingId = trackingResponse.data.id;
        
        // Create pickup waypoint
        if (order.pickup_latitude && order.pickup_longitude) {
          await axios.post(
            `tracking/${trackingId}/waypoints/`,
            {
              latitude: order.pickup_latitude,
              longitude: order.pickup_longitude,
              waypoint_type: 'pickup',
              name: order.pickup_address || 'Pickup Location',
              order_index: 0
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // Create delivery waypoint
        if (order.delivery_latitude && order.delivery_longitude) {
          await axios.post(
            `tracking/${trackingId}/waypoints/`,
            {
              latitude: order.delivery_latitude,
              longitude: order.delivery_longitude,
              waypoint_type: 'delivery',
              name: order.delivery_address || 'Delivery Location',
              order_index: 1
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
    } catch (error) {
      console.error('Error creating tracking waypoints:', error);
    }
  }

  // Add tracking event
  async addTrackingEvent(orderId, eventType, description, location = null) {
    try {
      const token = localStorage.getItem('authToken');
      
      // Get tracking ID
      const trackingResponse = await axios.get(
        `orders/${orderId}/tracking/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (trackingResponse.data && trackingResponse.data.id) {
        const eventData = {
          event_type: eventType,
          description: description
        };

        if (location) {
          eventData.latitude = location.latitude;
          eventData.longitude = location.longitude;
        }

        await axios.post(
          `tracking/${trackingResponse.data.id}/events/`,
          eventData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error adding tracking event:', error);
    }
  }

  // Clean up all tracking when component unmounts
  cleanup() {
    this.activeTracking.forEach((intervalId, orderId) => {
      clearInterval(intervalId);
    });
    this.activeTracking.clear();
  }
}

// Export singleton instance
export const trackingService = new TrackingService();
export default trackingService;
