// src/components/Common/MapComponent.js
// Updated to use Google Maps
import React, { useState, useEffect } from 'react';
import GoogleMapComponent from './GoogleMapComponent';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import axios from '../../utils/axiosConfig';
import {
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  formatGeofenceStatus
} from '../../utils/nairobiCBDGeofence';

const MapComponent = ({ 
  location, 
  destination, 
  isTracking, 
  onLocationSelect, 
  enableGeofencing = false,
  restrictToCBD = false,
  bufferDistance = 1,
  onGeofenceStatusChange,
  height = '500px',
  className = ''
}) => {
  const { setUserLocation, userLocation } = useLocationContext();
  const [geofenceStatus, setGeofenceStatus] = useState(null);

  // Update geofence status when location changes
  useEffect(() => {
    if (enableGeofencing && userLocation) {
      const status = getCBDGeofenceStatus(userLocation, bufferDistance);
      const formattedStatus = formatGeofenceStatus(status);
      setGeofenceStatus(formattedStatus);
      
      // Notify parent component of status change
      if (onGeofenceStatusChange) {
        onGeofenceStatusChange(formattedStatus);
      }
    }
  }, [enableGeofencing, userLocation, bufferDistance, onGeofenceStatusChange]);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // If no location is already selected, set current location as default
          if (!userLocation) {
            reverseGeocode(latitude, longitude);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
    
    // Also try to get saved location from API if available
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await axios.get(
        `/locations/current/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setUserLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          name: response.data.address || 'Current Location'
        });
      }
    } catch (error) {
      // Current location might not be set yet, which is fine
      console.log("No saved location found");
    }
  };

  const handleLocationSelect = (location) => {
    // Check if location is restricted to CBD
    if (restrictToCBD && !isPointInNairobiCBD(location)) {
      alert('Location selection is restricted to Nairobi CBD area only.');
      return;
    }
    
    // Set temporary location name while geocoding
    const tempLocation = {
      ...location,
      name: 'Getting address...'
    };
    
    setUserLocation(tempLocation);
    
    // Notify parent component immediately with temporary data
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(tempLocation);
    }
    
    // Get actual address
    reverseGeocode(location.latitude, location.longitude);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      
      const locationData = {
        latitude,
        longitude,
        name: response.data.display_name
      };
      
      // Update context
      setUserLocation(locationData);
      
      // Save the location to the backend
      updateLocationInBackend(latitude, longitude, response.data.display_name);
      
      // Notify parent component if callback exists
      if (onLocationSelect && typeof onLocationSelect === 'function') {
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      
      const locationData = {
        latitude,
        longitude,
        name: 'Custom location'
      };
      
      // Update context
      setUserLocation(locationData);
      
      // Notify parent component if callback exists
      if (onLocationSelect && typeof onLocationSelect === 'function') {
        onLocationSelect(locationData);
      }
    }
  };

  const updateLocationInBackend = async (latitude, longitude, address) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      await axios.post(
        `/locations/current/update/`,
        {
          latitude,
          longitude,
          address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating location in backend:", error);
    }
  };

  const handleGeofenceStatusChange = (status) => {
    setGeofenceStatus(status);
    if (onGeofenceStatusChange) {
      onGeofenceStatusChange(status);
    }
  };

  // Determine map center
  const getMapCenter = () => {
    if (isTracking && location) {
      return [location.longitude, location.latitude];
    }
    if (userLocation) {
      return [userLocation.longitude, userLocation.latitude];
    }
    return null; // Will use default Nairobi center
  };

  // Create additional markers for destination if provided
  const getAdditionalMarkers = () => {
    const markers = [];
    
    if (destination) {
      markers.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
        name: destination.name || 'Destination',
        color: '#ef4444',
        popup: `<strong>Destination</strong><br>${destination.name || 'Destination Location'}`
      });
    }

    return markers;
  };

  return (
    <GoogleMapComponent
      onLocationSelect={handleLocationSelect}
      onGeofenceStatusChange={handleGeofenceStatusChange}
      selectedLocation={userLocation}
      currentLocation={isTracking ? location : null}
      height={height}
      className={className}
      center={getMapCenter()}
      markers={getAdditionalMarkers()}
      showControls={true}
    />
  );
};

export default MapComponent;