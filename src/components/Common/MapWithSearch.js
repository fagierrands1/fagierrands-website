// src/components/Common/MapWithSearch.js
// Enhanced MapComponent with location search functionality
import React, { useState, useEffect, useRef } from 'react';
import GoogleMapComponent from './GoogleMapComponent';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import axios from '../../utils/axiosConfig';
import googlePlacesService from '../../services/googlePlacesService';
import { FaSearch, FaTimes, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import {
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  formatGeofenceStatus
} from '../../utils/nairobiCBDGeofence';
import './MapWithSearch.css';

const MapWithSearch = ({ 
  location, 
  destination, 
  isTracking, 
  onLocationSelect, 
  enableGeofencing = false,
  restrictToCBD = false,
  bufferDistance = 1,
  onGeofenceStatusChange,
  height = '500px',
  className = '',
  placeholder = 'Search for a location...',
  currentLocation = null
}) => {
  const { setUserLocation, userLocation } = useLocationContext();
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

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

  // Search functionality with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Handle keyboard navigation for search results
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showResults || searchResults.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSearchIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSearchIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
            handleSearchResultSelect(searchResults[selectedSearchIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setShowResults(false);
          setSelectedSearchIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, searchResults, selectedSearchIndex]);

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

  const performSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Wait for Google Maps API to be available
      let retries = 0;
      while (!window.google || !window.google.maps || !window.google.maps.places) {
        if (retries >= 30) {
          console.error('Google Maps API not available for search');
          setSearchResults([]);
          setShowResults(false);
          setIsSearching(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Ensure Google Places service is initialized
      if (!googlePlacesService.initialized) {
        const initialized = googlePlacesService.initialize();
        if (!initialized) {
          console.error('Google Places service not initialized');
          setSearchResults([]);
          setShowResults(false);
          setIsSearching(false);
          return;
        }
      }

      const predictions = await googlePlacesService.getPlacePredictions(query.trim());
      
      if (!predictions || predictions.length === 0) {
        setSearchResults([]);
        setShowResults(true);
        setIsSearching(false);
        return;
      }
      
      const results = await Promise.all(
        predictions.slice(0, 10).map(async (prediction) => {
          try {
            const details = await googlePlacesService.getPlaceDetails(prediction.placeId);
            return {
              id: prediction.placeId,
              name: prediction.description || prediction.mainText || 'Unknown location',
              mainText: prediction.mainText,
              secondaryText: prediction.secondaryText,
              latitude: details.latitude,
              longitude: details.longitude,
              placeId: prediction.placeId,
              address: {
                city: prediction.secondaryText || '',
                country: 'Kenya'
              }
            };
          } catch (error) {
            console.warn('Error getting place details:', error);
            // Return basic result even if details fail
            return {
              id: prediction.placeId,
              name: prediction.description || prediction.mainText || 'Unknown location',
              mainText: prediction.mainText,
              secondaryText: prediction.secondaryText,
              latitude: null,
              longitude: null,
              placeId: prediction.placeId,
              address: {
                city: prediction.secondaryText || '',
                country: 'Kenya'
              }
            };
          }
        })
      );
      
      setSearchResults(results.filter(r => r !== null));
      setShowResults(true);
      setSelectedSearchIndex(-1);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
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
      name: location.name || 'Getting address...'
    };
    
    setUserLocation(tempLocation);
    setSelectedLocation(tempLocation);
    
    // Notify parent component immediately with temporary data
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(tempLocation);
    }
    
    // If we don't have a name, get actual address
    if (!location.name) {
      reverseGeocode(location.latitude, location.longitude);
    } else {
      // Save the location to the backend
      updateLocationInBackend(location.latitude, location.longitude, location.name);
    }
  };
  
  const handleCBDSelect = () => {
    const cbdLocation = {
      latitude: -1.2921,
      longitude: 36.8219,
      name: 'Nairobi CBD'
    };
    handleLocationSelect(cbdLocation);
  };
  
  const handleSelectedLocation = () => {
    if (selectedLocation) {
      // Center map on selected location
      if (onLocationSelect) {
        onLocationSelect(selectedLocation);
      }
    }
  };
  
  const handleFullscreen = () => {
    // Open map in fullscreen/new window
    if (userLocation || selectedLocation) {
      const loc = selectedLocation || userLocation;
      const url = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleSearchResultSelect = (result) => {
    const location = {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name
    };
    
    handleLocationSelect(location);
    setSearchQuery(result.name);
    setShowResults(false);
    setSelectedSearchIndex(-1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedSearchIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const result = await googlePlacesService.reverseGeocode(latitude, longitude);
      
      const locationData = {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.address
      };
      
      setUserLocation(locationData);
      setSelectedLocation(locationData);
      updateLocationInBackend(latitude, longitude, result.address);
      
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
      
      setUserLocation(locationData);
      setSelectedLocation(locationData);
      
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
        `locations/update/`,
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

  // Handle clicks outside of search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedSearchIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`map-with-search-container ${className}`}>
      {/* Search Bar - Simple design matching app */}
      <div className="location-search-bar">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="search-input"
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.trim().length > 2) {
                  performSearch(searchQuery);
                }
              }
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="clear-search-btn"
              type="button"
            >
              <FaTimes />
            </button>
          )}
          {isSearching && (
            <FaSpinner className="search-spinner" />
          )}
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div ref={searchResultsRef} className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={result.id}
                className={`search-result-item ${
                  index === selectedSearchIndex ? 'selected' : ''
                }`}
                onClick={() => handleSearchResultSelect(result)}
                onMouseEnter={() => setSelectedSearchIndex(index)}
              >
                <FaMapMarkerAlt className="result-icon" />
                <div className="result-content">
                  <div className="result-name">{result.name}</div>
                  {result.address && result.address.city && (
                    <div className="result-details">
                      {result.address.city}, {result.address.county}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showResults && searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
          <div ref={searchResultsRef} className="search-results">
            <div className="no-results">
              No locations found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Display - Matching app */}
      {selectedLocation && (
        <div className="selected-location-info">
          <FaMapMarkerAlt className="location-icon" />
          <div className="location-details">
            <div className="location-name">{selectedLocation.name}</div>
            <div className="location-coordinates">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Geofence Status */}
      {enableGeofencing && geofenceStatus && (
        <div className={`geofence-status ${geofenceStatus.status}`}>
          <div className="geofence-indicator">
            <span className={`status-dot ${geofenceStatus.status}`}></span>
            {geofenceStatus.message}
          </div>
        </div>
      )}

      {/* Map Component - Using exact same pattern as demo map */}
      <div className="map-container" style={{ height: typeof height === 'string' ? height : `${height}px`, width: '100%' }}>
        <GoogleMapComponent
          onLocationSelect={handleLocationSelect}
          height={typeof height === 'string' ? height : `${height}px`}
          selectable={true}
          zoom={selectedLocation ? 16 : 14}
          showControls={true}
        />
      </div>
    </div>
  );
};

export default MapWithSearch;