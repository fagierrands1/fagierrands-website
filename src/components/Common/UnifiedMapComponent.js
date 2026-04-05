// src/components/Common/UnifiedMapComponent.js
// Unified map component using Mapbox with caching for all map needs

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { useAuth } from '../../contexts/AuthContext';
import {
  NAIROBI_CBD_COORDINATES,
  NAIROBI_CBD_CENTER,
  CBD_LANDMARKS,
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  createCBDBufferZone
} from '../../utils/nairobiCBDGeofence';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token with fallback logging
mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;
if (!mapboxgl.accessToken) {
  // Surface missing token in console to explain blank map
  // eslint-disable-next-line no-console
  console.error('Mapbox token is missing. Set REACT_APP_MAPBOX_TOKEN in your environment.');
}

const UnifiedMapComponent = ({
  // Location handling
  onLocationSelect,
  onGeofenceStatusChange,
  selectedLocation,
  currentLocation,
  
  // Geofencing
  bufferDistance = 1,
  restrictToCBD = false,
  showGeofence = false,
  showLandmarks = false,
  showBufferZone = false,
  
  // Tracking features
  trackingData = null,
  showRoute = false,
  routeCoordinates = [],
  
  // Map appearance
  initialStyle = 'satellite-streets',
  height = '500px',
  className = '',
  showControls = true,
  showStyleSwitcher = true,
  showLegend = true,
  
  // Additional markers
  markers = [],
  
  // Center and zoom
  center = null,
  zoom = 14
}) => {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const wrapperRef = useRef(null);
  const map = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentStyle, setCurrentStyle] = useState(initialStyle);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);

  // Check if user can see style switcher (only admins and assistants)
  const canSeeStyleSwitcher = () => {
    if (!user) return false;
    const role = user.role || user.user_type || user.userType;
    return ['admin', 'assistant', 'handler'].includes(role?.toLowerCase());
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    const mapCenter = center || [NAIROBI_CBD_CENTER.longitude, NAIROBI_CBD_CENTER.latitude];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapboxStyle(initialStyle),
      center: mapCenter,
      zoom: zoom,
      attributionControl: true
    });

    map.current.on('load', () => {
      setIsMapReady(true);

      // Ensure map draws correctly when container becomes visible
      try { map.current.resize(); } catch (_) {}
      setTimeout(() => { try { map.current && map.current.resize(); } catch(_) {} }, 100);
      
      // Add geofencing features if enabled
      if (showGeofence) {
        addCBDPolygon();
      }
      
      // Add buffer zone if enabled
      if (showBufferZone) {
        addBufferZone();
      }
      
      // Add landmarks if enabled
      if (showLandmarks) {
        addLandmarks();
      }

      // Add route if provided
      if (showRoute && routeCoordinates.length > 0) {
        addRoute();
      }
    });

    // Add click handler
    if (onLocationSelect) {
      map.current.on('click', handleMapClick);
    }

    // Add navigation controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    }

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

  // Update additional markers
  useEffect(() => {
    if (isMapReady && markers.length > 0) {
      updateAdditionalMarkers();
    }
  }, [markers, isMapReady]);

  // Update route
  useEffect(() => {
    if (isMapReady && showRoute) {
      updateRoute();
    }
  }, [routeCoordinates, showRoute, isMapReady]);

  // Update tracking data
  useEffect(() => {
    if (isMapReady && trackingData) {
      updateTrackingMarkers();
    }
  }, [trackingData, isMapReady]);

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

    // Get geofence status if geofencing is enabled
    if (showGeofence && onGeofenceStatusChange) {
      const status = getCBDGeofenceStatus(location, bufferDistance);
      onGeofenceStatusChange(status);
    }
    
    if (onLocationSelect) {
      onLocationSelect(location);
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

  const addRoute = () => {
    updateRoute();
  };

  const updateRoute = () => {
    if (!map.current || !isMapReady || !showRoute || routeCoordinates.length === 0) return;

    // Remove existing route
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add route source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    });

    // Add route layer
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });
  };

  const updateSelectedLocationMarker = () => {
    if (!map.current || !selectedLocation) return;

    // Remove existing selected marker
    if (markersRef.current.selected) {
      markersRef.current.selected.remove();
    }

    // Add new selected marker
    const status = showGeofence ? getCBDGeofenceStatus(selectedLocation, bufferDistance) : null;
    const color = status ? getMarkerColor(status.zone) : '#ef4444';

    const popupContent = `
      <div>
        <strong>${selectedLocation.name || 'Selected Location'}</strong><br>
        <small>${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}</small>
        ${status ? `<br><span style="color: ${status.color}; background-color: ${status.backgroundColor}; padding: 2px 4px; border-radius: 3px; font-size: 11px;">${status.message}</span>` : ''}
      </div>
    `;

    const marker = new mapboxgl.Marker({
      color: color
    })
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(popupContent))
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
    const status = showGeofence ? getCBDGeofenceStatus(currentLocation, bufferDistance) : null;

    const popupContent = `
      <div>
        <strong>Current Location</strong><br>
        <small>${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</small>
        ${status ? `<br><span style="color: ${status.color}; background-color: ${status.backgroundColor}; padding: 2px 4px; border-radius: 3px; font-size: 11px;">${status.message}</span>` : ''}
      </div>
    `;

    const marker = new mapboxgl.Marker({
      color: '#10b981'
    })
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(popupContent))
      .addTo(map.current);

    markersRef.current.current = marker;
  };

  const updateAdditionalMarkers = () => {
    if (!map.current || !markers.length) return;

    // Remove existing additional markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('additional-')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Add new markers (ignore invalid coordinates)
    markers.forEach((markerData, index) => {
      const lat = Number(markerData.latitude);
      const lng = Number(markerData.longitude);
      if (!isFinite(lat) || !isFinite(lng)) return;
      const marker = new mapboxgl.Marker({
        color: markerData.color || '#3b82f6'
      })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(markerData.popup || markerData.name || 'Marker'))
        .addTo(map.current);

      markersRef.current[`additional-${index}`] = marker;
    });
  };

  const updateTrackingMarkers = () => {
    if (!map.current || !trackingData) return;

    // Remove existing tracking markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('tracking-')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Add pickup marker
    if (trackingData.pickup) {
      const marker = new mapboxgl.Marker({
        color: '#22c55e'
      })
        .setLngLat([trackingData.pickup.longitude, trackingData.pickup.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Pickup</strong><br>${trackingData.pickup.address}`))
        .addTo(map.current);

      markersRef.current['tracking-pickup'] = marker;
    }

    // Add delivery marker
    if (trackingData.delivery) {
      const marker = new mapboxgl.Marker({
        color: '#ef4444'
      })
        .setLngLat([trackingData.delivery.longitude, trackingData.delivery.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Delivery</strong><br>${trackingData.delivery.address}`))
        .addTo(map.current);

      markersRef.current['tracking-delivery'] = marker;
    }

    // Add current position marker
    if (trackingData.currentPosition) {
      const marker = new mapboxgl.Marker({
        color: '#3b82f6'
      })
        .setLngLat([trackingData.currentPosition.longitude, trackingData.currentPosition.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Current Position</strong>`))
        .addTo(map.current);

      markersRef.current['tracking-current'] = marker;
    }
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
    // Guard against switching before map is fully ready
    if (!map.current || !isMapReady) return;
    if (styleKey === currentStyle) return; // no-op if same style

    try {
      const styleUrl = getMapboxStyle(styleKey);
      // Disable diff to avoid sprite/style diff issues on some Mapbox versions
      map.current.setStyle(styleUrl, { diff: false });
      setCurrentStyle(styleKey);

      // Re-add layers/markers only after style fully loads
      map.current.once('style.load', () => {
        try {
          if (showGeofence) addCBDPolygon();
          if (showBufferZone) addBufferZone();
          if (showLandmarks) addLandmarks();
          if (showRoute && routeCoordinates.length > 0) addRoute();
          if (selectedLocation) updateSelectedLocationMarker();
          if (currentLocation) updateCurrentLocationMarker();
          if (markers.length > 0) updateAdditionalMarkers();
          if (trackingData) updateTrackingMarkers();
        } catch (err) {
          console.error('Error re-adding layers after style switch:', err);
        }
      });
    } catch (err) {
      console.error('Error switching map style:', err);
    }
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

  const fitToMarkers = () => {
    if (!map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Add all marker positions to bounds
    Object.values(markersRef.current).forEach(marker => {
      bounds.extend(marker.getLngLat());
      hasMarkers = true;
    });

    if (hasMarkers) {
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const getStyleDisplayName = (styleKey) => {
    const names = {
      'streets': 'Streets',
      'satellite': 'Satellite 🛰️',
      'satellite-streets': 'Satellite + Streets 🛰️📍',
      'light': 'Light',
      'dark': 'Dark',
      'outdoors': 'Outdoors',
      'navigation-day': 'Navigation Day',
      'navigation-night': 'Navigation Night'
    };
    return names[styleKey] || styleKey;
  };

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    
    try {
      if (!isFullscreen) {
        if (wrapperRef.current.requestFullscreen) {
          await wrapperRef.current.requestFullscreen();
        } else if (wrapperRef.current.webkitRequestFullscreen) {
          await wrapperRef.current.webkitRequestFullscreen();
        } else if (wrapperRef.current.mozRequestFullScreen) {
          await wrapperRef.current.mozRequestFullScreen();
        } else if (wrapperRef.current.msRequestFullscreen) {
          await wrapperRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
        setTimeout(() => { if (map.current) map.current.resize(); }, 100);
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
        }
        setIsFullscreen(false);
        setTimeout(() => { if (map.current) map.current.resize(); }, 100);
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ 
        height: isFullscreen ? '100vh' : (typeof height === 'string' ? height : `${height}px`),
        width: '100%',
        minHeight: isFullscreen ? '100vh' : (typeof height === 'string' ? height : `${height}px`)
      }}
    >
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ 
          height: typeof height === 'string' ? height : `${height}px`,
          width: '100%',
          minHeight: typeof height === 'string' ? height : `${height}px`
        }}
        className="rounded-lg overflow-hidden"
      />
      
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 space-y-2">
          {/* Style Switcher - Only for admins, assistants, and handlers */}
          {showStyleSwitcher && canSeeStyleSwitcher() && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
              <div className="px-3 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Map Style</span>
              </div>
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {['satellite-streets', 'satellite', 'streets', 'light', 'dark', 'outdoors'].map(styleKey => (
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
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4m-4 0l5 5m11-5v4m0-4h-4m4 0l-5 5M4 20v-4m0 4h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              )}
            </svg>
          </button>

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

          {(markers.length > 0 || trackingData) && (
            <button
              onClick={fitToMarkers}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-sm"
              title="Fit to all markers"
            >
              🔍 Fit All
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-sm max-w-xs">
          <h4 className="text-sm font-medium mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            {showGeofence && (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded mr-2"></div>
                <span>Nairobi CBD</span>
              </div>
            )}
            {showBufferZone && (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-400 bg-opacity-10 border-2 border-yellow-400 border-dashed rounded mr-2"></div>
                <span>Buffer Zone ({bufferDistance}km)</span>
              </div>
            )}
            {selectedLocation && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Selected Location</span>
              </div>
            )}
            {currentLocation && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Current Location</span>
              </div>
            )}
            {showLandmarks && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span>Landmarks</span>
              </div>
            )}
            {trackingData && (
              <>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Pickup</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Delivery</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Current Position</span>
                </div>
              </>
            )}
            {showRoute && (
              <div className="flex items-center">
                <div className="w-4 h-1 bg-blue-500 rounded mr-2"></div>
                <span>Route</span>
              </div>
            )}
          </div>
          
          {/* Powered by Mapbox indicator */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">🛰️ Powered by Mapbox</div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {selectedLocation && showGeofence && (
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

export default UnifiedMapComponent;