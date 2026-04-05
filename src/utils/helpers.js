import { STORAGE_KEYS } from './constants';
import { calculateDistance as calculateDistanceWithTurf } from './geospatial';

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
};

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
};

/**
 * Format phone number
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Get user data from local storage
 * @returns {object|null} User data
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Set user data in local storage
 * @param {object} user - User data
 */
export const storeUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Calculate distance between two points using turf.js
 * @param {object} point1 - {lat, lng}
 * @param {object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (point1, point2) => {
  return calculateDistanceWithTurf(point1, point2);
};

/**
 * Generate order number
 * @returns {string} Order number
 */
export const generateOrderNumber = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FE-${timestamp}-${random}`;
};

/**
 * Get readable error message
 * @param {Error|object} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.response && error.response.data) {
    if (typeof error.response.data === 'string') return error.response.data;
    if (error.response.data.message) return error.response.data.message;
    if (error.response.data.error) return error.response.data.error;
  }
  
  return error.message || 'An error occurred';
};

/**
 * Custom waypoint detection function
 * Checks if a marker should be treated as a waypoint based on index, name, or color
 * @param {object} marker - Marker object with name, color, index properties
 * @returns {boolean} True if marker is a waypoint
 */
export const isWaypointMarker = (marker) => {
  // Check if marker has index property (primary waypoint identifier)
  if (marker.index !== undefined && marker.index !== null && marker.index >= 0) {
    console.log('[WaypointUtils] ✓ Waypoint detected by index:', marker.index, marker.name);
    return true;
  }
  // Check if marker name suggests it's a waypoint
  const name = (marker.name || '').toLowerCase();
  if (name.includes('waypoint') || name.includes('stop') || name.includes('intermediate')) {
    console.log('[WaypointUtils] ✓ Waypoint detected by name:', marker.name);
    return true;
  }
  // Check if color is purple (waypoint color)
  if (marker.color && (marker.color.includes('9333ea') || marker.color.includes('a855f7') || marker.color.includes('8b5cf6'))) {
    console.log('[WaypointUtils] ✓ Waypoint detected by color:', marker.color, marker.name);
    return true;
  }
  console.log('[WaypointUtils] ✗ Not a waypoint:', marker.name, 'index:', marker.index, 'color:', marker.color);
  return false;
};

/**
 * Process order waypoints for map display
 * Converts order waypoint data into marker format for LeafletOrderMap
 * @param {Array} waypoints - Array of waypoint objects from order
 * @param {object} options - Processing options
 * @returns {Array} Array of marker objects formatted for LeafletOrderMap
 */
export const processOrderWaypoints = (waypoints = [], options = {}) => {
  const {
    includePickup = true,
    includeDelivery = true,
    order = null,
    waypointColor = '#9333ea'
  } = options;

  const markers = [];

  // Add pickup location if available
  if (includePickup && order && order.pickup_latitude && order.pickup_longitude) {
    const pickupLat = Number(order.pickup_latitude);
    const pickupLng = Number(order.pickup_longitude);
    if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
      markers.push({
        latitude: pickupLat,
        longitude: pickupLng,
        name: 'Pickup Location',
        color: '#22c55e',
        popup: '<strong>Pickup Location</strong>'
      });
    }
  }

  // Process waypoints
  const waypointsArray = Array.isArray(waypoints) ? waypoints : [];
  const processedWaypoints = waypointsArray
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .filter(w => {
      const hasValidCoords = Number.isFinite(Number(w.latitude)) && Number.isFinite(Number(w.longitude));
      if (!hasValidCoords) {
        console.warn('[WaypointUtils] Waypoint filtered out - invalid coordinates:', w);
      }
      return hasValidCoords;
    })
    .map((w, idx) => {
      // Always assign an index - use order_index if available, otherwise use array index
      const waypointIndex = (w.order_index !== undefined && w.order_index !== null) 
        ? Number(w.order_index) 
        : idx;
      
      console.log('[WaypointUtils] ✓ Processing waypoint:', {
        name: w.name,
        type: w.waypoint_type,
        order_index: w.order_index,
        assigned_index: waypointIndex,
        color: waypointColor,
        lat: w.latitude,
        lng: w.longitude
      });
      
      return {
        latitude: Number(w.latitude),
        longitude: Number(w.longitude),
        name: w.name || `Waypoint ${waypointIndex + 1}`,
        color: waypointColor,
        index: waypointIndex, // CRITICAL: This marks it as a waypoint
        popup: `<div style="text-align: center;"><strong style="color: ${waypointColor}; font-size: 16px;">Waypoint #${waypointIndex + 1}</strong><br/><span style="color: #666;">${w.name || (w.waypoint_type ? w.waypoint_type.toUpperCase() : 'WAYPOINT')}</span>${w.description ? `<br/><small style="color: #888;">${w.description}</small>` : ''}</div>`
      };
    });

  markers.push(...processedWaypoints);

  // Add delivery location if available
  if (includeDelivery && order && order.delivery_latitude && order.delivery_longitude) {
    const deliveryLat = Number(order.delivery_latitude);
    const deliveryLng = Number(order.delivery_longitude);
    if (Number.isFinite(deliveryLat) && Number.isFinite(deliveryLng)) {
      markers.push({
        latitude: deliveryLat,
        longitude: deliveryLng,
        name: 'Delivery Location',
        color: '#ef4444',
        popup: '<strong>Delivery Location</strong>'
      });
    }
  }

  console.log('[WaypointUtils] Processed markers:', markers.length, 'waypoints:', processedWaypoints.length);
  return markers;
};