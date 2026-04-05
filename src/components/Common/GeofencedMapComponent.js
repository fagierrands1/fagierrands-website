// src/components/Common/GeofencedMapComponent.js
// Updated to use Google Maps
import React, { useState, useEffect } from 'react';
import GoogleMapComponent from './GoogleMapComponent';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import axios from '../../utils/axiosConfig';
import { FaMapMarkerAlt, FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import {
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  formatGeofenceStatus,
  getNearestCBDEntryPoint
} from '../../utils/nairobiCBDGeofence';

const GeofencedMapComponent = ({
  onLocationSelect,
  onGeofenceStatusChange,
  bufferDistance = 1,
  restrictToCBD = true,
  showLandmarks = true,
  height = '500px',
  className = ''
}) => {
  const { setUserLocation, userLocation } = useLocationContext();
  const [geofenceStatus, setGeofenceStatus] = useState(null);

  // Update geofence status when location changes
  useEffect(() => {
    if (userLocation) {
      const status = getCBDGeofenceStatus(userLocation, bufferDistance);
      const formattedStatus = formatGeofenceStatus(status);
      setGeofenceStatus(formattedStatus);
      
      // Notify parent component of status change
      if (onGeofenceStatusChange) {
        onGeofenceStatusChange(formattedStatus);
      }
    }
  }, [userLocation, bufferDistance, onGeofenceStatusChange]);

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

  const handleLocationSelect = (location) => {
    // Check if location is restricted to CBD
    if (restrictToCBD && !isPointInNairobiCBD(location)) {
      alert('Location selection is restricted to Nairobi CBD area only.');
      return;
    }
    
    // Set temporary location name while geocoding
    const tempLocation = {
      ...location,
      name: 'Getting address...'
    };
    
    setUserLocation(tempLocation);
    
    // Notify parent component immediately with temporary data
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(tempLocation);
    }
    
    // Get actual address
    reverseGeocode(location.latitude, location.longitude);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      
      const locationData = {
        latitude,
        longitude,
        name: response.data.display_name
      };
      
      // Update context
      setUserLocation(locationData);
      
      // Save the location to the backend
      updateLocationInBackend(latitude, longitude, response.data.display_name);
      
      // Notify parent component if callback exists
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
      
      // Update context
      setUserLocation(locationData);
      
      // Notify parent component if callback exists
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
        `/locations/current/update/`,
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

  const handleGeofenceStatusChange = (status) => {
    setGeofenceStatus(status);
    if (onGeofenceStatusChange) {
      onGeofenceStatusChange(status);
    }
  };

  // Determine map center
  const getMapCenter = () => {
    if (userLocation) {
      return [userLocation.longitude, userLocation.latitude];
    }
    return null; // Will use default Nairobi center
  };

  return (
    <div className={`relative ${className}`}>
      <GoogleMapComponent
        onLocationSelect={handleLocationSelect}
        onGeofenceStatusChange={handleGeofenceStatusChange}
        selectedLocation={userLocation}
        height={height}
        center={getMapCenter()}
        showControls={true}
      />
      
      {/* Enhanced Status Display */}
      {geofenceStatus && (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{geofenceStatus.icon}</span>
            <span className="font-semibold text-sm">{geofenceStatus.message}</span>
          </div>
          
          <div 
            className="p-3 rounded-lg text-sm"
            style={{
              backgroundColor: geofenceStatus.backgroundColor,
              color: geofenceStatus.color
            }}
          >
            <div className="font-medium mb-1">Geofence Status</div>
            <div className="text-xs opacity-90">
              {geofenceStatus.zone === 'inside_cbd' && 'You are within the Nairobi CBD area'}
              {geofenceStatus.zone === 'buffer_zone' && `You are ${bufferDistance}km from CBD boundary`}
              {geofenceStatus.zone === 'outside' && 'You are outside the CBD area'}
            </div>
            
            {geofenceStatus.nearestEntry && (
              <div className="text-xs mt-2 opacity-90">
                Nearest CBD entry: {geofenceStatus.nearestEntry.distance.toFixed(2)}km away
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofencedMapComponent;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom search control
const SearchControl = ({ onLocationFound }) => {
  const map = useMap();
  
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    
    const searchControl = new GeoSearchControl({
      provider,
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Search for a location or address',
      style: 'bar',
      autoComplete: true,
      autoCompleteDelay: 250,
    });
    
    map.addControl(searchControl);
    
    map.on('geosearch/showlocation', (result) => {
      const { label, x, y } = result.location;
      onLocationFound(y, x, label);
    });
    
    return () => map.removeControl(searchControl);
  }, [map, onLocationFound]);
  
  return null;
};

const GeofencedMapComponent = ({ 
  location, 
  destination, 
  isTracking, 
  onLocationSelect, 
  showCBDGeofence = true,
  bufferDistance = 1,
  onGeofenceStatusChange,
  restrictToCBD = false
}) => {
  const [mapCenter, setMapCenter] = useState([NAIROBI_CBD_CENTER.latitude, NAIROBI_CBD_CENTER.longitude]);
  const { setUserLocation, userLocation } = useLocationContext();
  const mapRef = useRef(null);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [showBufferZone, setShowBufferZone] = useState(true);
  const [cbdPolygonCoords, setCbdPolygonCoords] = useState([]);
  const [bufferZoneCoords, setBufferZoneCoords] = useState([]);

  // Convert CBD coordinates for Leaflet (lat, lng format)
  useEffect(() => {
    const leafletCoords = NAIROBI_CBD_COORDINATES.map(coord => [coord[1], coord[0]]);
    setCbdPolygonCoords(leafletCoords);

    // Create buffer zone coordinates
    if (showBufferZone && bufferDistance > 0) {
      const bufferZone = createCBDBufferZone(bufferDistance);
      if (bufferZone && bufferZone.geometry && bufferZone.geometry.coordinates[0]) {
        const bufferCoords = bufferZone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        setBufferZoneCoords(bufferCoords);
      }
    }
  }, [bufferDistance, showBufferZone]);

  // Update geofence status when location changes
  useEffect(() => {
    if (userLocation) {
      const status = getCBDGeofenceStatus(userLocation, bufferDistance);
      const formattedStatus = formatGeofenceStatus(status);
      setGeofenceStatus(formattedStatus);
      
      // Notify parent component of status change
      if (onGeofenceStatusChange) {
        onGeofenceStatusChange(formattedStatus);
      }
    }
  }, [userLocation, bufferDistance, onGeofenceStatusChange]);

  // If tracking mode is enabled, use the provided location as center
  useEffect(() => {
    if (isTracking && location) {
      setMapCenter([location.latitude, location.longitude]);
    }
  }, [isTracking, location]);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          
          if (!userLocation) {
            reverseGeocode(latitude, longitude);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
    
    fetchCurrentLocation();
  }, []);

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
        setMapCenter([response.data.latitude, response.data.longitude]);
      }
    } catch (error) {
      console.log("No saved location found");
    }
  };

  const handleLocationFound = (latitude, longitude, name) => {
    // Check if location is restricted to CBD
    if (restrictToCBD && !isPointInNairobiCBD({ latitude, longitude })) {
      alert('Location selection is restricted to Nairobi CBD area only.');
      return;
    }

    setMapCenter([latitude, longitude]);
    
    const locationData = {
      latitude,
      longitude,
      name: name || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
    };
    
    setUserLocation(locationData);
    
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 16);
    }
    
    updateLocationInBackend(latitude, longitude, name);
    
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(locationData);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      
      const locationData = {
        latitude,
        longitude,
        name: response.data.display_name
      };
      
      setUserLocation(locationData);
      updateLocationInBackend(latitude, longitude, response.data.display_name);
      
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
        `/locations/current/update/`,
        { latitude, longitude, address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating location in backend:", error);
    }
  };

  // Component to handle map clicks
  const LocationMarker = () => {
    const [clickFeedback, setClickFeedback] = useState(null);
    
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        
        // Check if location is restricted to CBD
        if (restrictToCBD && !isPointInNairobiCBD({ latitude: lat, longitude: lng })) {
          alert('Location selection is restricted to Nairobi CBD area only.');
          return;
        }
        
        setClickFeedback({ lat, lng });
        setTimeout(() => setClickFeedback(null), 500);
        
        const tempLocation = {
          latitude: lat,
          longitude: lng,
          name: 'Getting address...'
        };
        
        setUserLocation(tempLocation);
        
        if (onLocationSelect && typeof onLocationSelect === 'function') {
          onLocationSelect(tempLocation);
        }
        
        reverseGeocode(lat, lng);
      },
    });

    return (
      <>
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                
                // Check if location is restricted to CBD
                if (restrictToCBD && !isPointInNairobiCBD({ latitude: position.lat, longitude: position.lng })) {
                  alert('Location selection is restricted to Nairobi CBD area only.');
                  // Reset marker to previous position
                  marker.setLatLng([userLocation.latitude, userLocation.longitude]);
                  return;
                }
                
                const tempLocation = {
                  latitude: position.lat,
                  longitude: position.lng,
                  name: 'Getting address...'
                };
                
                setUserLocation(tempLocation);
                
                if (onLocationSelect && typeof onLocationSelect === 'function') {
                  onLocationSelect(tempLocation);
                }
                
                reverseGeocode(position.lat, position.lng);
              },
            }}
          >
            <Popup>
              <div>
                <p className="font-semibold">Selected Location</p>
                <p>{userLocation.name}</p>
                {geofenceStatus && (
                  <div className={`mt-2 p-2 rounded text-sm`} style={{ 
                    backgroundColor: geofenceStatus.backgroundColor,
                    color: geofenceStatus.color 
                  }}>
                    <p className="font-semibold">
                      {geofenceStatus.icon} {geofenceStatus.message}
                    </p>
                    {geofenceStatus.nearestEntry && (
                      <p className="text-xs mt-1">
                        Nearest CBD entry: {geofenceStatus.nearestEntry.distance.toFixed(2)}km away
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Drag marker to adjust position</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {clickFeedback && (
          <Marker 
            position={[clickFeedback.lat, clickFeedback.lng]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="
                width: 20px; 
                height: 20px; 
                background-color: rgba(255, 0, 0, 0.5);
                border-radius: 50%;
                animation: pulse 0.5s ease-out;
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />
        )}
      </>
    );
  };

  // Component to update map reference
  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        mapRef.current = map;
      }
    }, [map]);
    
    return null;
  };

  return (
    <div className="w-full">
      {/* Geofence Status Display */}
      {geofenceStatus && !isTracking && (
        <div className={`mb-4 p-3 rounded-lg border`} style={{ 
          backgroundColor: geofenceStatus.backgroundColor,
          borderColor: geofenceStatus.color 
        }}>
          <div className="flex items-center">
            <span className="text-lg mr-2">{geofenceStatus.icon}</span>
            <div>
              <p className="font-semibold" style={{ color: geofenceStatus.color }}>
                {geofenceStatus.message}
              </p>
              {geofenceStatus.nearestEntry && (
                <p className="text-sm mt-1" style={{ color: geofenceStatus.color }}>
                  {geofenceStatus.nearestEntry.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showCBDGeofence && !isTracking && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowBufferZone(!showBufferZone)}
            className={`px-3 py-1 rounded text-sm ${
              showBufferZone 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showBufferZone ? 'Hide' : 'Show'} Buffer Zone
          </button>
          
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([NAIROBI_CBD_CENTER.latitude, NAIROBI_CBD_CENTER.longitude], 14);
              }
            }}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Center on CBD
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* CBD Geofence Polygon */}
          {showCBDGeofence && cbdPolygonCoords.length > 0 && (
            <Polygon
              positions={cbdPolygonCoords}
              pathOptions={{
                color: '#10B981',
                weight: 3,
                opacity: 0.8,
                fillColor: '#10B981',
                fillOpacity: 0.1
              }}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-green-600">Nairobi CBD</p>
                  <p className="text-sm">Central Business District boundary</p>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Buffer Zone */}
          {showCBDGeofence && showBufferZone && bufferZoneCoords.length > 0 && (
            <Polygon
              positions={bufferZoneCoords}
              pathOptions={{
                color: '#F59E0B',
                weight: 2,
                opacity: 0.6,
                fillColor: '#F59E0B',
                fillOpacity: 0.05,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-amber-600">CBD Buffer Zone</p>
                  <p className="text-sm">{bufferDistance}km buffer around CBD</p>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* CBD Landmarks */}
          {showCBDGeofence && Object.values(CBD_LANDMARKS).map((landmark, index) => (
            <Marker
              key={index}
              position={[landmark.latitude, landmark.longitude]}
              icon={L.divIcon({
                className: 'landmark-icon',
                html: `<div style="
                  background-color: #3B82F6;
                  color: white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-blue-600">{landmark.name}</p>
                  <p className="text-sm text-gray-600">CBD Landmark</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {isTracking ? (
            // Tracking mode - show rider location and destination
            <>
              {location && (
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    <div>
                      <p className="font-semibold">Rider Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {destination && (
                <Marker position={[destination.latitude, destination.longitude]}>
                  <Popup>
                    <div>
                      <p className="font-semibold">Destination</p>
                      <p>{destination.name || 'Delivery Location'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          ) : (
            // Normal mode - location selection
            <>
              <LocationMarker />
              <SearchControl onLocationFound={handleLocationFound} />
            </>
          )}
          
          <MapController />
        </MapContainer>
      </div>
      
      {!isTracking && (
        <>
          {/* Selected Location Display */}
          {userLocation && (
            <div className="selected-location mt-2 text-green-600 font-bold">
              <FaMapMarkerAlt className="inline text-red-500 mr-1" />
              Selected Location: {userLocation.name}
            </div>
          )}
          
          {/* Helper Text */}
          <div className="map-instructions mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-700 mb-1">How to use the geofenced map:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              <li><strong>Search:</strong> Use the search box to find addresses</li>
              <li><strong>Click:</strong> Click on the map to select a location</li>
              <li><strong>Drag:</strong> Drag the marker to fine-tune position</li>
              <li><strong>CBD Zone:</strong> Green area shows Nairobi CBD boundaries</li>
              <li><strong>Buffer Zone:</strong> Yellow dashed area shows {bufferDistance}km buffer around CBD</li>
              {restrictToCBD && (
                <li><strong>Restriction:</strong> Location selection is limited to CBD area only</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default GeofencedMapComponent;