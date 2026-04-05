// src/components/Common/MapWithSearchModal.js
// Modal wrapper for MapWithSearch component
import React, { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import MapWithSearch from './MapWithSearch';
import './MapWithSearchModal.css';

const MapWithSearchModal = ({
  isOpen,
  onClose,
  onLocationSelect,
  title = 'Select Location',
  initialLocation,
  initialAddress,
  enableGeofencing = false,
  restrictToCBD = false,
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');

  useEffect(() => {
    if (isOpen) {
      // Reset selection when modal opens
      setSelectedLocation(null);
      setSelectedAddress(initialAddress || '');
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialAddress]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSelectedAddress(location.name || location.address || '');
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        name: selectedAddress || selectedLocation.name,
        address: selectedAddress || selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setSelectedAddress(initialAddress || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={handleCancel}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="map-modal-header">
          <h2 className="map-modal-title">{title}</h2>
          <button
            type="button"
            className="map-modal-close-btn"
            onClick={handleCancel}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Map Component */}
        <div className="map-modal-body">
          <MapWithSearch
            onLocationSelect={handleLocationSelect}
            height="calc(100vh - 280px)"
            showTitle={false}
            enableGeofencing={enableGeofencing}
            restrictToCBD={restrictToCBD}
            placeholder="Search for a location..."
            initialLocation={initialLocation}
          />
        </div>

        {/* Selected Address Display */}
        {selectedLocation && (
          <div className="map-modal-address">
            <div className="map-modal-address-header">
              <FaMapMarkerAlt className="map-modal-address-icon" />
              <span className="map-modal-address-title">Selected Location</span>
            </div>
            <input
              type="text"
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              placeholder="Enter address manually or tap on map"
              className="map-modal-address-input"
            />
            <div className="map-modal-coordinates">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="map-modal-actions">
          <button
            type="button"
            className="map-modal-cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="map-modal-confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            Select Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapWithSearchModal;

