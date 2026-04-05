// src/utils/geospatial.js
import * as turf from '@turf/turf';

/**
 * Calculate distance between two points using turf.js
 * @param {object} point1 - {lat, lng} or {latitude, longitude}
 * @param {object} point2 - {lat, lng} or {latitude, longitude}
 * @param {string} units - 'kilometers', 'miles', 'meters', etc. (default: 'kilometers')
 * @returns {number} Distance in specified units
 */
export const calculateDistance = (point1, point2, units = 'kilometers') => {
  if (!point1 || !point2) return 0;
  
  try {
    // Handle different coordinate property names
    const lat1 = point1.lat || point1.latitude;
    const lng1 = point1.lng || point1.longitude;
    const lat2 = point2.lat || point2.latitude;
    const lng2 = point2.lng || point2.longitude;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      throw new Error('Invalid coordinates provided');
    }
    
    // Create turf points (turf uses [longitude, latitude] format)
    const turfPoint1 = turf.point([lng1, lat1]);
    const turfPoint2 = turf.point([lng2, lat2]);
    
    // Calculate distance using turf.js
    const distance = turf.distance(turfPoint1, turfPoint2, { units });
    
    return distance;
  } catch (error) {
    console.error('Error calculating distance with turf.js:', error);
    return 0;
  }
};

/**
 * Calculate bearing (direction) between two points
 * @param {object} point1 - {lat, lng} or {latitude, longitude}
 * @param {object} point2 - {lat, lng} or {latitude, longitude}
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (point1, point2) => {
  if (!point1 || !point2) return 0;
  
  try {
    const lat1 = point1.lat || point1.latitude;
    const lng1 = point1.lng || point1.longitude;
    const lat2 = point2.lat || point2.latitude;
    const lng2 = point2.lng || point2.longitude;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      throw new Error('Invalid coordinates provided');
    }
    
    const turfPoint1 = turf.point([lng1, lat1]);
    const turfPoint2 = turf.point([lng2, lat2]);
    
    const bearing = turf.bearing(turfPoint1, turfPoint2);
    
    // Convert to 0-360 range
    return bearing < 0 ? bearing + 360 : bearing;
  } catch (error) {
    console.error('Error calculating bearing with turf.js:', error);
    return 0;
  }
};

/**
 * Check if a point is within a certain radius of another point
 * @param {object} center - {lat, lng} or {latitude, longitude}
 * @param {object} point - {lat, lng} or {latitude, longitude}
 * @param {number} radius - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
export const isPointWithinRadius = (center, point, radius) => {
  if (!center || !point || !radius) return false;
  
  try {
    const distance = calculateDistance(center, point);
    return distance <= radius;
  } catch (error) {
    console.error('Error checking point within radius:', error);
    return false;
  }
};

/**
 * Create a circle (buffer) around a point
 * @param {object} center - {lat, lng} or {latitude, longitude}
 * @param {number} radius - Radius in kilometers
 * @param {number} steps - Number of steps for circle smoothness (default: 64)
 * @returns {object} GeoJSON polygon representing the circle
 */
export const createCircle = (center, radius, steps = 64) => {
  if (!center || !radius) return null;
  
  try {
    const lat = center.lat || center.latitude;
    const lng = center.lng || center.longitude;
    
    if (!lat || !lng) {
      throw new Error('Invalid center coordinates');
    }
    
    const turfPoint = turf.point([lng, lat]);
    const circle = turf.circle(turfPoint, radius, { steps, units: 'kilometers' });
    
    return circle;
  } catch (error) {
    console.error('Error creating circle with turf.js:', error);
    return null;
  }
};

/**
 * Find the center point of multiple coordinates
 * @param {array} points - Array of {lat, lng} or {latitude, longitude} objects
 * @returns {object} Center point {lat, lng}
 */
export const findCenterPoint = (points) => {
  if (!points || points.length === 0) return null;
  
  try {
    const turfPoints = points.map(point => {
      const lat = point.lat || point.latitude;
      const lng = point.lng || point.longitude;
      
      if (!lat || !lng) {
        throw new Error('Invalid coordinates in points array');
      }
      
      return turf.point([lng, lat]);
    });
    
    const featureCollection = turf.featureCollection(turfPoints);
    const center = turf.center(featureCollection);
    
    const [lng, lat] = center.geometry.coordinates;
    
    return { lat, lng };
  } catch (error) {
    console.error('Error finding center point with turf.js:', error);
    return null;
  }
};

/**
 * Calculate the bounding box for a set of points
 * @param {array} points - Array of {lat, lng} or {latitude, longitude} objects
 * @returns {object} Bounding box {minLat, minLng, maxLat, maxLng}
 */
export const calculateBoundingBox = (points) => {
  if (!points || points.length === 0) return null;
  
  try {
    const turfPoints = points.map(point => {
      const lat = point.lat || point.latitude;
      const lng = point.lng || point.longitude;
      
      if (!lat || !lng) {
        throw new Error('Invalid coordinates in points array');
      }
      
      return turf.point([lng, lat]);
    });
    
    const featureCollection = turf.featureCollection(turfPoints);
    const bbox = turf.bbox(featureCollection);
    
    const [minLng, minLat, maxLng, maxLat] = bbox;
    
    return { minLat, minLng, maxLat, maxLng };
  } catch (error) {
    console.error('Error calculating bounding box with turf.js:', error);
    return null;
  }
};

/**
 * Simplify a line (reduce number of points while maintaining shape)
 * @param {array} coordinates - Array of [lng, lat] coordinates
 * @param {number} tolerance - Simplification tolerance (default: 0.01)
 * @returns {array} Simplified coordinates array
 */
export const simplifyLine = (coordinates, tolerance = 0.01) => {
  if (!coordinates || coordinates.length < 2) return coordinates;
  
  try {
    const line = turf.lineString(coordinates);
    const simplified = turf.simplify(line, { tolerance, highQuality: true });
    
    return simplified.geometry.coordinates;
  } catch (error) {
    console.error('Error simplifying line with turf.js:', error);
    return coordinates;
  }
};

/**
 * Calculate area of a polygon
 * @param {array} coordinates - Array of [lng, lat] coordinates forming a polygon
 * @returns {number} Area in square kilometers
 */
export const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  try {
    // Ensure the polygon is closed (first and last points are the same)
    const closedCoordinates = [...coordinates];
    if (closedCoordinates[0] !== closedCoordinates[closedCoordinates.length - 1]) {
      closedCoordinates.push(closedCoordinates[0]);
    }
    
    const polygon = turf.polygon([closedCoordinates]);
    const area = turf.area(polygon);
    
    // Convert from square meters to square kilometers
    return area / 1000000;
  } catch (error) {
    console.error('Error calculating polygon area with turf.js:', error);
    return 0;
  }
};

/**
 * Get human-readable direction from bearing
 * @param {number} bearing - Bearing in degrees (0-360)
 * @returns {string} Direction (e.g., "North", "Northeast", "East", etc.)
 */
export const bearingToDirection = (bearing) => {
  const directions = [
    'North', 'Northeast', 'East', 'Southeast',
    'South', 'Southwest', 'West', 'Northwest'
  ];
  
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @param {boolean} useMetric - Use metric units (default: true)
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, useMetric = true) => {
  if (!distance || distance === 0) return '0 km';
  
  if (useMetric) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  } else {
    // Convert to miles
    const miles = distance * 0.621371;
    if (miles < 1) {
      const feet = miles * 5280;
      return `${Math.round(feet)} ft`;
    } else {
      return `${miles.toFixed(1)} mi`;
    }
  }
};