// src/components/Services/GeofencedPickupDelivery.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GeofencedMapComponent from '../Common/GeofencedMapComponent';
import PriceCalculator from '../Common/PriceCalculator';
import CommissionCalculator from '../Common/CommissionCalculator';
import Footer from '../Common/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useNairobiCBDGeofence } from '../../hooks/useNairobiCBDGeofence';
import { FaPlus, FaMinus, FaMapMarkerAlt, FaShieldAlt, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import config from '../../config';
import './PickupDelivery.css';

const GeofencedPickupDelivery = () => {
  const navigate = useNavigate();
  const location = useLocation(); // For navigation state
  const { user, profile, getAuthToken, isAdmin } = useAuth();
  
  // Get name and phone from user or profile based on your data structure
  const name = user?.name || profile?.name || '';
  const phone = user?.phone || profile?.phone || '';
  
  // Check if this is for placing an order on behalf of a client
  const placeOrderForClient = location.state?.placeOrderForClient || false;
  const clientId = location.state?.clientId || null;
  const clientName = location.state?.clientName || null;
  const [clientDetails, setClientDetails] = useState(null);
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  
  // State for pickup and delivery locations
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  // Geofencing settings
  const [geofenceSettings, setGeofenceSettings] = useState({
    enableGeofencing: true,
    restrictPickupToCBD: false,
    restrictDeliveryToCBD: false,
    bufferDistance: 2, // 2km buffer for warnings
    requireCBDForExpress: true // Express delivery requires CBD pickup/delivery
  });
  
  // Geofence status for pickup and delivery locations
  const [pickupGeofenceStatus, setPickupGeofenceStatus] = useState(null);
  const [deliveryGeofenceStatus, setDeliveryGeofenceStatus] = useState(null);
  
  // Price calculation
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  
  // State for items to be picked up and delivered
  const [items, setItems] = useState([{ name: '', description: '', quantity: 1 }]);
  const [additionalDescription, setAdditionalDescription] = useState('');
  
  const [userDetails, setUserDetails] = useState({
    name: name || '',
    contact: phone || '',
  });
  
  // State for form data including addresses
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    title: 'Pickup & Delivery Order',
    deliveryType: 'standard', // standard, express, same-day
  });

  // Use geofencing hook for real-time tracking (optional)
  const {
    currentLocation,
    geofenceStatus,
    isTracking,
    startTracking,
    stopTracking,
    checkLocationInCBD
  } = useNairobiCBDGeofence({
    bufferDistance: geofenceSettings.bufferDistance,
    enableRealTimeTracking: false,
    onEnterCBD: (status) => {
      console.log('User entered CBD:', status);
    },
    onExitCBD: (status) => {
      console.log('User left CBD:', status);
    }
  });

  // Fetch client details if placing order for a client
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (clientId && placeOrderForClient) {
        try {
          const token = await getAuthToken();
          const response = await axios.get(
            `/accounts/user/${clientId}/`,
            {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }
          );
          setClientDetails(response.data);
          // Pre-fill client details
          setUserDetails({
            name: response.data.first_name && response.data.last_name 
              ? `${response.data.first_name} ${response.data.last_name}`
              : response.data.username || clientName || '',
            contact: response.data.phone_number || response.data.phone || ''
          });
        } catch (error) {
          console.error('Error fetching client details:', error);
          setMessage('Failed to load client details. Please try again.');
        }
      }
    };
    
    fetchClientDetails();
  }, [clientId, placeOrderForClient, getAuthToken, clientName]);
  
  // Fetch order types when component mounts
  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          console.error('No auth token available');
          return;
        }

        const response = await axios.get('/orders/types/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && Array.isArray(response.data)) {
          setOrderTypes(response.data);
          // Find pickup-delivery order type
          const pickupDeliveryType = response.data.find(type => 
            type.name.toLowerCase().includes('pickup') || 
            type.name.toLowerCase().includes('delivery')
          );
          if (pickupDeliveryType) {
            setSelectedOrderType(pickupDeliveryType.id);
          }
        }
      } catch (error) {
        console.error('Error fetching order types:', error);
        setMessage('Error loading order types. Please try again.');
      }
    };

    fetchOrderTypes();
  }, [getAuthToken]);

  // Handle pickup location selection
  const handlePickupLocationSelect = (location) => {
    setPickupLocation(location);
    setFormData(prev => ({
      ...prev,
      pickupAddress: location.name
    }));
  };

  // Handle delivery location selection
  const handleDeliveryLocationSelect = (location) => {
    setDeliveryLocation(location);
    setFormData(prev => ({
      ...prev,
      deliveryAddress: location.name
    }));
  };

  // Handle pickup geofence status change
  const handlePickupGeofenceChange = (status) => {
    setPickupGeofenceStatus(status);
    
    // Check if express delivery is selected and location is outside CBD
    if (formData.deliveryType === 'express' && geofenceSettings.requireCBDForExpress && !status.inCBD) {
      setMessage('Express delivery requires pickup location within Nairobi CBD. Please select a location within the CBD or choose standard delivery.');
    } else {
      setMessage('');
    }
  };

  // Handle delivery geofence status change
  const handleDeliveryGeofenceChange = (status) => {
    setDeliveryGeofenceStatus(status);
    
    // Check if express delivery is selected and location is outside CBD
    if (formData.deliveryType === 'express' && geofenceSettings.requireCBDForExpress && !status.inCBD) {
      setMessage('Express delivery requires delivery location within Nairobi CBD. Please select a location within the CBD or choose standard delivery.');
    } else {
      setMessage('');
    }
  };

  // Handle delivery type change
  const handleDeliveryTypeChange = (type) => {
    setFormData(prev => ({ ...prev, deliveryType: type }));
    
    // Check geofence requirements for express delivery
    if (type === 'express' && geofenceSettings.requireCBDForExpress) {
      const pickupInCBD = pickupGeofenceStatus?.inCBD || false;
      const deliveryInCBD = deliveryGeofenceStatus?.inCBD || false;
      
      if (!pickupInCBD || !deliveryInCBD) {
        setMessage('Express delivery requires both pickup and delivery locations to be within Nairobi CBD.');
      } else {
        setMessage('');
      }
    } else {
      setMessage('');
    }
  };

  // Add item
  const addItem = () => {
    setItems([...items, { name: '', description: '', quantity: 1 }]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  // Validate form before submission
  const validateForm = () => {
    if (!pickupLocation || !deliveryLocation) {
      setMessage('Please select both pickup and delivery locations.');
      return false;
    }

    if (!userDetails.name || !userDetails.contact) {
      setMessage('Please provide your name and contact information.');
      return false;
    }

    if (items.some(item => !item.name.trim())) {
      setMessage('Please provide names for all items.');
      return false;
    }

    // Check express delivery geofence requirements
    if (formData.deliveryType === 'express' && geofenceSettings.requireCBDForExpress) {
      const pickupInCBD = pickupGeofenceStatus?.inCBD || false;
      const deliveryInCBD = deliveryGeofenceStatus?.inCBD || false;
      
      if (!pickupInCBD || !deliveryInCBD) {
        setMessage('Express delivery requires both pickup and delivery locations to be within Nairobi CBD.');
        return false;
      }
    }

    return true;
  };

  // Submit order
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const orderData = {
        order_type: selectedOrderType,
        title: formData.title,
        description: additionalDescription,
        pickup_location: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          address: pickupLocation.name,
          geofence_status: pickupGeofenceStatus
        },
        delivery_location: {
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
          address: deliveryLocation.name,
          geofence_status: deliveryGeofenceStatus
        },
        items: items,
        user_details: userDetails,
        delivery_type: formData.deliveryType,
        geofence_settings: geofenceSettings,
        // Add client_id if placing order on behalf of a client
        ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
      };

      const response = await axios.post('/orders/pickup-delivery/', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setMessage('Order submitted successfully!');
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setMessage(error.response?.data?.message || 'Error submitting order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGeofenceStatus = (status, locationType) => {
    if (!status) return null;

    return (
      <div className={`mt-2 p-2 rounded text-sm`} style={{ 
        backgroundColor: status.backgroundColor,
        color: status.color 
      }}>
        <div className="flex items-center">
          <span className="mr-2">{status.icon}</span>
          <div>
            <p className="font-semibold">
              {locationType}: {status.zone.replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-xs">{status.message}</p>
            {status.nearestEntry && (
              <p className="text-xs">
                Nearest CBD entry: {status.nearestEntry.distance.toFixed(2)}km
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pickup-delivery-container">
      <div className="pickup-delivery-content">
        <h1 className="pickup-delivery-title">
          {placeOrderForClient && clientName 
            ? `Place Order for ${clientName}`
            : 'Pickup & Delivery Service'}
        </h1>
        <p className="pickup-delivery-subtitle">
          Get your items picked up and delivered with geofencing for enhanced service
        </p>

        {placeOrderForClient && clientName && (
          <div className="alert alert-info" style={{ 
            marginBottom: '20px', 
            padding: '12px', 
            backgroundColor: '#e3f2fd', 
            color: '#1976d2',
            borderRadius: '4px'
          }}>
            <strong>Placing order on behalf of:</strong> {clientName}
          </div>
        )}

        {/* Geofencing Settings */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Delivery Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => handleDeliveryTypeChange('standard')}
              className={`p-3 rounded-lg border-2 text-left ${
                formData.deliveryType === 'standard'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold">Standard Delivery</h4>
              <p className="text-sm text-gray-600">2-4 hours • Anywhere in Nairobi</p>
            </button>
            
            <button
              onClick={() => handleDeliveryTypeChange('express')}
              className={`p-3 rounded-lg border-2 text-left ${
                formData.deliveryType === 'express'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold">Express Delivery</h4>
              <p className="text-sm text-gray-600">30-60 minutes • CBD only</p>
              {geofenceSettings.requireCBDForExpress && (
                <p className="text-xs text-green-600 mt-1">
                  <FaShieldAlt className="inline mr-1" />
                  Requires CBD locations
                </p>
              )}
            </button>
            
            <button
              onClick={() => handleDeliveryTypeChange('same-day')}
              className={`p-3 rounded-lg border-2 text-left ${
                formData.deliveryType === 'same-day'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold">Same Day</h4>
              <p className="text-sm text-gray-600">4-8 hours • Greater Nairobi</p>
            </button>
          </div>
        </div>

        {/* Pickup Location Section */}
        <div className="step-content" style={{ marginBottom: '30px' }}>
          <h2>Pickup Location *</h2>
            <GeofencedMapComponent
              onLocationSelect={handlePickupLocationSelect}
              onGeofenceStatusChange={handlePickupGeofenceChange}
              enableGeofencing={geofenceSettings.enableGeofencing}
              restrictToCBD={geofenceSettings.restrictPickupToCBD || 
                           (formData.deliveryType === 'express' && geofenceSettings.requireCBDForExpress)}
              bufferDistance={geofenceSettings.bufferDistance}
              showCBDGeofence={true}
            />
            
            {renderGeofenceStatus(pickupGeofenceStatus, 'Pickup Location')}
            
          {pickupLocation && (
            <div className="selected-location-info">
              <FaMapMarkerAlt className="text-red-500" />
              <span>Pickup: {pickupLocation.name}</span>
            </div>
          )}
        </div>

        {/* Delivery Location Section */}
        <div className="step-content" style={{ marginBottom: '30px' }}>
          <h2>Delivery Location *</h2>
            <GeofencedMapComponent
              onLocationSelect={handleDeliveryLocationSelect}
              onGeofenceStatusChange={handleDeliveryGeofenceChange}
              enableGeofencing={geofenceSettings.enableGeofencing}
              restrictToCBD={geofenceSettings.restrictDeliveryToCBD || 
                           (formData.deliveryType === 'express' && geofenceSettings.requireCBDForExpress)}
              bufferDistance={geofenceSettings.bufferDistance}
              showCBDGeofence={true}
            />
            
            {renderGeofenceStatus(deliveryGeofenceStatus, 'Delivery Location')}
            
          {deliveryLocation && (
            <div className="selected-location-info">
              <FaMapMarkerAlt className="text-green-500" />
              <span>Delivery: {deliveryLocation.name}</span>
            </div>
          )}
        </div>

        {/* Items & Details Section */}
        <div className="step-content" style={{ marginBottom: '30px' }}>
          <h2>Items to be Picked Up & Delivered *</h2>
            
            {items.map((item, index) => (
              <div key={index} className="item-form">
                <div className="item-header">
                  <h4>Item {index + 1}</h4>
                  {items.length > 1 && (
                    <button 
                      onClick={() => removeItem(index)}
                      className="remove-item-button"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
                
                <div className="item-fields">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="item-input"
                  />
                  
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="item-input"
                  />
                  
                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="item-input quantity-input"
                  />
                </div>
              </div>
            ))}
            
            <button onClick={addItem} className="add-item-button">
              <FaPlus /> Add Another Item
            </button>
            
            <div className="additional-details">
              <h3>Additional Instructions</h3>
              <textarea
                placeholder="Any special instructions for pickup or delivery..."
                value={additionalDescription}
                onChange={(e) => setAdditionalDescription(e.target.value)}
                className="description-textarea"
              />
            </div>
            
            <div className="user-details">
              <h3>Your Contact Information</h3>
              <div className="user-fields">
                <input
                  type="text"
                  placeholder="Your name"
                  value={userDetails.name}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="user-input"
                />
                <input
                  type="tel"
                  placeholder="Your phone number"
                  value={userDetails.contact}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, contact: e.target.value }))}
                  className="user-input"
                />
              </div>
            </div>
            
        </div>
        
        {/* Price and Commission Section */}
        {pickupLocation && deliveryLocation && (
          <div className="step-content" style={{ marginBottom: '30px' }}>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaMoneyBillWave className="text-green-600 mr-2" />
                Price & Commission Breakdown
              </h3>
              
              <PriceCalculator
                pickupLocation={pickupLocation}
                deliveryLocation={deliveryLocation}
                orderTypeId={selectedOrderType}
                items={items}
                simplified={true}
              />
              
              {/* Commission Calculator - Only visible to admins */}
              {isAdmin && (
                <div className="mt-4">
                  <CommissionCalculator
                    pickupLocation={pickupLocation}
                    deliveryLocation={deliveryLocation}
                    totalPrice={calculatedPrice || 500}
                    serviceType={formData.deliveryType}
                    showDetails={true}
                  />
                </div>
              )}
            </div>
            
            {/* Geofence Benefits Info */}
            {pickupGeofenceStatus?.isBothInCBD && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center text-green-800 mb-2">
                  <FaShieldAlt className="mr-2" />
                  <span className="font-semibold">CBD Service Benefits</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• CBD assistant earnings: 70% (vs 75% outside CBD)</li>
                  <li>• Faster delivery times within CBD</li>
                  <li>• Priority service handling</li>
                  <li>• Better route optimization</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <div className="step-buttons" style={{ marginTop: '30px', marginBottom: '20px' }}>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="submit-button"
            style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
          >
            {isSubmitting ? 'Submitting...' : 'Place Order'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`message ${message.includes('Error') || message.includes('requires') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default GeofencedPickupDelivery;