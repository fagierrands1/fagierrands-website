import React, { useState, useEffect } from 'react';
import GoogleMapComponent from './GoogleMapComponent';
import { FaMapMarkerAlt, FaFlag, FaTruck, FaUser, FaCheckCircle } from 'react-icons/fa';
import { useWebSocket } from '../../contexts/WebSocketContext';

const TrackingMapComponent = ({
  pickupLocation,
  deliveryLocation,
  riderLocation,
  route = [],
  orderStatus = 'pending',
  height = '500px',
  className = ''
}) => {
  const { socket } = useWebSocket();
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (route && route.length > 0) {
      const coords = route.map(point => ({
        latitude: point.lat || point.latitude,
        longitude: point.lng || point.longitude
      }));
      setRouteCoordinates(coords);
    }
  }, [route]);

  useEffect(() => {
    if (socket) {
      const handleLocationUpdate = (data) => {
        console.log('Location update received:', data);
      };

      socket.on('location_update', handleLocationUpdate);
      
      return () => {
        socket.off('location_update', handleLocationUpdate);
      };
    }
  }, [socket]);

  const getMapCenter = () => {
    if (riderLocation) {
      return [
        riderLocation.lng || riderLocation.longitude,
        riderLocation.lat || riderLocation.latitude
      ];
    }
    if (pickupLocation) {
      return [
        pickupLocation.lng || pickupLocation.longitude,
        pickupLocation.lat || pickupLocation.latitude
      ];
    }
    return null;
  };

  const getStatusInfo = () => {
    const statusMap = {
      'pending': { color: '#f59e0b', text: 'Order Pending' },
      'confirmed': { color: '#3b82f6', text: 'Order Confirmed' },
      'picked_up': { color: '#8b5cf6', text: 'Package Picked Up' },
      'in_transit': { color: '#06b6d4', text: 'In Transit' },
      'delivered': { color: '#10b981', text: 'Delivered' },
      'cancelled': { color: '#ef4444', text: 'Cancelled' }
    };
    
    return statusMap[orderStatus] || statusMap['pending'];
  };

  const allMarkers = [
    ...(pickupLocation ? [{
      latitude: pickupLocation.lat || pickupLocation.latitude,
      longitude: pickupLocation.lng || pickupLocation.longitude,
      name: pickupLocation.name || pickupLocation.address || 'Pickup Location',
      color: '#22c55e',
      type: 'pickup'
    }] : []),
    ...(deliveryLocation ? [{
      latitude: deliveryLocation.lat || deliveryLocation.latitude,
      longitude: deliveryLocation.lng || deliveryLocation.longitude,
      name: deliveryLocation.name || deliveryLocation.address || 'Delivery Location',
      color: '#ef4444',
      type: 'delivery'
    }] : []),
    ...(riderLocation ? [{
      latitude: riderLocation.lat || riderLocation.latitude,
      longitude: riderLocation.lng || riderLocation.longitude,
      name: 'Current Position',
      color: '#3b82f6',
      type: 'rider'
    }] : [])
  ];

  useEffect(() => {
    console.log('[TrackingMapComponent] Locations and markers:', {
      pickupLocation: pickupLocation ? `${pickupLocation.lat}, ${pickupLocation.lng}` : null,
      deliveryLocation: deliveryLocation ? `${deliveryLocation.lat}, ${deliveryLocation.lng}` : null,
      riderLocation: riderLocation ? `${riderLocation.lat}, ${riderLocation.lng}` : null,
      markerCount: allMarkers.length,
      markers: allMarkers
    });
  }, [pickupLocation, deliveryLocation, riderLocation]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <GoogleMapComponent
        pickupLocation={pickupLocation ? {
          lat: pickupLocation.lat || pickupLocation.latitude,
          lng: pickupLocation.lng || pickupLocation.longitude,
          name: pickupLocation.address || pickupLocation.name || 'Pickup Location'
        } : null}
        deliveryLocation={deliveryLocation ? {
          lat: deliveryLocation.lat || deliveryLocation.latitude,
          lng: deliveryLocation.lng || deliveryLocation.longitude,
          name: deliveryLocation.address || deliveryLocation.name || 'Delivery Location'
        } : null}
        markers={allMarkers}
        showRoute={routeCoordinates.length > 0}
        routeCoordinates={routeCoordinates}
        height="100%"
        center={getMapCenter()}
        zoom={12}
        showControls={true}
      />
      
      {/* Status Overlay */}
      <div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-sm z-10">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStatusInfo().color }}
          ></div>
          <span className="text-sm font-medium">{getStatusInfo().text}</span>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          {pickupLocation && (
            <div>📍 Pickup: {pickupLocation.address || pickupLocation.name || 'Pickup Location'}</div>
          )}
          {deliveryLocation && (
            <div>🏁 Delivery: {deliveryLocation.address || deliveryLocation.name || 'Delivery Location'}</div>
          )}
          {riderLocation && (
            <div>🚚 Current: Moving to destination</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingMapComponent;
