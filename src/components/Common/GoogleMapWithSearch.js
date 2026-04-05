import React, { useState, useEffect, useRef } from 'react';
import GoogleMapComponent from './GoogleMapComponent';
import googlePlacesService from '../../services/googlePlacesService';
import { FaSearch, FaTimes, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import './MapWithSearch.css';

const GoogleMapWithSearch = ({ 
  onLocationSelect, 
  height = '500px',
  placeholder = 'Search for a location...',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

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
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, searchResults, selectedSearchIndex]);

  const performSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
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
              placeId: prediction.placeId
            };
          } catch (error) {
            console.warn('Error getting place details:', error);
            return {
              id: prediction.placeId,
              name: prediction.description || prediction.mainText || 'Unknown location',
              mainText: prediction.mainText,
              secondaryText: prediction.secondaryText,
              latitude: null,
              longitude: null,
              placeId: prediction.placeId
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

  const handleSearchResultSelect = (result) => {
    if (!result.latitude || !result.longitude) {
      console.warn('Result missing coordinates:', result);
      return;
    }

    const location = {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name
    };
    
    setSelectedLocation(location);
    setSearchQuery(result.name);
    setShowResults(false);
    setSelectedSearchIndex(-1);
    
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(location);
    }
  };

  const handleMapLocationSelect = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name || '');
    
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(location);
    }
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
                  {result.secondaryText && (
                    <div className="result-details">
                      {result.secondaryText}
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

      <GoogleMapComponent
        onLocationSelect={handleMapLocationSelect}
        height={height}
        selectable={true}
        zoom={selectedLocation ? 16 : 14}
        center={selectedLocation ? [selectedLocation.longitude, selectedLocation.latitude] : null}
        showControls={true}
        markers={selectedLocation ? [{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          type: 'delivery',
          name: selectedLocation.name
        }] : []}
      />
    </div>
  );
};

export default GoogleMapWithSearch;
