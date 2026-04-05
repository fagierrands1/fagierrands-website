// src/utils/nairobiCBDGeofence.js
import * as turf from '@turf/turf';

/**
 * Nairobi CBD Geofence Utility
 * Defines the boundaries of Nairobi's Central Business District
 * and provides functions to check if locations are within the CBD
 */

// Nairobi CBD boundary coordinates (precise mapping)
// These coordinates form a detailed polygon around the main CBD area
// Updated with more accurate coordinates covering key landmarks and streets
export const NAIROBI_CBD_COORDINATES = [
  [36.8193, -1.2841],  // Near University Way / Nairobi University
  [36.8233, -1.2841],  // Junction Kenyatta Ave / Moi Ave
  [36.8270, -1.2875],  // Junction Haile Selassie / Moi Ave
  [36.8290, -1.2901],  // Near Railways / Bus Station
  [36.8256, -1.2912],  // Times Tower / Central Bank
  [36.8212, -1.2910],  // Harambee House / Supreme Court
  [36.8185, -1.2890],  // Near City Hall Way
  [36.8170, -1.2870],  // Jeevanjee Gardens
  [36.8165, -1.2850],  // Corner Moi Ave / Muindi Mbingu
  [36.8193, -1.2841]   // Close the loop
];

// Create the CBD polygon using Turf.js
export const NAIROBI_CBD_POLYGON = turf.polygon([NAIROBI_CBD_COORDINATES]);

// CBD center point for reference (calculated from updated coordinates)
export const NAIROBI_CBD_CENTER = {
  latitude: -1.2876,
  longitude: 36.8228
};

// Key landmarks within CBD for reference
export const CBD_LANDMARKS = {
  UNIVERSITY_OF_NAIROBI: {
    name: "University of Nairobi",
    latitude: -1.2841,
    longitude: 36.8193
  },
  TIMES_TOWER: {
    name: "Times Tower",
    latitude: -1.2912,
    longitude: 36.8256
  },
  HARAMBEE_HOUSE: {
    name: "Harambee House",
    latitude: -1.2910,
    longitude: 36.8212
  },
  SUPREME_COURT: {
    name: "Supreme Court of Kenya",
    latitude: -1.2910,
    longitude: 36.8212
  },
  CITY_HALL: {
    name: "Nairobi City Hall",
    latitude: -1.2890,
    longitude: 36.8185
  },
  JEEVANJEE_GARDENS: {
    name: "Jeevanjee Gardens",
    latitude: -1.2870,
    longitude: 36.8170
  },
  RAILWAY_STATION: {
    name: "Nairobi Railway Station",
    latitude: -1.2901,
    longitude: 36.8290
  },
  BUS_STATION: {
    name: "Nairobi Bus Station",
    latitude: -1.2901,
    longitude: 36.8290
  },
  KENYATTA_MOI_JUNCTION: {
    name: "Kenyatta Ave / Moi Ave Junction",
    latitude: -1.2841,
    longitude: 36.8233
  },
  HAILE_SELASSIE_MOI_JUNCTION: {
    name: "Haile Selassie / Moi Ave Junction",
    latitude: -1.2875,
    longitude: 36.8270
  }
};

/**
 * Check if a point is within Nairobi CBD
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @returns {boolean} True if point is within CBD
 */
export const isPointInNairobiCBD = (point) => {
  if (!point) return false;
  
  try {
    const lat = point.lat || point.latitude;
    const lng = point.lng || point.longitude;
    
    if (!lat || !lng) {
      throw new Error('Invalid coordinates provided');
    }
    
    // Create a turf point (turf uses [longitude, latitude] format)
    const turfPoint = turf.point([lng, lat]);
    
    // Check if point is within the CBD polygon
    return turf.booleanPointInPolygon(turfPoint, NAIROBI_CBD_POLYGON);
  } catch (error) {
    console.error('Error checking if point is in Nairobi CBD:', error);
    return false;
  }
};

/**
 * Calculate distance from a point to the nearest CBD boundary
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @param {string} method - Distance calculation method (optional)
 * @returns {number} Distance in kilometers (0 if inside CBD)
 */
