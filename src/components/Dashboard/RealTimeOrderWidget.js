import React, { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaRoute, 
  FaClock, 
  FaUser,
  FaCircle,
  FaEye,
  FaMinus
} from 'react-icons/fa';
import { useWebSocket } from '../../contexts/WebSocketContext';

const RealTimeOrderWidget = () => {
  const [showDetails, setShowDetails] = useState(true);
  const { 
    connected, 
    orderLocations, 
    waypoints, 
    error 
  } = useWebSocket();
  
  // Format location data for display
  const formatLocation = (lat, lng) => {
    if (!lat || !lng) return 'Unknown';
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  };
  
  // Calculate time since last update
  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const lastUpdate = new Date(timestamp);
    const diffMs = now - lastUpdate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };
  
  // Get user type badge color
  const getUserTypeBadge = (userType) => {
    switch (userType) {
      case 'assistant':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'handler':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Location item component
  const LocationItem = ({ location }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <FaUser className="text-blue-500" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{location.username}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeBadge(location.user_type)}`}>
              {location.user_type}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            <FaMapMarkerAlt className="inline mr-1" />
            {formatLocation(location.latitude, location.longitude)}
          </p>
          {location.speed && (
            <p className="text-xs text-gray-500">
              Speed: {Math.round(location.speed * 3.6)} km/h
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-1">
          <FaCircle className="text-green-500 text-xs animate-pulse" />
          <span className="text-xs text-green-600">Live</span>
        </div>
        <p className="text-xs text-gray-500">
          {getTimeSinceUpdate(location.last_updated)}
        </p>
      </div>
    </div>
  );
  
  // Waypoint item component
  const WaypointItem = ({ waypoint }) => (
    <div className={`flex items-center justify-between p-2 rounded ${
      waypoint.is_visited ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-center space-x-2">
        <FaRoute className={waypoint.is_visited ? 'text-green-500' : 'text-yellow-500'} />
        <div>
          <p className="text-sm font-medium">{waypoint.name || 'Waypoint'}</p>
          <p className="text-xs text-gray-500">
            {formatLocation(waypoint.latitude, waypoint.longitude)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className={`px-2 py-1 rounded-full text-xs ${
          waypoint.is_visited ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {waypoint.is_visited ? 'Visited' : 'Pending'}
        </span>
        {waypoint.visited_at && (
          <p className="text-xs text-gray-500 mt-1">
            {getTimeSinceUpdate(waypoint.visited_at)}
          </p>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaMapMarkerAlt className="text-blue-500" />
          <h3 className="text-lg font-semibold">Real-Time Tracking</h3>
          <div className="flex items-center space-x-1">
            <FaCircle className={`text-xs ${connected ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
            <span className={`text-xs ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          {showDetails ? <FaMinus /> : <FaEye />}
          <span>{showDetails ? 'Hide' : 'Show'}</span>
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {/* Connection Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span>Active Tracking Sessions:</span>
          <span className="font-semibold">{orderLocations.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Active Waypoints:</span>
          <span className="font-semibold">{waypoints.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Connection Status:</span>
          <span className={`font-semibold ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? 'Real-time' : 'Offline'}
          </span>
        </div>
      </div>
      
      {showDetails && (
        <>
          {/* Active Locations */}
          {orderLocations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Active Users ({orderLocations.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderLocations.map((location, index) => (
                  <LocationItem key={location.user_id || index} location={location} />
                ))}
              </div>
            </div>
          )}
          
          {/* Waypoints */}
          {waypoints.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 flex items-center">
                <FaRoute className="mr-2 text-green-500" />
                Waypoints ({waypoints.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {waypoints.map((waypoint, index) => (
                  <WaypointItem key={waypoint.id || index} waypoint={waypoint} />
                ))}
              </div>
            </div>
          )}
          
          {/* No Data Message */}
          {orderLocations.length === 0 && waypoints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FaMapMarkerAlt className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No active tracking sessions</p>
              <p className="text-sm">Real-time data will appear here when orders are being tracked</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RealTimeOrderWidget;