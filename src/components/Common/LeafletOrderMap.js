// src/components/Common/LeafletOrderMap.js
// Lightweight Leaflet map (CDN-loaded) for order details

import React, { useEffect, useRef } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const ensureLeafletAssets = () => {
  // CSS
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
  // JS
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.defer = true;
    script.crossOrigin = '';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const fetchRouteBetweenPoints = async (points) => {
  if (points.length < 2) return null;
  try {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Routing failed');
    const data = await response.json();
    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (err) {
    console.error('[Routing] Error fetching route:', err);
  }
  return null;
};

/**
 * LeafletOrderMap
 * Props:
 * - markers: [{ latitude, longitude, name, color?, popup?, index? }]
 * - center: [lng, lat] | null
 * - zoom: number
 * - height: CSS height e.g. '320px'
 * - polyline: boolean - whether to draw a line connecting ordered markers
 * - fitBoundsOnWaypoints: boolean - only fit bounds when waypoints (not live location) change
 */
const LeafletOrderMap = ({ markers = [], center = null, zoom = 13, height = '320px', polyline = true, fitBoundsOnWaypoints = false }) => {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const waypointLayerRef = useRef(null);
  const routeLineRef = useRef(null);
  const lastWaypointsRef = useRef(null);
  const mapReadyRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Inject waypoint pulse animation styles
  useEffect(() => {
    const styleId = 'leaflet-waypoint-pulse-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes waypoint-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        .waypoint-pulse {
          animation: waypoint-pulse 2s infinite;
        }
        .custom-waypoint-marker {
          background: transparent !important;
          border: none !important;
        }
        .waypoint-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .waypoint-popup .leaflet-popup-content {
          margin: 12px;
        }
        .waypoint-route-line {
          z-index: 100 !important;
        }
        @keyframes rider-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }
        .rider-location-marker {
          animation: rider-pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    console.log('[Leaflet] Ensuring assets...');
    ensureLeafletAssets()
      .then((L) => {
        console.log('[Leaflet] Assets ready');
        if (disposed) return;
        if (!mapRef.current) {
          // Default Nairobi if no center
          const initialCenter = center ? [center[1], center[0]] : [-1.286389, 36.817223];

          if (!mapEl.current) {
            console.error('[Leaflet] Map container missing');
            return;
          }
          const container = mapEl.current;
          console.log('[Leaflet] Container size:', container.offsetWidth, container.offsetHeight, 'style.height=', container.style.height);

          mapRef.current = L.map(container, { tapTolerance: 25 }).setView(initialCenter, zoom || 13);

          const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapRef.current);

          tile.on('load', () => console.log('[Leaflet] Tiles loaded'));
          tile.on('tileerror', (e) => console.error('[Leaflet] Tile error', e));
          mapRef.current.on('load', () => console.log('[Leaflet] Map load event'));

          layerRef.current = L.layerGroup().addTo(mapRef.current);
          waypointLayerRef.current = L.layerGroup().addTo(mapRef.current);
          
          // Mark map as ready
          mapReadyRef.current = true;
          
          // Ensure proper sizing when container becomes visible
          setTimeout(() => { 
            try { 
              if (mapRef.current && mapEl.current && mapEl.current.offsetParent !== null) {
                mapRef.current.invalidateSize(); 
                console.log('[Leaflet] invalidateSize() called'); 
              }
            } catch(e) { 
              console.error('[Leaflet] invalidateSize error', e); 
            } 
          }, 100);
        }
      })
      .catch((e) => { console.error('[Leaflet] Failed to load assets', e); });

    return () => {
      disposed = true;
      mapReadyRef.current = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('[Leaflet] Error removing map:', e);
        }
        mapRef.current = null;
        layerRef.current = null;
        waypointLayerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  // Custom waypoint detection function
  const isWaypointMarker = (marker) => {
    // Check if marker has index property (primary waypoint identifier)
    if (marker.index !== undefined && marker.index !== null && marker.index >= 0) {
      console.log('[Leaflet] ✓ Waypoint detected by index:', marker.index, marker.name);
      return true;
    }
    // Check if marker name suggests it's a waypoint
    const name = (marker.name || '').toLowerCase();
    if (name.includes('waypoint') || name.includes('stop') || name.includes('intermediate')) {
      console.log('[Leaflet] ✓ Waypoint detected by name:', marker.name);
      return true;
    }
    // Check if color is purple (waypoint color)
    if (marker.color && (marker.color.includes('9333ea') || marker.color.includes('a855f7') || marker.color.includes('8b5cf6'))) {
      console.log('[Leaflet] ✓ Waypoint detected by color:', marker.color, marker.name);
      return true;
    }
    console.log('[Leaflet] ✗ Not a waypoint:', marker.name, 'index:', marker.index, 'color:', marker.color);
    return false;
  };

  // Custom waypoint icon creation
  const createWaypointIcon = (L, index, color = '#9333ea') => {
    const size = 44;
    const innerSize = 36;
    const number = String(index + 1);
    
    return L.divIcon({
      className: 'custom-waypoint-marker',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
          <!-- Outer pulse ring -->
          <div class="waypoint-pulse" style="
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${color};
            opacity: 0.3;
            z-index: 1;
          "></div>
          <!-- Middle ring -->
          <div style="
            position: absolute;
            width: ${size - 4}px;
            height: ${size - 4}px;
            border-radius: 50%;
            background: ${color};
            opacity: 0.5;
            z-index: 2;
          "></div>
          <!-- Main marker -->
          <div style="
            position: relative;
            width: ${innerSize}px;
            height: ${innerSize}px;
            border-radius: 50%;
            background: ${color};
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 0 2px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 18px;
            z-index: 3;
            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          ">${number}</div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Helper function to check if map is valid and ready
  const isMapReady = () => {
    return (
      window.L && 
      mapRef.current && 
      mapEl.current && 
      mapReadyRef.current &&
      mapEl.current.offsetParent !== null && // Container is visible
      !mapRef.current._destroyed
    );
  };

  // Update markers whenever array changes
  useEffect(() => {
    if (!isMapReady()) { 
      console.log('[Leaflet] Markers update skipped (map not ready)'); 
      return; 
    }
    const L = window.L;
    
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    if (!waypointLayerRef.current) {
      waypointLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    console.log('[Leaflet] ========== MARKER UPDATE START ==========');
    console.log('[Leaflet] Total markers received:', markers?.length || 0);
    console.log('[Leaflet] Raw markers:', markers);

    // Clear existing layers
    layerRef.current.clearLayers();
    waypointLayerRef.current.clearLayers();
    if (routeLineRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const bounds = L.latLngBounds([]);
    
    // Process all markers
    const processedMarkers = (markers || [])
      .map((m, idx) => {
        const lat = Number(m.latitude);
        const lng = Number(m.longitude);
        const processed = {
          lat,
          lng,
          name: m.name || '',
          color: m.color,
          popup: m.popup,
          index: m.index,
          original: m
        };
        
        // Log all marker coordinates for debugging
        if (idx < 5) {
          console.log(`[Leaflet] Marker ${idx} (${processed.name}):`, {
            lat: processed.lat,
            lng: processed.lng,
            color: processed.color,
            isAssistant: (processed.name || '').toLowerCase().includes('assistant'),
            note: 'Nairobi center is ~[-1.286, 36.817]'
          });
        }
        return processed;
      })
      .filter(m => {
        const isValid = Number.isFinite(m.lat) && Number.isFinite(m.lng);
        if (!isValid) {
          console.warn('[Leaflet] Invalid marker coordinates:', m);
        }
        return isValid;
      });

    console.log('[Leaflet] Processed markers:', processedMarkers.length);
    console.log('[Leaflet] Processed markers details:', processedMarkers.map(m => ({
      name: m.name,
      index: m.index,
      color: m.color,
      lat: m.lat.toFixed(4),
      lng: m.lng.toFixed(4)
    })));

    // Separate waypoints from other markers using custom detection
    const waypointMarkers = [];
    const regularMarkers = [];

    processedMarkers.forEach(m => {
      if (isWaypointMarker(m)) {
        // Ensure waypoint has an index
        if (m.index === undefined || m.index === null) {
          m.index = waypointMarkers.length;
        }
        waypointMarkers.push(m);
      } else {
        regularMarkers.push(m);
      }
    });

    // Sort waypoints by index
    waypointMarkers.sort((a, b) => a.index - b.index);

    console.log('[Leaflet] ========== WAYPOINT ANALYSIS ==========');
    console.log('[Leaflet] Waypoints found:', waypointMarkers.length);
    console.log('[Leaflet] Waypoint details:', waypointMarkers.map(w => ({
      index: w.index,
      name: w.name,
      color: w.color,
      lat: w.lat.toFixed(4),
      lng: w.lng.toFixed(4)
    })));
    console.log('[Leaflet] Regular markers:', regularMarkers.length);

    // Draw waypoint route line FIRST (so it appears behind markers)
    if (polyline && waypointMarkers.length >= 2) {
      console.log('[Leaflet] Drawing route line for', waypointMarkers.length, 'waypoints');
      (async () => {
        // Check if map is still valid before async operations
        if (!isMapReady()) {
          console.warn('[Leaflet] Map not ready, skipping route line');
          return;
        }
        
        const orderedWaypoints = [...waypointMarkers].sort((a, b) => a.index - b.index);
        
        // Validate waypoint coordinates before routing
        const validWaypoints = orderedWaypoints.filter(w => Number.isFinite(w.lat) && Number.isFinite(w.lng));
        if (validWaypoints.length !== orderedWaypoints.length) {
          console.warn('[Leaflet] Some waypoints have invalid coordinates, filtered from route');
        }
        
        if (validWaypoints.length < 2) {
          console.warn('[Leaflet] Not enough valid waypoints for route line');
          return;
        }
        
        const routeCoords = await fetchRouteBetweenPoints(validWaypoints);
        
        // Check again after async operation
        if (!isMapReady()) {
          console.warn('[Leaflet] Map not ready after route fetch, skipping route line');
          return;
        }
        
        try {
          // Validate route coordinates
          let validRouteCoords = routeCoords;
          if (routeCoords && routeCoords.length > 0) {
            validRouteCoords = routeCoords.filter(coord => Array.isArray(coord) && Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
            if (validRouteCoords.length < routeCoords.length) {
              console.warn('[Leaflet] Filtered invalid route coordinates:', routeCoords.length, '=>', validRouteCoords.length);
            }
          }
          
          if (validRouteCoords && validRouteCoords.length >= 2) {
            try {
              const polyline = L.polyline(validRouteCoords, {
                color: '#9333ea',
                weight: 6,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'waypoint-route-line'
              });
              polyline.addTo(mapRef.current);
              routeLineRef.current = polyline;
              console.log('[Leaflet] Route line drawn with', validRouteCoords.length, 'points');
            } catch (polyErr) {
              console.error('[Leaflet] Failed to draw route polyline:', polyErr);
              console.warn('[Leaflet] Coords that failed:', validRouteCoords.slice(0, 3));
            }
          } else {
            // Fallback: straight line with validated points
            const fallbackPoints = validWaypoints.map(m => [m.lat, m.lng]).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
            if (fallbackPoints.length >= 2) {
              try {
                const polyline = L.polyline(fallbackPoints, {
                  color: '#9333ea',
                  weight: 6,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                  className: 'waypoint-route-line'
                });
                polyline.addTo(mapRef.current);
                routeLineRef.current = polyline;
                console.log('[Leaflet] Fallback straight line drawn with', fallbackPoints.length, 'points');
              } catch (polyErr) {
                console.error('[Leaflet] Failed to draw fallback polyline:', polyErr);
              }
            } else {
              console.warn('[Leaflet] Not enough valid fallback points for polyline:', fallbackPoints.length);
            }
          }
        } catch (e) {
          console.error('[Leaflet] Error drawing route line:', e);
        }
      })();
    }

    // Render waypoints with custom styling
    waypointMarkers.forEach((m, idx) => {
      if (!isMapReady()) {
        console.warn('[Leaflet] Map not ready, skipping waypoint marker');
        return;
      }
      
      // Validate coordinates before rendering
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) {
        console.warn('[Leaflet] ⚠️ Skipping waypoint marker with invalid coordinates:', { index: m.index, name: m.name, lat: m.lat, lng: m.lng });
        return;
      }
      
      try {
        const waypointColor = m.color || '#9333ea';
        const icon = createWaypointIcon(L, m.index, waypointColor);
        
        const marker = L.marker([m.lat, m.lng], {
          icon,
          riseOnHover: true,
          zIndexOffset: 2000 + m.index // Waypoints always on top
        });
        
        marker.addTo(waypointLayerRef.current);
        
        const popupContent = m.popup || `<div style="text-align: center;"><strong style="color: ${waypointColor}; font-size: 16px;">Waypoint #${m.index + 1}</strong><br/><span style="color: #666;">${m.name || 'Waypoint'}</span></div>`;
        marker.bindPopup(popupContent, {
          className: 'waypoint-popup',
          maxWidth: 280,
          closeButton: true
        });
        
        bounds.extend([m.lat, m.lng]);
        
        console.log('[Leaflet] ✓ Waypoint marker added:', {
          index: m.index,
          name: m.name,
          position: [m.lat.toFixed(7), m.lng.toFixed(7)],
          lat: m.lat,
          lng: m.lng,
          markerPosition: [m.lat, m.lng]
        });
      } catch (e) {
        console.error('[Leaflet] Error adding waypoint marker:', e);
      }
    });

    // Render regular markers (pickup, delivery, assistant)
    regularMarkers.forEach((m) => {
      if (!isMapReady()) {
        console.warn('[Leaflet] Map not ready, skipping regular marker');
        return;
      }
      
      // Validate coordinates before rendering
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) {
        console.warn('[Leaflet] ⚠️ Skipping regular marker with invalid coordinates:', { name: m.name, lat: m.lat, lng: m.lng });
        return;
      }
      
      try {
        const isPickup = (m.name || '').toLowerCase().includes('pickup');
        const isDelivery = (m.name || '').toLowerCase().includes('delivery');
        const isRider = (m.name || '').toLowerCase().includes('assistant') || 
                       m.type === 'rider' || 
                       m.type === 'assistant' ||
                       (m.original && (m.original.type === 'assistant' || m.original.type === 'rider'));
        
        const markerSize = isRider ? 32 : 28;
        const markerColor = m.color || (isPickup ? '#22c55e' : isDelivery ? '#ef4444' : '#3b82f6');
        
        // Create pulsing blue marker for riders
        if (isRider) {
          const icon = L.divIcon({
            className: 'rider-location-marker',
            html: `<div style="
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 50%;
              background: ${markerColor};
              border: 3px solid white;
              box-shadow: 0 2px 12px rgba(59, 130, 246, 0.8);
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: white;
                position: absolute;
              "></div>
            </div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2]
          });
          
          // Log coordinates before creating marker
          console.log('[Leaflet] Creating rider marker:', {
            name: m.name,
            lat: m.lat,
            lng: m.lng,
            latPrecise: m.lat.toFixed(7),
            lngPrecise: m.lng.toFixed(7),
            markerPosition: [m.lat, m.lng],
            original: m.original
          });
          
          const marker = L.marker([m.lat, m.lng], {
            icon,
            riseOnHover: true,
            riseOffset: 2500,
            zIndexOffset: 2500
          });
          
          marker.addTo(layerRef.current);
          
          // Verify marker position after creation
          const markerLatLng = marker.getLatLng();
          console.log('[Leaflet] Rider marker created at:', {
            requested: [m.lat, m.lng],
            actual: [markerLatLng.lat, markerLatLng.lng],
            match: Math.abs(markerLatLng.lat - m.lat) < 0.0001 && Math.abs(markerLatLng.lng - m.lng) < 0.0001
          });
          
          if (m.popup) {
            marker.bindPopup(m.popup);
          } else if (m.name) {
            marker.bindPopup(m.name);
          }
          
          bounds.extend([m.lat, m.lng]);
          console.log('[Leaflet] ✓ Rider location marker added (pulsing blue):', m.name);
        } else {
          // Regular pickup/delivery markers
          const icon = L.divIcon({
            className: 'regular-marker',
            html: `<div style="
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 50%;
              background: ${markerColor};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            "></div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2]
          });
          
          const marker = L.marker([m.lat, m.lng], {
            icon,
            riseOnHover: true,
            zIndexOffset: 1000
          });
          
          marker.addTo(layerRef.current);
          
          if (m.popup) {
            marker.bindPopup(m.popup);
          } else if (m.name) {
            marker.bindPopup(m.name);
          }
          
          bounds.extend([m.lat, m.lng]);
          console.log('[Leaflet] ✓ Regular marker added:', m.name);
        }
      } catch (e) {
        console.error('[Leaflet] Error adding regular marker:', e);
      }
    });

    // Fit bounds
    if (bounds.isValid() && isMapReady()) {
      try {
        mapRef.current.fitBounds(bounds.pad(0.2));
        console.log('[Leaflet] ✓ Bounds fitted');
      } catch (e) {
        console.error('[Leaflet] fitBounds error', e);
      }
    }

    lastWaypointsRef.current = waypointMarkers;
    console.log('[Leaflet] ========== MARKER UPDATE COMPLETE ==========');
  }, [markers, polyline, fitBoundsOnWaypoints]);

  // Update center/zoom when provided
  useEffect(() => {
    if (!isMapReady() || !center) return;
    try {
      mapRef.current.setView([center[1], center[0]], zoom || mapRef.current.getZoom());
      setTimeout(() => { 
        try { 
          if (isMapReady()) {
            mapRef.current.invalidateSize(); 
          }
        } catch(e) {
          console.error('[Leaflet] invalidateSize error in center update:', e);
        } 
      }, 50);
    } catch (e) {
      console.error('[Leaflet] setView error:', e);
    }
  }, [center, zoom]);

  const toggleFullscreen = async () => {
    if (!mapEl.current) return;
    
    try {
      if (!isFullscreen) {
        if (mapEl.current.requestFullscreen) {
          await mapEl.current.requestFullscreen();
        } else if (mapEl.current.webkitRequestFullscreen) {
          await mapEl.current.webkitRequestFullscreen();
        } else if (mapEl.current.mozRequestFullScreen) {
          await mapEl.current.mozRequestFullScreen();
        } else if (mapEl.current.msRequestFullscreen) {
          await mapEl.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
        setTimeout(() => { 
          try { 
            if (isMapReady()) {
              mapRef.current.invalidateSize(); 
            }
          } catch(e) {
            console.error('[Leaflet] invalidateSize error after fullscreen:', e);
          } 
        }, 100);
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
        setTimeout(() => { 
          try { 
            if (isMapReady()) {
              mapRef.current.invalidateSize(); 
            }
          } catch(e) {
            console.error('[Leaflet] invalidateSize error after exit fullscreen:', e);
          } 
        }, 100);
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
      style={{ height: isFullscreen ? '100vh' : height, width: '100%' }} 
      className="relative"
    >
      <div 
        ref={mapEl} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-300"
      />
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-[1000] bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-100 shadow-lg transition-all duration-200"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        <svg 
          className="w-5 h-5 text-gray-700" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isFullscreen ? (
            // Compress/Exit fullscreen icon
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          ) : (
            // Expand/Enter fullscreen icon
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          )}
        </svg>
      </button>
    </div>
  );
};

export default LeafletOrderMap;