export const distanceToNairobiCBD = (point, method = 'turf_point_to_line') => {
  if (!point) return Infinity;
  
  try {
    // Import enhanced calculator dynamically to avoid circular dependencies
    const { distanceCalculator } = require('./enhancedDistanceCalculator');
    const result = distanceCalculator.distanceToCBDBoundary(point, method);
    return result.distance;
  } catch (error) {
    // Fallback to original implementation if enhanced calculator fails
    console.warn('Enhanced distance calculator failed, using fallback:', error.message);
    
    try {
      const lat = point.lat || point.latitude;
      const lng = point.lng || point.longitude;
      
      if (!lat || !lng) {
        throw new Error('Invalid coordinates provided');
      }
      
      const turfPoint = turf.point([lng, lat]);
      
      // If point is inside CBD, return 0
      if (turf.booleanPointInPolygon(turfPoint, NAIROBI_CBD_POLYGON)) {
        return 0;
      }
      
      // Calculate distance to nearest point on CBD boundary
      // Use turf.pointToLineDistance for more reliable distance calculation
      const boundaryLine = turf.lineString(NAIROBI_CBD_COORDINATES);
      const distance = turf.pointToLineDistance(turfPoint, boundaryLine, { units: 'kilometers' });
      
      return distance;
    } catch (fallbackError) {
      console.error('Error calculating distance to Nairobi CBD:', fallbackError);
      return Infinity;
    }
  }
};

/**
 * Get the nearest CBD entry point for a given location
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @returns {object} Nearest entry point with coordinates and description
 */
export const getNearestCBDEntryPoint = (point) => {
  if (!point) return null;
  
  try {
    const lat = point.lat || point.latitude;
    const lng = point.lng || point.longitude;
    
    if (!lat || !lng) {
      throw new Error('Invalid coordinates provided');
    }
    
    const turfPoint = turf.point([lng, lat]);
    
    // If already inside CBD, return current location
    if (turf.booleanPointInPolygon(turfPoint, NAIROBI_CBD_POLYGON)) {
      return {
        latitude: lat,
        longitude: lng,
        description: "Already inside Nairobi CBD",
        distance: 0
      };
    }
    
    // Find nearest point on CBD boundary
    // Create a LineString from the polygon coordinates
    const boundaryLine = turf.lineString(NAIROBI_CBD_COORDINATES);
    const nearestPoint = turf.nearestPointOnLine(boundaryLine, turfPoint);
    
    if (!nearestPoint || !nearestPoint.geometry || !nearestPoint.geometry.coordinates) {
      throw new Error('Failed to find nearest point on CBD boundary');
    }
    
    const distance = turf.distance(turfPoint, nearestPoint, { units: 'kilometers' });
    
    const [entryLng, entryLat] = nearestPoint.geometry.coordinates;
    
    // Determine which side of CBD this entry point is on
    let description = "CBD Entry Point";
    if (entryLat > -1.285) {
      description = "CBD Entry Point (North Side - University Way/Kenyatta Ave area)";
    } else if (entryLat < -1.290) {
      description = "CBD Entry Point (South Side - Railway/Bus Station area)";
    } else if (entryLng < 36.820) {
      description = "CBD Entry Point (West Side - City Hall/Jeevanjee Gardens area)";
    } else if (entryLng > 36.825) {
      description = "CBD Entry Point (East Side - Haile Selassie/Railway area)";
    }
    
    return {
      latitude: entryLat,
      longitude: entryLng,
      description,
      distance: distance
    };
  } catch (error) {
    console.error('Error finding nearest CBD entry point:', error);
    return null;
  }
};

/**
 * Check if a route/path intersects with Nairobi CBD
 * @param {array} coordinates - Array of [lng, lat] coordinates forming a line
 * @returns {boolean} True if route intersects CBD
 */
export const doesRouteIntersectCBD = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return false;
  
  try {
    const route = turf.lineString(coordinates);
    
    // Check if route intersects with CBD polygon
    const intersection = turf.lineIntersect(route, NAIROBI_CBD_POLYGON);
    
    return intersection.features.length > 0;
  } catch (error) {
    console.error('Error checking route intersection with CBD:', error);
    return false;
  }
};

/**
 * Get all intersection points where a route crosses CBD boundary
 * @param {array} coordinates - Array of [lng, lat] coordinates forming a line
 * @returns {array} Array of intersection points
 */
export const getRouteCBDIntersections = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return [];
  
  try {
    const route = turf.lineString(coordinates);
    const intersection = turf.lineIntersect(route, NAIROBI_CBD_POLYGON);
    
    return intersection.features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return {
        latitude: lat,
        longitude: lng,
        type: 'intersection'
      };
    });
  } catch (error) {
    console.error('Error getting route CBD intersections:', error);
    return [];
  }
};

