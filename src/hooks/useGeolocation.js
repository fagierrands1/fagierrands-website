import { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: null, lng: null },
    error: null
  });

  // Success handler for geolocation's `getCurrentPosition` method
  const onSuccess = async (position) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    setLocation({
      loaded: true,
      coordinates: coords,
      accuracy: position.coords.accuracy,
      error: null
    });
    
    // Store location in Django backend if specified in options
    if (options.storeInBackend) {
      try {
        await axios.post('/locations/current/update/', {
          latitude: coords.lat,
          longitude: coords.lng
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Error updating location in backend:', error);
      }
    }
  };

  // Error handler for geolocation's `getCurrentPosition` method
  const onError = (error) => {
    setLocation({
      loaded: true,
      coordinates: { lat: null, lng: null },
      error: {
        code: error.code,
        message: error.message
      }
    });
    
    // If geolocation fails, try to get last known location from backend
    if (options.fallbackToBackend) {
      fetchLastKnownLocation();
    }
  };

  // Fetch last known location from backend
  const fetchLastKnownLocation = async () => {
    try {
      const response = await axios.get('/api/locations/current/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.latitude && response.data.longitude) {
        setLocation({
          loaded: true,
          coordinates: {
            lat: response.data.latitude,
            lng: response.data.longitude
          },
          fromBackend: true,
          error: null
        });
      }
    } catch (error) {
      console.error('Error fetching location from backend:', error);
    }
  };

  // Try to fetch default location if available
  const fetchDefaultLocation = async () => {
    try {
      const response = await axios.get('/locations/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const defaultLocation = response.data.find(loc => loc.is_default);
      if (defaultLocation) {
        setLocation({
          loaded: true,
          coordinates: {
            lat: defaultLocation.latitude,
            lng: defaultLocation.longitude
          },
          isDefault: true,
          error: null
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching default location:', error);
      return false;
    }
  };

  useEffect(() => {
    // If the browser doesn't support geolocation
    if (!("geolocation" in navigator)) {
      setLocation({
        loaded: true,
        coordinates: { lat: null, lng: null },
        error: {
          code: 0,
          message: "Geolocation not supported"
        }
      });
      
      // Try to get location from backend if browser doesn't support geolocation
      if (options.fallbackToBackend) {
        fetchLastKnownLocation();
      }
      return;
    }
    
    const geoOptions = {
      enableHighAccuracy: options.enableHighAccuracy || false,
      timeout: options.timeout || 5000,
      maximumAge: options.maximumAge || 0
    };
    
    // First try to get default location if specified
    if (options.useDefaultIfAvailable) {
      fetchDefaultLocation().then(hasDefault => {
        if (!hasDefault) {
          // If no default location, get the current position
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            geoOptions
          );
        }
      });
    } else {
      // Get the current position
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geoOptions
      );
    }

    // Set up watchPosition if continuous tracking is needed
    let watchId = null;
    if (options.watch) {
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geoOptions
      );
    }

    // Clean up
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [
    options.enableHighAccuracy,
    options.timeout,
    options.maximumAge,
    options.watch,
    options.storeInBackend,
    options.fallbackToBackend,
    options.useDefaultIfAvailable
  ]);

  return location;
};

export default useGeolocation;
