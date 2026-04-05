// src/components/Common/MapboxMapComponent.js
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import {
  NAIROBI_CBD_COORDINATES,
  NAIROBI_CBD_CENTER,
  CBD_LANDMARKS,
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  createCBDBufferZone
} from '../../utils/nairobiCBDGeofence';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;

const MapboxMapComponent = ({
  onLocationSelect,
  onGeofenceStatusChange,
  selectedLocation,
  currentLocation,
  bufferDistance = 1,
  restrictToCBD = false,
  showLandmarks = true,
  showBufferZone = true,
  height = '500px',
  className = '',
  initialStyle = 'satellite-streets'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentStyle, setCurrentStyle] = useState(initialStyle);
  const markersRef = useRef({});

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapboxStyle(initialStyle),
      center: [NAIROBI_CBD_CENTER.longitude, NAIROBI_CBD_CENTER.latitude],
      zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
      attributionControl: true
    });

    map.current.on('load', () => {
      setIsMapReady(true);
      
      // Add CBD polygon
      addCBDPolygon();
      
      // Add buffer zone if enabled
      if (showBufferZone) {
        addBufferZone();
      }
      
      // Add landmarks if enabled
      if (showLandmarks) {
        addLandmarks();
      }
    });

    // Add click handler
    map.current.on('click', handleMapClick);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update buffer zone when distance changes
  useEffect(() => {
    if (isMapReady && showBufferZone) {
      updateBufferZone();
    }
  }, [bufferDistance, showBufferZone, isMapReady]);

  // Update selected location marker
  useEffect(() => {
    if (isMapReady && selectedLocation) {
      updateSelectedLocationMarker();
    }
  }, [selectedLocation, isMapReady]);

  // Update current location marker
  useEffect(() => {
    if (isMapReady && currentLocation) {
      updateCurrentLocationMarker();
    }
  }, [currentLocation, isMapReady]);

  const getMapboxStyle = (styleKey) => {
    const styles = {
      'streets': MAPBOX_CONFIG.STYLES.STREETS,
      'satellite': MAPBOX_CONFIG.STYLES.SATELLITE,
      'satellite-streets': MAPBOX_CONFIG.STYLES.SATELLITE_STREETS,
      'light': MAPBOX_CONFIG.STYLES.LIGHT,
      'dark': MAPBOX_CONFIG.STYLES.DARK,
      'outdoors': MAPBOX_CONFIG.STYLES.OUTDOORS,
      'navigation-day': MAPBOX_CONFIG.STYLES.NAVIGATION_DAY,
      'navigation-night': MAPBOX_CONFIG.STYLES.NAVIGATION_NIGHT
    };
    return styles[styleKey] || MAPBOX_CONFIG.DEFAULT_STYLE;
  };

  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    
    const location = {
      latitude: lat,
      longitude: lng,
      name: `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
    };

    // Check if location is restricted to CBD
    if (restrictToCBD && !isPointInNairobiCBD(location)) {
      alert('Location selection is restricted to Nairobi CBD only.');
      return;
    }

    // Get geofence status
    const status = getCBDGeofenceStatus(location, bufferDistance);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }

    if (onGeofenceStatusChange) {
      onGeofenceStatusChange(status);
    }
  };

  const addCBDPolygon = () => {
    if (!map.current || !isMapReady) return;

    // Add CBD polygon source
    map.current.addSource('cbd-polygon', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [NAIROBI_CBD_COORDINATES]
        }
      }
    });

    // Add CBD polygon fill layer
    map.current.addLayer({
      id: 'cbd-polygon-fill',
      type: 'fill',
      source: 'cbd-polygon',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.2
      }
    });

    // Add CBD polygon outline layer
    map.current.addLayer({
      id: 'cbd-polygon-outline',
      type: 'line',
      source: 'cbd-polygon',
      paint: {
        'line-color': '#22c55e',
        'line-width': 2
      }
    });
  };

  const addBufferZone = () => {
    updateBufferZone();
  };

  const updateBufferZone = () => {
    if (!map.current || !isMapReady) return;

    // Remove existing buffer zone
    if (map.current.getLayer('buffer-zone-fill')) {
      map.current.removeLayer('buffer-zone-fill');
    }
    if (map.current.getLayer('buffer-zone-outline')) {
      map.current.removeLayer('buffer-zone-outline');
    }
    if (map.current.getSource('buffer-zone')) {
      map.current.removeSource('buffer-zone');
    }

    if (!showBufferZone) return;

    try {
      // Create buffer zone using Turf.js
      const bufferZone = createCBDBufferZone(bufferDistance);
      if (!bufferZone) return;

      // Add buffer zone source
      map.current.addSource('buffer-zone', {
        type: 'geojson',
        data: bufferZone
      });

      // Add buffer zone fill layer
      map.current.addLayer({
        id: 'buffer-zone-fill',
        type: 'fill',
        source: 'buffer-zone',
        paint: {
          'fill-color': '#fbbf24',
          'fill-opacity': 0.1
        }
      });

      // Add buffer zone outline layer
      map.current.addLayer({
        id: 'buffer-zone-outline',
        type: 'line',
        source: 'buffer-zone',
        paint: {
          'line-color': '#fbbf24',
          'line-width': 2,
          'line-dasharray': [5, 5]
        }
      });
    } catch (error) {
      console.error('Error creating buffer zone:', error);
    }
  };

  const addLandmarks = () => {
    if (!map.current || !isMapReady) return;

    Object.entries(CBD_LANDMARKS).forEach(([key, landmark]) => {
      const marker = new mapboxgl.Marker({
        color: '#8b5cf6'
      })
        .setLngLat([landmark.longitude, landmark.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${landmark.name}</strong>`))
        .addTo(map.current);

      markersRef.current[`landmark-${key}`] = marker;
    });
  };

  const updateSelectedLocationMarker = () => {
    if (!map.current || !selectedLocation) return;

    // Remove existing selected marker
    if (markersRef.current.selected) {
      markersRef.current.selected.remove();
    }

    // Add new selected marker
    const status = getCBDGeofenceStatus(selectedLocation, bufferDistance);
    const color = getMarkerColor(status.zone);

    const marker = new mapboxgl.Marker({
      color: color
    })
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <strong>${selectedLocation.name || 'Selected Location'}</strong><br>
          <small>${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}</small><br>
          <span style="color: ${status.color}; background-color: ${status.backgroundColor}; padding: 2px 4px; border-radius: 3px; font-size: 11px;">
            ${status.message}
          </span>
        </div>
      `))
      .addTo(map.current);

    markersRef.current.selected = marker;

    // Center map on selected location
    map.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 16,
      duration: 1000
    });
  };

  const updateCurrentLocationMarker = () => {
    if (!map.current || !currentLocation) return;

    // Remove existing current location marker
    if (markersRef.current.current) {
      markersRef.current.current.remove();
    }

    // Add new current location marker
    const status = getCBDGeofenceStatus(currentLocation, bufferDistance);

    const marker = new mapboxgl.Marker({
      color: '#10b981'
    })
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <strong>Current Location</strong><br>
          <small>${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</small><br>
          <span style="color: ${status.color}; background-color: ${status.backgroundColor}; padding: 2px 4px; border-radius: 3px; font-size: 11px;">
            ${status.message}
          </span>
        </div>
      `))
      .addTo(map.current);

    markersRef.current.current = marker;
  };

  const getMarkerColor = (zone) => {
    switch (zone) {
      case 'inside_cbd':
        return '#22c55e'; // Green
      case 'buffer_zone':
        return '#f59e0b'; // Orange
      case 'outside':
        return '#ef4444'; // Red
      default:
        return '#3b82f6'; // Blue
    }
  };

  const switchMapStyle = (styleKey) => {
    if (!map.current) return;

    map.current.setStyle(getMapboxStyle(styleKey));
    setCurrentStyle(styleKey);

    // Re-add layers after style change
    map.current.once('styledata', () => {
      addCBDPolygon();
      if (showBufferZone) {
        addBufferZone();
      }
      if (showLandmarks) {
        addLandmarks();
      }
      if (selectedLocation) {
        updateSelectedLocationMarker();
      }
      if (currentLocation) {
        updateCurrentLocationMarker();
      }
    });
  };

  const zoomToCBD = () => {
    if (!map.current) return;

    map.current.flyTo({
      center: [NAIROBI_CBD_CENTER.longitude, NAIROBI_CBD_CENTER.latitude],
      zoom: 14,
      duration: 1000
    });
  };

  const zoomToLocation = (location) => {
    if (!map.current || !location) return;

    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 16,
      duration: 1000
    });
  };

  const getStyleDisplayName = (styleKey) => {
    const names = {
      'streets': 'Streets',
      'satellite': 'Satellite',
      'satellite-streets': 'Satellite + Streets',
      'light': 'Light',
      'dark': 'Dark',
      'outdoors': 'Outdoors',
      'navigation-day': 'Navigation Day',
      'navigation-night': 'Navigation Night'
    };
    return names[styleKey] || styleKey;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-300"
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Style Switcher */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Map Style</span>
          </div>
          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
            {['streets', 'satellite', 'satellite-streets', 'light', 'dark', 'outdoors'].map(styleKey => (
              <button
                key={styleKey}
                onClick={() => switchMapStyle(styleKey)}
                className={`w-full text-left px-2 py-1 text-xs rounded ${
                  currentStyle === styleKey
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={`Switch to ${getStyleDisplayName(styleKey)}`}
              >
                {currentStyle === styleKey && '✓ '}
                {getStyleDisplayName(styleKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <button
          onClick={zoomToCBD}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-sm"
          title="Zoom to CBD"
        >
          🏢 CBD
        </button>
        
        {selectedLocation && (
          <button
            onClick={() => zoomToLocation(selectedLocation)}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-sm"
            title="Zoom to selected location"
          >
            📍 Selected
          </button>
        )}
        
        {currentLocation && (
          <button
            onClick={() => zoomToLocation(currentLocation)}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-sm"
            title="Zoom to current location"
          >
            🎯 Current
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
        <h4 className="text-sm font-medium mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded mr-2"></div>
            <span>Nairobi CBD</span>
          </div>
          {showBufferZone && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 bg-opacity-10 border-2 border-yellow-400 border-dashed rounded mr-2"></div>
              <span>Buffer Zone ({bufferDistance}km)</span>
            </div>
          )}
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Selected Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Current Location</span>
          </div>
          {showLandmarks && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span>Landmarks</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {selectedLocation && (
        <div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-sm max-w-xs">
          <div className="text-sm">
            <div className="font-medium">{selectedLocation.name}</div>
            <div className="text-gray-600">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </div>
            {(() => {
              const status = getCBDGeofenceStatus(selectedLocation, bufferDistance);
              return (
                <div 
                  className="mt-2 px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: status.backgroundColor,
                    color: status.color
                  }}
                >
                  {status.message}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMapComponent;