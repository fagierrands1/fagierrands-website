// src/services/location.js
import { calculateDistance as calculateDistanceWithTurf } from '../utils/geospatial';

// Get user's current location using browser geolocation API
export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    });
  };
  
  // Calculate distance between two coordinates (in km) using turf.js
  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    try {
      // Use the imported calculateDistance function from geospatial utils
      const point1 = { lat: lat1, lng: lon1 };
      const point2 = { lat: lat2, lng: lon2 };
      
      const distance = calculateDistanceWithTurf(point1, point2, 'kilometers');
      
      return distance;
    } catch (error) {
      console.error('Error calculating distance with turf.js:', error);
      
      // Fallback to Haversine formula if turf.js fails
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km
      return d;
    }
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  // Geocode an address (convert address to coordinates)
  export const geocodeAddress = async (address) => {
    try {
      // Example implementation with Google Maps API:
      /*
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
      );
      const data = await response.json();
  
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          success: true
        };
      } else {
        throw new Error('Geocoding failed');
      }
      */
  
      return {
        lat: 0,
        lng: 0,
        success: false,
        message: 'Geocoding API not implemented'
      };
    } catch (error) {
      return {
        lat: 0,
        lng: 0,
        success: false,
        message: error.message
      };
    }
  };
  
  // Reverse geocode (convert coordinates to address)
  export const reverseGeocode = async (lat, lng) => {
    try {
      // Example implementation with Google Maps API:
      /*
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_API_KEY`
      );
      const data = await response.json();
  
      if (data.status === 'OK' && data.results.length > 0) {
        return {
          address: data.results[0].formatted_address,
          success: true
        };
      } else {
        throw new Error('Reverse geocoding failed');
      }
      */
  
      return {
        address: 'Unknown location',
        success: false,
        message: 'Reverse geocoding API not implemented'
      };
    } catch (error) {
      return {
        address: 'Unknown location',
        success: false,
        message: error.message
      };
    }
  };
  
  // Search for places based on query
  export const searchPlaces = async (query, location) => {
    try {
      // Example implementation with Google Places API:
      /*
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location.lat},${location.lng}&radius=5000&key=YOUR_API_KEY`
      );
      const data = await response.json();
  
      if (data.status === 'OK') {
        return {
          places: data.results.map(place => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          })),
          success: true
        };
      } else {
        throw new Error('Places search failed');
      }
      */
  
      return {
        places: [],
        success: false,
        message: 'Places API not implemented'
      };
    } catch (error) {
      return {
        places: [],
        success: false,
        message: error.message
      };
    }
  };
  