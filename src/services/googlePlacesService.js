import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

class GooglePlacesService {
  constructor() {
    this.placesService = null;
    this.autocompleteService = null;
    this.geocoder = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return true;
    
    // Only initialize geocoder (still supported)
    // PlacesService and AutocompleteService are deprecated - we use REST API instead
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return false;
    }

    try {
      // Only initialize geocoder - PlacesService is deprecated
      this.geocoder = new window.google.maps.Geocoder();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Google Places:', error);
      return false;
    }
  }

  getAutocompleteService() {
    if (!this.initialized) this.initialize();
    return this.autocompleteService;
  }

  async getPlacePredictions(input, options = {}) {
    try {
      // Use new Places API (New) as primary method to avoid deprecation warnings
      return await this.getPlacePredictionsNew(input, options);
    } catch (error) {
      console.error('Error with new Places API, falling back to legacy:', error);
      // Fallback to legacy method if new API fails
      try {
        return await this.getPlacePredictionsLegacy(input, options);
      } catch (legacyError) {
        console.error('Both autocomplete methods failed:', legacyError);
        return [];
      }
    }
  }

  // New Places API (New) method using fetch - recommended migration path
  async getPlacePredictionsNew(input, options = {}) {
    try {
      const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      // Build request body for new Places API
      const requestBody = {
        input,
        includedRegionCodes: ['KE'], // Kenya
        languageCode: 'en',
        ...options
      };

      const response = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat.mainText,suggestions.placePrediction.structuredFormat.secondaryText'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Places API error:', response.status, errorText);
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        return data.suggestions
          .filter(s => s.placePrediction)
          .map(s => {
            const prediction = s.placePrediction;
            const text = prediction.text?.text || '';
            const structuredFormat = prediction.structuredFormat;
            
            return {
              placeId: prediction.placeId,
              description: text,
              mainText: structuredFormat?.mainText?.text || text,
              secondaryText: structuredFormat?.secondaryText?.text || ''
            };
          });
      }
      
      return [];
    } catch (error) {
      console.error('Error with new Places API:', error);
      throw error; // Let caller handle fallback
    }
  }

  // Legacy method - FALLBACK ONLY (deprecated but still works)
  // Note: This will show deprecation warnings in console, but is only used if new API fails
  // The warnings are informational and don't affect functionality
  async getPlacePredictionsLegacy(input, options = {}) {
    try {
      // Wait for Google Maps API to be available
      let retries = 0;
      const maxRetries = 20;
      
      while (!window.google || !window.google.maps || !window.google.maps.places) {
        if (retries >= maxRetries) {
          console.error('Google Maps Places API not available after retries');
          return [];
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Initialize AutocompleteService (deprecated but functional as fallback)
      // Deprecation warning expected here - this is only used if new API fails
      if (!this.autocompleteService) {
        this.autocompleteService = new window.google.maps.places.AutocompleteService();
      }

      if (!this.autocompleteService || !this.autocompleteService.getPlacePredictions) {
        console.error('AutocompleteService not available');
        return [];
      }

      const request = {
        input,
        componentRestrictions: { country: 'ke' },
        ...options
      };

      return new Promise((resolve, reject) => {
        try {
          this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions.map(p => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || ''
              })));
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else {
              console.warn('Places API status:', status);
              resolve([]); // Return empty array instead of rejecting
            }
          });
        } catch (error) {
          console.error('Error in getPlacePredictions callback:', error);
          resolve([]); // Return empty array on error
        }
      });
    } catch (error) {
      console.error('Error with legacy AutocompleteService:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId) {
    try {
      // Use new Places API (New) REST endpoint instead of deprecated PlacesService
      const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Places API error:', response.status, errorText);
        // Fallback to legacy method if new API fails
        return this.getPlaceDetailsLegacy(placeId);
      }

      const data = await response.json();
      
      return {
        latitude: data.location?.latitude || null,
        longitude: data.location?.longitude || null,
        address: data.formattedAddress || '',
        name: data.displayName?.text || '',
        placeId: data.id || placeId
      };
    } catch (error) {
      console.error('Error with new Places API, falling back to legacy:', error);
      // Fallback to legacy method
      return this.getPlaceDetailsLegacy(placeId);
    }
  }

  // Legacy method for getPlaceDetails (fallback only - deprecated)
  // Note: This will show deprecation warnings in console, but is only used if new API fails
  async getPlaceDetailsLegacy(placeId) {
    try {
      // Wait for Google Maps API
      let retries = 0;
      while (!window.google || !window.google.maps || !window.google.maps.places) {
        if (retries >= 20) {
          throw new Error('Google Maps Places API not available');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Create a temporary PlacesService only for fallback (deprecated but functional)
      // Deprecation warning expected here - this is only used if new API fails
      const tempDiv = document.createElement('div');
      const placesService = new window.google.maps.places.PlacesService(tempDiv);
      
      return new Promise((resolve, reject) => {
        placesService.getDetails(
          {
            placeId,
            fields: ['geometry', 'formatted_address', 'name', 'address_components']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve({
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                address: place.formatted_address,
                name: place.name,
                placeId
              });
            } else {
              reject(new Error(`Places API error: ${status}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error getting place details (legacy):', error);
      throw error;
    }
  }

  async geocodeAddress(address) {
    try {
      if (!this.geocoder) this.initialize();

      return new Promise((resolve, reject) => {
        this.geocoder.geocode({ address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
            const result = results[0];
            resolve({
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              address: result.formatted_address,
              placeId: result.place_id
            });
          } else {
            reject(new Error(`Geocoder error: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      if (!this.geocoder) this.initialize();

      return new Promise((resolve, reject) => {
        this.geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
              const result = results[0];
              resolve({
                latitude: lat,
                longitude: lng,
                address: result.formatted_address,
                placeId: result.place_id
              });
            } else {
              reject(new Error(`Reverse geocoder error: ${status}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not available');
      return null;
    }

    const loc1 = new window.google.maps.LatLng(lat1, lng1);
    const loc2 = new window.google.maps.LatLng(lat2, lng2);
    
    return (window.google.maps.geometry.spherical.computeDistanceBetween(loc1, loc2) / 1000);
  }
}

export default new GooglePlacesService();
