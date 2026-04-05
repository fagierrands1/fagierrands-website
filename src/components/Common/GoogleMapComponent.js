import React, { useState, useEffect, useRef } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/loadGoogleMaps';
import { getDirectionsRoute, decodePolyline } from '../../services/directionsService';

const GoogleMapComponent = ({
  onLocationSelect,
  onGeofenceStatusChange,
  selectedLocation,
  currentLocation,
  markers = [],
  trackingData = null,
  showRoute = false,
  routeCoordinates = [],
  height = '500px',
  className = '',
  center = null,
  zoom = 14,
  showControls = true,
  pickupLocation = null,
  deliveryLocation = null,
  selectable = false
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const markersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const infoWindowRef = useRef(null);
  const initializationAttempt = useRef(false);
  const initializationTimeouts = useRef([]);

  const createMarkerIcon = (color, type) => {
    if (!window.google || !window.google.maps) {
      console.warn('[GoogleMapComponent] Google Maps not available for marker icon');
      return null;
    }

    const colorMap = {
      pickup: '#22c55e',
      delivery: '#ef4444',
      rider: '#3b82f6',
      assistant: '#3b82f6', // Same color as rider for assistant tracking
      default: color || '#3b82f6'
    };

    const markerColor = colorMap[type] || colorMap.default;

    const icon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: (type === 'rider' || type === 'assistant') ? 12 : 12, // Make assistant markers same size as other markers for visibility
      fillColor: markerColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };

    console.log('[GoogleMapComponent] Created icon:', { type, markerColor, icon });
    return icon;
  };

  useEffect(() => {
    if (initializationAttempt.current || map.current) {
      return;
    }
    initializationAttempt.current = true;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 100;

    const clearAllTimeouts = () => {
      initializationTimeouts.current.forEach(id => clearTimeout(id));
      initializationTimeouts.current = [];
    };

    const scheduleRetry = (fn, delay) => {
      const timeoutId = setTimeout(fn, delay);
      initializationTimeouts.current.push(timeoutId);
      return timeoutId;
    };

    const attemptInitialize = async () => {
      if (!isMounted || map.current) return;

      retryCount++;

      const container = mapContainer.current;
      if (!container) {
        if (retryCount <= MAX_RETRIES) {
          scheduleRetry(attemptInitialize, 100);
        } else {
          if (isMounted) {
            setApiError('Map container not found');
            setApiLoading(false);
          }
        }
        return;
      }

      const width = container.offsetWidth;
      const height = container.offsetHeight;

      if (width === 0 || height === 0) {
        if (retryCount <= MAX_RETRIES) {
          scheduleRetry(attemptInitialize, 100);
        } else {
          if (isMounted) {
            setApiError('Map container has no dimensions. Make sure it is visible.');
            setApiLoading(false);
          }
        }
        return;
      }

      if (!isGoogleMapsLoaded()) {
        try {
          await loadGoogleMaps(GOOGLE_MAPS_CONFIG.API_KEY);
        } catch (err) {
          console.error('[GoogleMapComponent] Failed to load API:', err);
          if (isMounted) {
            setApiError(`Failed to load Google Maps: ${err.message}`);
            setApiLoading(false);
          }
          return;
        }
      }

      if (!window.google?.maps?.Map) {
        if (retryCount <= MAX_RETRIES) {
          scheduleRetry(attemptInitialize, 100);
        } else {
          if (isMounted) {
            setApiError('Google Maps API not available');
            setApiLoading(false);
          }
        }
        return;
      }

      let mapCenter = center;
      if (!mapCenter) {
        if (pickupLocation?.lat || pickupLocation?.latitude) {
          mapCenter = [pickupLocation.lng || pickupLocation.longitude, pickupLocation.lat || pickupLocation.latitude];
        } else if (deliveryLocation?.lat || deliveryLocation?.latitude) {
          mapCenter = [deliveryLocation.lng || deliveryLocation.longitude, deliveryLocation.lat || deliveryLocation.latitude];
        } else {
          mapCenter = [GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng, GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat];
        }
      }

      try {
        if (!isMounted || !mapContainer.current) return;

        console.log('[GoogleMapComponent] About to create map...');
        map.current = new window.google.maps.Map(mapContainer.current, {
          center: { lat: mapCenter[1], lng: mapCenter[0] },
          zoom: zoom,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          fullscreenControl: showControls,
          mapTypeControl: showControls,
          zoomControl: showControls,
          clickableIcons: false,
          disableDefaultUI: false,
          gestureHandling: 'greedy',
          draggable: true,
          scrollwheel: true,
          panControl: false,
          rotateControl: false,
          scaleControl: false
        });

        console.log('[GoogleMapComponent] Map created, map.current:', !!map.current);

        if (isMounted && map.current) {
          console.log('[GoogleMapComponent] Setting isMapReady to true');
          setIsMapReady(true);
          setApiLoading(false);
          try {
            window.google.maps.event.trigger(map.current, 'resize');
          } catch (e) {
            console.warn('[GoogleMapComponent] Resize trigger failed:', e);
          }
        }

      } catch (error) {
        console.error('[GoogleMapComponent] Map creation error:', error);
        if (isMounted) {
          setApiError(`Map initialization error: ${error.message}`);
          setApiLoading(false);
        }
      }
    };

    attemptInitialize();

    const safetyTimer = setTimeout(() => {
      if (isMounted && !map.current) {
        clearAllTimeouts();
        if (!apiError) {
          setApiError('Map initialization timed out. Please refresh the page.');
          setApiLoading(false);
        }
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearAllTimeouts();
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !map.current || !onLocationSelect) return;

    const clickHandler = (e) => {
      const location = {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      };

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: e.latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          location.name = results[0].formatted_address;
        } else {
          location.name = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        }
        if (onLocationSelect && typeof onLocationSelect === 'function') {
          onLocationSelect(location);
        }
      });
    };

    map.current.addListener('click', clickHandler);
    return () => {
      if (map.current && window.google?.maps) {
        try {
          window.google.maps.event.clearListeners(map.current, 'click');
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isMapReady, onLocationSelect]);

  useEffect(() => {
    if (!isMapReady || !Array.isArray(markers)) {
      console.log('[GoogleMapComponent] Markers effect skipped - isMapReady:', isMapReady, 'markers array:', Array.isArray(markers));
      return;
    }

    let retries = 0;
    const maxRetries = 20;

    const tryAddMarkers = () => {
      if (!map.current) {
        retries++;
        if (retries < maxRetries) {
          console.log(`[GoogleMapComponent] map.current not ready yet (attempt ${retries}/${maxRetries}), retrying...`);
          setTimeout(tryAddMarkers, 100);
        } else {
          console.error('[GoogleMapComponent] map.current never became available after max retries');
        }
        return;
      }

      console.log('[GoogleMapComponent] Creating markers:', markers);

      markersRef.current.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (e) {
          // ignore
        }
      });
      markersRef.current = [];

      markers.forEach((markerData, index) => {
        const lat = Number(markerData.latitude);
        const lng = Number(markerData.longitude);

        console.log(`[GoogleMapComponent] Processing marker ${index}:`, { lat, lng, isFinite: Number.isFinite(lat) && Number.isFinite(lng) });

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.warn(`[GoogleMapComponent] Marker ${index} skipped - invalid coordinates`);
          return;
        }

        try {
          const icon = createMarkerIcon(markerData.color, markerData.type);
          console.log(`[GoogleMapComponent] Creating marker icon:`, { type: markerData.type, icon, color: markerData.color });
          
          // If icon creation failed, use default marker
          const markerOptions = {
            position: { lat, lng },
            map: map.current,
            title: markerData.name || `Marker ${index + 1}`
          };
          
          if (icon) {
            markerOptions.icon = icon;
          } else {
            console.warn(`[GoogleMapComponent] Icon creation failed for marker ${index}, using default marker`);
          }
          
          // Ensure assistant/rider markers appear on top
          if (markerData.type === 'assistant' || markerData.type === 'rider') {
            markerOptions.zIndex = 1000;
          }
          
          const marker = new window.google.maps.Marker(markerOptions);

          console.log(`[GoogleMapComponent] Marker ${index} created:`, { marker, type: markerData.type, name: markerData.name, position: { lat, lng } });
          markersRef.current.push(marker);

          if (markerData.popup) {
            marker.addListener('click', () => {
              if (infoWindowRef.current) {
                infoWindowRef.current.close();
              }
              const infoWindow = new window.google.maps.InfoWindow({
                content: markerData.popup
              });
              infoWindowRef.current = infoWindow;
              infoWindow.open(map.current, marker);
            });
          }
        } catch (error) {
          console.error('[GoogleMapComponent] Marker error:', error);
        }
      });

      console.log('[GoogleMapComponent] Total markers created:', markersRef.current.length);

      if (markersRef.current.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        try {
          map.current.fitBounds(bounds);
        } catch (e) {
          console.warn('[GoogleMapComponent] fitBounds error:', e);
        }
      }
    };

    tryAddMarkers();
  }, [markers, isMapReady]);

  useEffect(() => {
    if (!isMapReady || !map.current) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    let isMounted = true;

    const createRoute = async () => {
      if (!isMounted) return;

      if (showRoute && routeCoordinates?.length) {
        const path = routeCoordinates.map(coord => {
          if (Array.isArray(coord)) {
            return { lat: coord[1] || coord[0], lng: coord[0] || coord[1] };
          }
          return { lat: coord.latitude || coord.lat, lng: coord.longitude || coord.lng };
        });

        try {
          routePolylineRef.current = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#9333ea',
            strokeOpacity: 0.85,
            strokeWeight: 6,
            map: map.current
          });
        } catch (e) {
          console.error('[GoogleMapComponent] Polyline error:', e);
        }
        return;
      }

      if (markers?.length >= 2) {
        const pickupMarkers = markers.filter(m => m.type === 'pickup');
        const waypointMarkers = markers.filter(m => m.type === 'waypoint');
        const deliveryMarkers = markers.filter(m => m.type === 'delivery');
        const riderMarkers = markers.filter(m => m.type === 'rider' || m.type === 'assistant');

        if (pickupMarkers.length > 0 || deliveryMarkers.length > 0 || waypointMarkers.length > 0) {
          const orderedMarkers = [
            ...pickupMarkers,
            ...waypointMarkers,
            ...deliveryMarkers,
            ...riderMarkers
          ];

          const validMarkers = orderedMarkers.filter(m =>
            Number.isFinite(Number(m.latitude)) && Number.isFinite(Number(m.longitude))
          );

          if (validMarkers.length >= 2) {
            console.log('[GoogleMapComponent] Requesting directions for', validMarkers.length, 'waypoints');

            const route = await getDirectionsRoute(validMarkers);

            if (!isMounted) return;

            if (route && route.polyline) {
              const decodedPath = decodePolyline(route.polyline);
              console.log('[GoogleMapComponent] Decoded polyline:', decodedPath.length, 'points');

              try {
                routePolylineRef.current = new window.google.maps.Polyline({
                  path: decodedPath,
                  geodesic: false,
                  strokeColor: '#9333ea',
                  strokeOpacity: 0.85,
                  strokeWeight: 4,
                  map: map.current
                });
                console.log('[GoogleMapComponent] Created actual route polyline from directions API');
              } catch (e) {
                console.error('[GoogleMapComponent] Polyline error:', e);
              }
            } else {
              console.warn('[GoogleMapComponent] No route found from directions API, falling back to straight line');
              const straightPath = validMarkers.map(m => ({
                lat: Number(m.latitude),
                lng: Number(m.longitude)
              }));

              try {
                routePolylineRef.current = new window.google.maps.Polyline({
                  path: straightPath,
                  geodesic: true,
                  strokeColor: '#9333ea',
                  strokeOpacity: 0.85,
                  strokeWeight: 4,
                  map: map.current
                });
              } catch (e) {
                console.error('[GoogleMapComponent] Fallback polyline error:', e);
              }
            }
          }
        }
      }
    };

    createRoute();

    return () => {
      isMounted = false;
    };
  }, [routeCoordinates, showRoute, markers, isMapReady]);

  useEffect(() => {
    if (!isMapReady || !map.current || !center) return;
    try {
      const centerCoords = Array.isArray(center)
        ? { lat: center[1], lng: center[0] }
        : { lat: center.latitude || center.lat, lng: center.longitude || center.lng };
      map.current.setCenter(centerCoords);
    } catch (e) {
      console.warn('[GoogleMapComponent] setCenter error:', e);
    }
  }, [center, isMapReady]);

  useEffect(() => {
    return () => {
      if (map.current && window.google?.maps) {
        try {
          window.google.maps.event.clearInstanceListeners(map.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  if (apiError) {
    return (
      <div
        style={{
          width: '100%',
          height: typeof height === 'string' ? height : `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
          padding: '20px',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ marginBottom: '8px', fontWeight: '600' }}>Map Error</div>
          <div>{apiError}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: typeof height === 'string' ? height : `${height}px`,
        minHeight: typeof height === 'string' ? height : `${height}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        ref={mapContainer}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#e5e7eb',
          display: 'block',
          visibility: 'visible',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box'
        }}
      />
      {(apiLoading || (!isMapReady && !apiError)) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6b7280',
            fontSize: '14px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {apiLoading ? 'Loading Google Maps...' : 'Initializing map...'}
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
