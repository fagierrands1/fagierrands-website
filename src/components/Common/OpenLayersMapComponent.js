// src/components/Common/OpenLayersMapComponent.js
import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, XYZ } from 'ol/source';
import { Feature } from 'ol';
import { Point, Polygon, Circle as CircleGeom } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Icon, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls, ScaleLine, FullScreen } from 'ol/control';
import { Select, Modify, Draw } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { FaMapMarkerAlt, FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import {
  NAIROBI_CBD_COORDINATES,
  NAIROBI_CBD_CENTER,
  CBD_LANDMARKS,
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  createCBDBufferZone
} from '../../utils/nairobiCBDGeofence';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { createCachedMapboxSource } from '../../utils/cachedMapboxSource';
import 'ol/ol.css';

const OpenLayersMapComponent = ({
  onLocationSelect,
  onGeofenceStatusChange,
  selectedLocation,
  currentLocation,
  bufferDistance = 1,
  restrictToCBD = false,
  showLandmarks = true,
  showBufferZone = true,
  height = '500px',
  className = ''
}) => {
  const mapRef = useRef();
  const mapInstanceRef = useRef();
  const vectorLayerRef = useRef();
  const markerLayerRef = useRef();
  const baseLayers = useRef({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentBaseLayer, setCurrentBaseLayer] = useState('satellite_streets');
  const [cacheStats, setCacheStats] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create base layers
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: currentBaseLayer === 'osm'
    });

    // Create cached Mapbox layers for better performance and reduced API usage
    const mapboxSatelliteLayer = new TileLayer({
      source: createCachedMapboxSource('satellite', { 
        preloadArea: currentBaseLayer === 'satellite' 
      }),
      visible: currentBaseLayer === 'satellite'
    });

    const mapboxSatelliteStreetsLayer = new TileLayer({
      source: createCachedMapboxSource('satellite_streets', { 
        preloadArea: currentBaseLayer === 'satellite_streets' 
      }),
      visible: currentBaseLayer === 'satellite_streets'
    });

    const mapboxStreetsLayer = new TileLayer({
      source: createCachedMapboxSource('streets'),
      visible: currentBaseLayer === 'streets'
    });

    const mapboxLightLayer = new TileLayer({
      source: createCachedMapboxSource('light'),
      visible: currentBaseLayer === 'light'
    });

    const mapboxDarkLayer = new TileLayer({
      source: createCachedMapboxSource('dark'),
      visible: currentBaseLayer === 'dark'
    });

    const mapboxOutdoorsLayer = new TileLayer({
      source: createCachedMapboxSource('outdoors'),
      visible: currentBaseLayer === 'outdoors'
    });

    // Store base layers for switching
    baseLayers.current = {
      osm: osmLayer,
      satellite: mapboxSatelliteLayer,
      satellite_streets: mapboxSatelliteStreetsLayer,
      streets: mapboxStreetsLayer,
      light: mapboxLightLayer,
      dark: mapboxDarkLayer,
      outdoors: mapboxOutdoorsLayer
    };

    // Create vector sources for different layers
    const vectorSource = new VectorSource();
    const markerSource = new VectorSource();

    // Create vector layers
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => getFeatureStyle(feature)
    });

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: (feature) => getMarkerStyle(feature)
    });

    vectorLayerRef.current = vectorLayer;
    markerLayerRef.current = markerLayer;

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        osmLayer,
        mapboxSatelliteLayer,
        mapboxSatelliteStreetsLayer,
        mapboxStreetsLayer,
        mapboxLightLayer,
        mapboxDarkLayer,
        mapboxOutdoorsLayer,
        vectorLayer,
        markerLayer
      ],
      view: new View({
        center: fromLonLat([NAIROBI_CBD_CENTER.longitude, NAIROBI_CBD_CENTER.latitude]),
        zoom: 14
      }),
      controls: defaultControls().extend([
        new ScaleLine(),
        new FullScreen()
      ])
    });

    mapInstanceRef.current = map;

    // Add click handler
    map.on('click', handleMapClick);

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

    setIsMapReady(true);

    return () => {
      map.setTarget(null);
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

  const getFeatureStyle = (feature) => {
    const featureType = feature.get('type');
    
    switch (featureType) {
      case 'cbd-polygon':
        return new Style({
          fill: new Fill({
            color: 'rgba(34, 197, 94, 0.2)' // Green with transparency
          }),
          stroke: new Stroke({
            color: '#22c55e',
            width: 2
          })
        });
      
      case 'buffer-zone':
        return new Style({
          fill: new Fill({
            color: 'rgba(251, 191, 36, 0.1)' // Yellow with transparency
          }),
          stroke: new Stroke({
            color: '#fbbf24',
            width: 2,
            lineDash: [5, 5]
          })
        });
      
      default:
        return new Style({
          fill: new Fill({
            color: 'rgba(59, 130, 246, 0.3)'
          }),
          stroke: new Stroke({
            color: '#3b82f6',
            width: 2
          })
        });
    }
  };

  const getMarkerStyle = (feature) => {
    const markerType = feature.get('markerType');
    const status = feature.get('status');
    
    let color = '#3b82f6'; // Default blue
    let size = 8;
    
    switch (markerType) {
      case 'selected':
        color = '#ef4444'; // Red
        size = 10;
        break;
      case 'current':
        color = '#10b981'; // Green
        size = 10;
        break;
      case 'landmark':
        color = '#8b5cf6'; // Purple
        size = 6;
        break;
    }

    // Adjust color based on geofence status
    if (status) {
      switch (status.zone) {
        case 'inside_cbd':
          color = '#22c55e'; // Green
          break;
        case 'buffer_zone':
          color = '#f59e0b'; // Orange
          break;
        case 'outside':
          color = '#ef4444'; // Red
          break;
      }
    }

    return new Style({
      image: new CircleStyle({
        radius: size,
        fill: new Fill({
          color: color
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      }),
      text: feature.get('label') ? new Text({
        text: feature.get('label'),
        offsetY: -20,
        fill: new Fill({
          color: '#000000'
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        }),
        font: '12px Arial'
      }) : undefined
    });
  };

  const handleMapClick = (event) => {
    const coordinate = event.coordinate;
    const [longitude, latitude] = toLonLat(coordinate);
    
    const location = {
      latitude,
      longitude,
      name: `Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
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
    if (!vectorLayerRef.current) return;

    // Convert coordinates to OpenLayers format
    const coordinates = NAIROBI_CBD_COORDINATES.map(coord => fromLonLat(coord));
    
    const polygon = new Polygon([coordinates]);
    const feature = new Feature({
      geometry: polygon,
      type: 'cbd-polygon',
      name: 'Nairobi CBD'
    });

    vectorLayerRef.current.getSource().addFeature(feature);
  };

  const addBufferZone = () => {
    updateBufferZone();
  };

  const updateBufferZone = () => {
    if (!vectorLayerRef.current) return;

    // Remove existing buffer zone
    const source = vectorLayerRef.current.getSource();
    const features = source.getFeatures();
    const bufferFeatures = features.filter(f => f.get('type') === 'buffer-zone');
    bufferFeatures.forEach(f => source.removeFeature(f));

    if (!showBufferZone) return;

    try {
      // Create buffer zone using Turf.js
      const bufferZone = createCBDBufferZone(bufferDistance);
      if (!bufferZone) return;

      // Convert buffer zone coordinates to OpenLayers format
      const bufferCoordinates = bufferZone.geometry.coordinates[0].map(coord => fromLonLat(coord));
      
      const bufferPolygon = new Polygon([bufferCoordinates]);
      const bufferFeature = new Feature({
        geometry: bufferPolygon,
        type: 'buffer-zone',
        name: `CBD Buffer Zone (${bufferDistance}km)`
      });

      source.addFeature(bufferFeature);
    } catch (error) {
      console.error('Error creating buffer zone:', error);
    }
  };

  const addLandmarks = () => {
    if (!markerLayerRef.current) return;

    Object.entries(CBD_LANDMARKS).forEach(([key, landmark]) => {
      const point = new Point(fromLonLat([landmark.longitude, landmark.latitude]));
      const feature = new Feature({
        geometry: point,
        markerType: 'landmark',
        name: landmark.name,
        label: landmark.name
      });

      markerLayerRef.current.getSource().addFeature(feature);
    });
  };

  const updateSelectedLocationMarker = () => {
    if (!markerLayerRef.current || !selectedLocation) return;

    const source = markerLayerRef.current.getSource();
    
    // Remove existing selected marker
    const features = source.getFeatures();
    const selectedFeatures = features.filter(f => f.get('markerType') === 'selected');
    selectedFeatures.forEach(f => source.removeFeature(f));

    // Add new selected marker
    const point = new Point(fromLonLat([selectedLocation.longitude, selectedLocation.latitude]));
    const status = getCBDGeofenceStatus(selectedLocation, bufferDistance);
    
    const feature = new Feature({
      geometry: point,
      markerType: 'selected',
      name: selectedLocation.name || 'Selected Location',
      status: status,
      label: selectedLocation.name
    });

    source.addFeature(feature);

    // Center map on selected location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([selectedLocation.longitude, selectedLocation.latitude]),
        duration: 1000
      });
    }
  };

  const updateCurrentLocationMarker = () => {
    if (!markerLayerRef.current || !currentLocation) return;

    const source = markerLayerRef.current.getSource();
    
    // Remove existing current location marker
    const features = source.getFeatures();
    const currentFeatures = features.filter(f => f.get('markerType') === 'current');
    currentFeatures.forEach(f => source.removeFeature(f));

    // Add new current location marker
    const point = new Point(fromLonLat([currentLocation.longitude, currentLocation.latitude]));
    const status = getCBDGeofenceStatus(currentLocation, bufferDistance);
    
    const feature = new Feature({
      geometry: point,
      markerType: 'current',
      name: 'Current Location',
      status: status,
      label: 'You are here'
    });

    source.addFeature(feature);
  };

  const zoomToCBD = () => {
    if (!mapInstanceRef.current) return;

    const view = mapInstanceRef.current.getView();
    view.animate({
      center: fromLonLat([NAIROBI_CBD_CENTER.longitude, NAIROBI_CBD_CENTER.latitude]),
      zoom: 14,
      duration: 1000
    });
  };

  const zoomToLocation = (location) => {
    if (!mapInstanceRef.current || !location) return;

    const view = mapInstanceRef.current.getView();
    view.animate({
      center: fromLonLat([location.longitude, location.latitude]),
      zoom: 16,
      duration: 1000
    });
  };

  const switchBaseLayer = (layerKey) => {
    if (!baseLayers.current || !mapInstanceRef.current) return;

    // Hide all base layers
    Object.values(baseLayers.current).forEach(layer => {
      layer.setVisible(false);
    });

    // Show selected layer
    if (baseLayers.current[layerKey]) {
      baseLayers.current[layerKey].setVisible(true);
      setCurrentBaseLayer(layerKey);
    }
  };

  const getLayerDisplayName = (layerKey) => {
    const names = {
      osm: 'OpenStreetMap',
      satellite: 'Satellite 🛰️',
      satellite_streets: 'Satellite + Streets 🛰️📍',
      streets: 'Streets',
      light: 'Light',
      dark: 'Dark',
      outdoors: 'Outdoors'
    };
    return names[layerKey] || layerKey;
  };

  const updateCacheStats = () => {
    if (!baseLayers.current[currentBaseLayer]) return;
    
    const layer = baseLayers.current[currentBaseLayer];
    const source = layer.getSource();
    
    if (source && typeof source.getCacheStats === 'function') {
      const stats = source.getCacheStats();
      setCacheStats(stats);
    }
  };

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [currentBaseLayer]);

  const clearMapCache = async () => {
    try {
      // Clear cache for all Mapbox layers
      Object.values(baseLayers.current).forEach(layer => {
        const source = layer.getSource();
        if (source && typeof source.clearCache === 'function') {
          source.clearCache();
        }
      });
      
      setCacheStats(null);
      console.log('🗑️ Map cache cleared');
    } catch (error) {
      console.error('Error clearing map cache:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-300"
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Layer Switcher */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Map Style</span>
          </div>
          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
            {Object.keys(baseLayers.current).map(layerKey => (
              <button
                key={layerKey}
                onClick={() => switchBaseLayer(layerKey)}
                className={`w-full text-left px-2 py-1 text-xs rounded ${
                  currentBaseLayer === layerKey
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={`Switch to ${getLayerDisplayName(layerKey)}`}
              >
                {currentBaseLayer === layerKey && '✓ '}
                {getLayerDisplayName(layerKey)}
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
        
        {/* Cache Management */}
        {currentBaseLayer.includes('satellite') && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-3 py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Cache</span>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={updateCacheStats}
                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
                title="Refresh cache statistics"
              >
                📊 Refresh Stats
              </button>
              <button
                onClick={clearMapCache}
                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600"
                title="Clear map cache"
              >
                🗑️ Clear Cache
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-sm max-w-xs">
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
        
        {/* Cache Statistics */}
        {cacheStats && currentBaseLayer.includes('satellite') && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <h5 className="text-xs font-medium mb-1">Cache Stats 📊</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Hit Rate: {cacheStats.hitRate}</div>
              <div>Requests: {cacheStats.requestCount}</div>
              {cacheStats.globalStats && (
                <div>Size: {cacheStats.globalStats.cacheSizeMB}MB</div>
              )}
            </div>
          </div>
        )}
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

export default OpenLayersMapComponent;