/**
 * Create a buffer zone around Nairobi CBD
 * @param {number} bufferDistance - Buffer distance in kilometers
 * @returns {object} GeoJSON polygon representing the buffer zone
 */
export const createCBDBufferZone = (bufferDistance = 1) => {
  try {
    const buffer = turf.buffer(NAIROBI_CBD_POLYGON, bufferDistance, { units: 'kilometers' });
    return buffer;
  } catch (error) {
    console.error('Error creating CBD buffer zone:', error);
    return null;
  }
};

/**
 * Check if a point is within the CBD buffer zone
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @param {number} bufferDistance - Buffer distance in kilometers
 * @returns {boolean} True if point is within buffer zone
 */
export const isPointInCBDBufferZone = (point, bufferDistance = 1) => {
  if (!point) return false;
  
  try {
    const lat = point.lat || point.latitude;
    const lng = point.lng || point.longitude;
    
    if (!lat || !lng) {
      throw new Error('Invalid coordinates provided');
    }
    
    const turfPoint = turf.point([lng, lat]);
    const bufferZone = createCBDBufferZone(bufferDistance);
    
    if (!bufferZone) return false;
    
    return turf.booleanPointInPolygon(turfPoint, bufferZone);
  } catch (error) {
    console.error('Error checking if point is in CBD buffer zone:', error);
    return false;
  }
};

/**
 * Get geofence status for a location
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @param {number} bufferDistance - Buffer distance in kilometers for warning zone
 * @returns {object} Status object with zone information
 */
export const getCBDGeofenceStatus = (point, bufferDistance = 1) => {
  if (!point) {
    return {
      zone: 'unknown',
      inCBD: false,
      inBufferZone: false,
      distance: Infinity,
      message: 'Invalid location data'
    };
  }
  
  try {
    const inCBD = isPointInNairobiCBD(point);
    const inBufferZone = isPointInCBDBufferZone(point, bufferDistance);
    const distance = distanceToNairobiCBD(point);
    
    let zone, message;
    
    if (inCBD) {
      zone = 'inside_cbd';
      message = 'Location is within Nairobi CBD';
    } else if (inBufferZone) {
      zone = 'buffer_zone';
      message = `Location is ${distance.toFixed(2)}km from CBD (within ${bufferDistance}km buffer zone)`;
    } else {
      zone = 'outside';
      message = `Location is ${distance.toFixed(2)}km from Nairobi CBD`;
    }
    
    return {
      zone,
      inCBD,
      inBufferZone,
      distance,
      message,
      nearestEntry: inCBD ? null : getNearestCBDEntryPoint(point)
    };
  } catch (error) {
    console.error('Error getting CBD geofence status:', error);
    return {
      zone: 'error',
      inCBD: false,
      inBufferZone: false,
      distance: Infinity,
      message: 'Error determining location status'
    };
  }
};

/**
 * Format geofence status for display
 * @param {object} status - Status object from getCBDGeofenceStatus
 * @returns {object} Formatted status with colors and icons
 */
export const formatGeofenceStatus = (status) => {
  const formatMap = {
    inside_cbd: {
      color: '#10B981', // Green
      backgroundColor: '#D1FAE5',
      icon: '📍',
      priority: 'high',
      alert: false
    },
    buffer_zone: {
      color: '#F59E0B', // Amber
      backgroundColor: '#FEF3C7',
      icon: '⚠️',
      priority: 'medium',
      alert: true
    },
    outside: {
      color: '#EF4444', // Red
      backgroundColor: '#FEE2E2',
      icon: '🚫',
      priority: 'low',
      alert: false
    },
    unknown: {
      color: '#6B7280', // Gray
      backgroundColor: '#F3F4F6',
      icon: '❓',
      priority: 'low',
      alert: false
    },
    error: {
      color: '#DC2626', // Dark red
      backgroundColor: '#FEE2E2',
      icon: '❌',
      priority: 'high',
      alert: true
    }
  };
  
  const format = formatMap[status.zone] || formatMap.unknown;
  
  return {
    ...status,
    ...format
  };
};

export default {
  NAIROBI_CBD_COORDINATES,
  NAIROBI_CBD_POLYGON,
  NAIROBI_CBD_CENTER,
  CBD_LANDMARKS,
  isPointInNairobiCBD,
  distanceToNairobiCBD,
  getNearestCBDEntryPoint,
  doesRouteIntersectCBD,
  getRouteCBDIntersections,
  createCBDBufferZone,
  isPointInCBDBufferZone,
  getCBDGeofenceStatus,
  formatGeofenceStatus
};