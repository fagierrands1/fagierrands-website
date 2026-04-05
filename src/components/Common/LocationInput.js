// src/components/Common/LocationInput.js
// Form input field with "Select on Map" button that opens a modal map
import React, { useState } from 'react';
import { FaMapMarkerAlt, FaMap } from 'react-icons/fa';
import MapWithSearchModal from './MapWithSearchModal';
import './LocationInput.css';

const LocationInput = ({
  label,
  value,
  onLocationChange,
  placeholder = 'Enter address or select on map',
  required = false,
  initialCoordinate,
  className = '',
  error = null,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);

  const handleTextChange = (e) => {
    onLocationChange({
      address: e.target.value,
      coordinate: initialCoordinate
    });
  };

  const handleLocationSelect = (location) => {
    onLocationChange({
      address: location.name || location.address || value,
      coordinate: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });
    setShowMapModal(false);
  };

  return (
    <div className={`location-input-container ${className}`}>
      {label && (
        <label className="location-input-label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="location-input-wrapper">
        <div className="location-text-input-container">
          <FaMapMarkerAlt className="location-input-icon" />
          <input
            type="text"
            value={value || ''}
            onChange={handleTextChange}
            placeholder={placeholder}
            className={`location-text-input ${error ? 'input-error' : ''}`}
          />
        </div>
        <button
          type="button"
          className="location-map-button"
          onClick={() => setShowMapModal(true)}
          title="Select location on map"
        >
          <FaMapMarkerAlt />
        </button>
      </div>

      {error && (
        <div className="location-input-error">{error}</div>
      )}

      <button
        type="button"
        className="select-on-map-button"
        onClick={() => setShowMapModal(true)}
      >
        <FaMap className="select-on-map-icon" />
        <span>Select on Map</span>
      </button>

      <MapWithSearchModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleLocationSelect}
        title={`Select ${label || 'Location'}`}
        initialLocation={initialCoordinate}
        initialAddress={value}
      />
    </div>
  );
};

export default LocationInput;










