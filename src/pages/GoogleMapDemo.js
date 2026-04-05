import React, { useState } from 'react';
import GoogleMapComponent from '../components/Common/GoogleMapComponent';

const GoogleMapDemo = () => {
  const [pickupLocation] = useState({
    lat: -1.2876,
    lng: 36.8228,
    name: 'The Nextgen Mall, Mombasa Road, Nairobi, Kenya'
  });

  const [deliveryLocation] = useState({
    lat: -1.3002,
    lng: 36.7624,
    name: 'Safari Park Hotel, Nairobi, Kenya'
  });

  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    setSelectedLocation(location);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
        <h1>Google Map Component Demo</h1>
        <p><strong>Pickup:</strong> {pickupLocation.name}</p>
        <p><strong>Delivery:</strong> {deliveryLocation.name}</p>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>💡 Click anywhere on the map to select a location (blue marker)</p>
        
        {selectedLocation && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>
            <strong>Selected Location:</strong>
            <p>Latitude: {selectedLocation.lat.toFixed(4)}</p>
            <p>Longitude: {selectedLocation.lng.toFixed(4)}</p>
            <p>Address: {selectedLocation.address}</p>
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, width: '100%' }}>
        <GoogleMapComponent
          pickupLocation={pickupLocation}
          deliveryLocation={deliveryLocation}
          zoom={12}
          height="100%"
          selectable={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </div>
  );
};

export default GoogleMapDemo;
