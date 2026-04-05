// src/hooks/useNairobiCBDGeofence.js
import { useState, useEffect, useCallback } from 'react';
import {
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  formatGeofenceStatus,
  getNearestCBDEntryPoint,
  distanceToNairobiCBD,
  isPointInCBDBufferZone
} from '../utils/nairobiCBDGeofence';

/**
 * Custom hook for Nairobi CBD geofencing functionality
 * @param {object} options - Configuration options
 * @returns {object} Geofencing state and functions
 */
export const useNairobiCBDGeofence = (options = {}) => {
  const {
    bufferDistance = 1, // Default 1km buffer
    enableRealTimeTracking = false,
    onEnterCBD,
    onExitCBD,
    onEnterBufferZone,
    onExitBufferZone,
    onStatusChange
  } = options;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);

  // Update geofence status when location changes
  const updateGeofenceStatus = useCallback((location) => {
    if (!location) return;

    const status = getCBDGeofenceStatus(location, bufferDistance);
    const formattedStatus = formatGeofenceStatus(status);
    
    setGeofenceStatus(formattedStatus);

    // Trigger callbacks for status changes
    if (previousStatus && previousStatus.zone !== formattedStatus.zone) {
      // CBD entry/exit
      if (formattedStatus.inCBD && !previousStatus.inCBD && onEnterCBD) {
        onEnterCBD(formattedStatus);
      } else if (!formattedStatus.inCBD && previousStatus.inCBD && onExitCBD) {
        onExitCBD(formattedStatus);
      }

      // Buffer zone entry/exit
      if (formattedStatus.inBufferZone && !previousStatus.inBufferZone && onEnterBufferZone) {
        onEnterBufferZone(formattedStatus);
      } else if (!formattedStatus.inBufferZone && previousStatus.inBufferZone && onExitBufferZone) {
        onExitBufferZone(formattedStatus);
      }

      // General status change
      if (onStatusChange) {
        onStatusChange(formattedStatus, previousStatus);
      }
    }

    setPreviousStatus(formattedStatus);
  }, [bufferDistance, previousStatus, onEnterCBD, onExitCBD, onEnterBufferZone, onExitBufferZone, onStatusChange]);

  // Start real-time location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    if (isTracking) {
      console.warn('Tracking is already active');
      return true;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const location = {
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          timestamp: new Date()
        };
        
        setCurrentLocation(location);
        updateGeofenceStatus(location);
      },
      (error) => {
        console.error('Error watching position:', error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    setWatchId(id);
    setIsTracking(true);
    return true;
  }, [isTracking, updateGeofenceStatus]);

  // Stop real-time location tracking
  const stopTracking = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const location = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date()
          };
          
          setCurrentLocation(location);
          updateGeofenceStatus(location);
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 10000
        }
      );
    });
  }, [updateGeofenceStatus]);

  // Check if a specific location is in CBD
  const checkLocationInCBD = useCallback((location) => {
    return isPointInNairobiCBD(location);
  }, []);

  // Check if a specific location is in buffer zone
  const checkLocationInBufferZone = useCallback((location) => {
    return isPointInCBDBufferZone(location, bufferDistance);
  }, [bufferDistance]);

  // Get distance to CBD for a specific location
  const getDistanceToCBD = useCallback((location) => {
    return distanceToNairobiCBD(location);
  }, []);

  // Get nearest CBD entry point for a specific location
  const getNearestEntry = useCallback((location) => {
    return getNearestCBDEntryPoint(location);
  }, []);

  // Update location manually (for testing or external location sources)
  const updateLocation = useCallback((location) => {
    setCurrentLocation(location);
    updateGeofenceStatus(location);
  }, [updateGeofenceStatus]);

  // Start tracking automatically if enabled
  useEffect(() => {
    if (enableRealTimeTracking) {
      startTracking();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableRealTimeTracking, startTracking, watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    currentLocation,
    geofenceStatus,
    isTracking,
    
    // Location functions
    getCurrentLocation,
    updateLocation,
    
    // Tracking functions
    startTracking,
    stopTracking,
    
    // Geofence check functions
    checkLocationInCBD,
    checkLocationInBufferZone,
    getDistanceToCBD,
    getNearestEntry,
    
    // Utility functions
    isInCBD: geofenceStatus?.inCBD || false,
    isInBufferZone: geofenceStatus?.inBufferZone || false,
    distanceToCBD: geofenceStatus?.distance || Infinity,
    zone: geofenceStatus?.zone || 'unknown',
    
    // Status helpers
    isInsideCBD: () => geofenceStatus?.zone === 'inside_cbd',
    isInWarningZone: () => geofenceStatus?.zone === 'buffer_zone',
    isOutsideCBD: () => geofenceStatus?.zone === 'outside',
    hasLocationAccess: () => !!navigator.geolocation,
    
    // Configuration
    bufferDistance
  };
};

export default useNairobiCBDGeofence;