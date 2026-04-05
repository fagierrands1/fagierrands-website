import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GoogleMapWithSearch from '../Common/GoogleMapWithSearch';
import PriceCalculator from '../Common/PriceCalculator';
import UniversalCommissionCalculator from '../Common/UniversalCommissionCalculator';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaMinus, FaImage, FaTimes, FaMoneyBillWave, FaCouch, FaTv, FaHammer, FaCog, FaBox, FaEllipsisH } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import fileUploadService from '../../services/fileUploadService';
import './CargoDelivery.css';

const CARGO_TYPES = [
  { id: 'furniture', name: 'Furniture', icon: FaCouch, color: '#9333ea' },
  { id: 'appliances', name: 'Appliances', icon: FaTv, color: '#3b82f6' },
  { id: 'construction', name: 'Construction Materials', icon: FaHammer, color: '#9333ea' },
  { id: 'machinery', name: 'Machinery', icon: FaCog, color: '#a855f7' },
  { id: 'bulk', name: 'Bulk Items', icon: FaBox, color: '#d97706' },
  { id: 'other', name: 'Other', icon: FaEllipsisH, color: '#6b7280' },
];

const VEHICLE_TYPES = [
  { id: 'pickup', name: 'Pickup Truck', capacity: '1-2 tons' },
  { id: 'van', name: 'Cargo Van', capacity: '2-3 tons' },
  { id: 'truck', name: 'Small Truck', capacity: '3-5 tons' },
  { id: 'large_truck', name: 'Large Truck', capacity: '5+ tons' },
];

const CargoDelivery = () => {
  const navigate = useNavigate();
  const location = useLocation(); // For navigation state
  const { user, profile, getAuthToken, isAdmin } = useAuth();
  
  const name = user?.name || profile?.name || '';
  const phone = user?.phone || profile?.phone || '';
  
  // Check if this is for placing an order on behalf of a client
  const placeOrderForClient = location.state?.placeOrderForClient || false;
  const clientId = location.state?.clientId || null;
  const clientName = location.state?.clientName || null;
  const [clientDetails, setClientDetails] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: 'Cargo Delivery Order',
    pickupAddress: '',
    deliveryAddress: '',
    additionalDescription: '',
    cargoType: '',
    totalWeight: 0,
    declaredValue: '',
    requiresSpecialHandling: false,
    requiresInsurance: false,
    preferredPickupTime: '',
    preferredDeliveryTime: '',
  });
  
  // Cargo items - multiple items with details
  const [cargoItems, setCargoItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    description: '',
    weight: '',
    value: '',
    length: '',
    width: '',
    height: '',
    quantity: '1',
    isFragile: false,
    isNonFragile: false,
    images: [],
  });
  const [currentItemImages, setCurrentItemImages] = useState([]);
  
  const [userDetails, setUserDetails] = useState({
    name: name || '',
    contact: phone || '',
  });
  
  // Price calculation
  const [priceCalculation, setPriceCalculation] = useState(null);
  
  // Service area validation
  const [serviceAreaValid, setServiceAreaValid] = useState(true);
  const [serviceAreaErrors, setServiceAreaErrors] = useState([]);
  
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
  
  // Fetch order types
  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const token = await getAuthToken();
        const response = await axios.get('/orders/types/', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const typesArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        setOrderTypes(typesArray);
        
        const cargoType = typesArray.find(type => 
          type.name?.toLowerCase().includes('cargo')
        );
        if (cargoType) {
          setSelectedOrderType(cargoType.id);
        } else if (typesArray.length > 0) {
          setSelectedOrderType(typesArray[0].id);
        }
      } catch (error) {
        console.error('Error fetching order types:', error);
        setMessage('Failed to load order types. Please refresh the page.');
        setOrderTypes([]);
      }
    };
    
    fetchOrderTypes();
  }, [getAuthToken]);
  
  useEffect(() => {
    setUserDetails(prev => ({ ...prev, name: name || '', contact: phone || '' }));
  }, [name, phone]);
  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCurrentItemChange = (field, value) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  };
  
  const handleItemImageUpload = async (event, itemId = null) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = fileUploadService.validateFile(file);
    if (!validation.valid) {
      setMessage(validation.error);
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    const imageData = { file, preview: previewUrl, name: file.name };
    
    if (itemId) {
      // Add to existing item
      setCargoItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, images: [...item.images, imageData] }
          : item
      ));
    } else {
      // Add to current item being created
      setCurrentItemImages(prev => [...prev, imageData]);
    }
    event.target.value = '';
  };
  
  const removeItemImage = (itemId, imageIndex) => {
    if (itemId) {
      setCargoItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, images: item.images.filter((_, i) => i !== imageIndex) }
          : item
      ));
    } else {
      const image = currentItemImages[imageIndex];
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      setCurrentItemImages(prev => prev.filter((_, i) => i !== imageIndex));
    }
  };
  
  const addCargoItem = () => {
    if (!currentItem.name.trim()) {
      setMessage('Please enter cargo item name');
      return;
    }
    
    const itemValue = parseFloat(currentItem.value) || 0;
    if (!itemValue || itemValue <= 0) {
      setMessage('Please enter a valid value (KES) for the cargo item');
      return;
    }
    
    if (currentItemImages.length === 0) {
      setMessage('Please upload at least one photo for the cargo item');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      name: currentItem.name.trim(),
      description: currentItem.description.trim(),
      weight: parseFloat(currentItem.weight) || 0,
      value: itemValue,
      dimensions: {
        length: parseFloat(currentItem.length) || 0,
        width: parseFloat(currentItem.width) || 0,
        height: parseFloat(currentItem.height) || 0,
      },
      quantity: parseInt(currentItem.quantity) || 1,
      isFragile: currentItem.isFragile,
      isNonFragile: currentItem.isNonFragile,
      images: [...currentItemImages],
    };
    
    setCargoItems([...cargoItems, newItem]);
    
    // Update total weight and declared value
    const updatedItems = [...cargoItems, newItem];
    const totalWeight = updatedItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const declaredValueSum = updatedItems.reduce((sum, item) => sum + ((item.value || 0) * (item.quantity || 1)), 0);
    
    setFormData(prev => ({ 
      ...prev, 
      totalWeight, 
      declaredValue: declaredValueSum ? String(declaredValueSum) : prev.declaredValue 
    }));
    
    // Reset current item
    setCurrentItem({
      name: '',
      description: '',
      weight: '',
      value: '',
      length: '',
      width: '',
      height: '',
      quantity: '1',
      isFragile: false,
      isNonFragile: false,
      images: [],
    });
    setCurrentItemImages([]);
  };
  
  const removeCargoItem = (id) => {
    const updatedItems = cargoItems.filter(item => item.id !== id);
    setCargoItems(updatedItems);
    
    const totalWeight = updatedItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const declaredValueSum = updatedItems.reduce((sum, item) => sum + ((item.value || 0) * (item.quantity || 1)), 0);
    setFormData(prev => ({ 
      ...prev, 
      totalWeight, 
      declaredValue: declaredValueSum ? String(declaredValueSum) : prev.declaredValue 
    }));
  };
  
  const handlePriceCalculated = (calculation) => {
    setPriceCalculation(calculation);
  };
  
  const handleNextStep = () => {
    setMessage('');
    
    if (currentStep === 1) {
      if (!selectedOrderType) {
        setMessage('Please select an order type');
        return;
      }
      if (!formData.cargoType) {
        setMessage('Please select cargo type');
        return;
      }
    if (cargoItems.length === 0) {
      setMessage('Please add at least one cargo item');
      return;
    }
    // Validate all items have value and images
    const invalidItems = cargoItems.filter(item => !item.value || item.value <= 0 || !item.images || item.images.length === 0);
    if (invalidItems.length > 0) {
      setMessage('All cargo items must have a value (KES) and at least one photo');
      return;
    }
    } else if (currentStep === 2) {
      if (!pickupLocation) {
        setMessage('Please select a pickup location');
        return;
      }
      if (!deliveryLocation) {
        setMessage('Please select a delivery location');
        return;
      }
    } else if (currentStep === 3) {
      if (!userDetails.name.trim() || !userDetails.contact.trim()) {
        setMessage('Please complete contact details');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };
  
  const handlePreviousStep = () => {
    setMessage('');
    setCurrentStep(currentStep - 1);
  };
  
  const handlePickupLocationSelect = (location) => {
    if (location && !location.name && formData.pickupAddress) {
      location.name = formData.pickupAddress;
    }
    setPickupLocation(location);
    if (location && location.name) {
      setFormData(prev => ({ ...prev, pickupAddress: location.name }));
    }
  };
  
  const handleDeliveryLocationSelect = (location) => {
    if (location && !location.name && formData.deliveryAddress) {
      location.name = formData.deliveryAddress;
    }
    setDeliveryLocation(location);
    if (location && location.name) {
      setFormData(prev => ({ ...prev, deliveryAddress: location.name }));
    }
  };
  
  const validateForm = () => {
    if (!selectedOrderType) {
      setMessage('Please select an order type');
      return false;
    }
    if (!formData.cargoType) {
      setMessage('Please select cargo type');
      return false;
    }
    if (cargoItems.length === 0) {
      setMessage('Please add at least one cargo item');
      return false;
    }
    // Validate all items have value and images
    const invalidItems = cargoItems.filter(item => !item.value || item.value <= 0 || !item.images || item.images.length === 0);
    if (invalidItems.length > 0) {
      setMessage('All cargo items must have a value (KES) and at least one photo');
      return false;
    }
    if (!pickupLocation || !deliveryLocation) {
      setMessage('Please select both pickup and delivery locations');
      return false;
    }
    if (!userDetails.name.trim() || !userDetails.contact.trim()) {
      setMessage('Please complete contact details');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        setMessage('You are not logged in. Please log in to place an order.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const cargoTypeLabel = CARGO_TYPES.find(t => t.id === formData.cargoType)?.name || formData.cargoType;
      
      const cargoDescription = [
        formData.additionalDescription.trim(),
        `\n--- CARGO DETAILS ---`,
        `Cargo Type: ${cargoTypeLabel}`,
        `Total Weight: ${formData.totalWeight.toFixed(1)} kg`,
        formData.requiresSpecialHandling ? 'Requires Special Handling: YES' : '',
        formData.requiresInsurance ? 'Requires Insurance: YES' : '',
        formData.preferredPickupTime ? `Preferred Pickup Time: ${formData.preferredPickupTime}` : '',
        formData.preferredDeliveryTime ? `Preferred Delivery Time: ${formData.preferredDeliveryTime}` : '',
      ].filter(Boolean).join('\n');
      
      const orderData = {
        order_type_id: selectedOrderType,
        title: formData.title.trim(),
        description: cargoDescription,
        pickup_address: pickupLocation.name || formData.pickupAddress || 'Custom location',
        delivery_address: deliveryLocation.name || formData.deliveryAddress || 'Custom location',
        pickup_latitude: pickupLocation.latitude,
        pickup_longitude: pickupLocation.longitude,
        delivery_latitude: deliveryLocation.latitude,
        delivery_longitude: deliveryLocation.longitude,
        recipient_name: userDetails.name.trim(),
        contact_number: userDetails.contact.trim(),
        estimated_price: priceCalculation?.totalPrice ? Number(priceCalculation.totalPrice.toFixed(2)) : undefined,
        distance: priceCalculation?.distance ? Number(priceCalculation.distance.toFixed(3)) : undefined,
        items: cargoItems.filter(item => item.name.trim() && item.value > 0 && item.images && item.images.length > 0).map(item => ({
          name: item.name,
          description: `${item.description} | Weight: ${item.weight}kg | Dimensions: ${item.dimensions.length}×${item.dimensions.width}×${item.dimensions.height}cm${item.isFragile ? ' | FRAGILE' : ''}${item.isNonFragile ? ' | NON-FRAGILE' : ''}`,
          quantity: item.quantity,
          value_ksh: item.value,
        })),
        declared_value: formData.declaredValue ? parseFloat(formData.declaredValue) : undefined,
        // Add client_id if placing order on behalf of a client
        ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
      };
      
      const response = await axios.post(
        '/orders/cargo-delivery/',
        orderData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      // Upload item images if order was created successfully
      const orderId = response.data?.id || response.data?.order_id || response.data?.order?.id;
      if (orderId && cargoItems.length > 0) {
        try {
          const allItemImages = [];
          cargoItems.forEach((item, itemIdx) => {
            if (item.images && item.images.length > 0) {
              item.images.forEach((img, imgIdx) => {
                allItemImages.push({ file: img.file, itemName: item.name, itemIdx, imgIdx });
              });
            }
          });
          
          if (allItemImages.length > 0) {
            await Promise.allSettled(
              allItemImages.map(async (imgData) => {
                await fileUploadService.uploadOrderAttachment(orderId, imgData.file);
              })
            );
          }
        } catch (uploadError) {
          console.error('Error uploading item images:', uploadError);
        }
      }
      
      setMessage('Order placed successfully!');
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating cargo order:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setMessage('Authentication failed. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setMessage(error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        setMessage('Could not connect to the server. Please check your internet connection.');
      } else {
        setMessage('An error occurred while processing your request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container">
      <main className="main-content">
        <div className="shop-header">
          <h1 className="shop-title">
            {placeOrderForClient && clientName 
              ? `Place Order for ${clientName}`
              : 'Cargo Delivery'}
          </h1>
          <Link to="/dashboard" className="back-button">
            Back to Dashboard
          </Link>
        </div>
        
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
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success-message' : 'error-message'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="step-container">
              <p className="step-title">Cargo Details</p>
              
              <div className="select-container">
                <div className="select-wrapper">
                  <label className="input-label">Order Type *</label>
                  <select 
                    className="select-input"
                    value={selectedOrderType}
                    onChange={(e) => setSelectedOrderType(e.target.value)}
                    required
                  >
                    <option value="">Select Order Type</option>
                    {Array.isArray(orderTypes) && orderTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="input-container">
                <div className="input-wrapper">
                  <label className="input-label">Order Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter order title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="text-input"
                    required
                  />
                </div>
              </div>
              
              {/* Cargo Type Selection */}
              <div className="cargo-type-section">
                <label className="input-label">Cargo Type *</label>
                <div className="cargo-types-grid">
                  {CARGO_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = formData.cargoType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        className={`cargo-type-card ${isSelected ? 'selected' : ''} cargo-type-${type.id}`}
                        onClick={() => setFormData(prev => ({ ...prev, cargoType: type.id }))}
                      >
                        <div className="cargo-type-icon-wrapper">
                          <IconComponent className="cargo-type-icon" style={{ color: isSelected ? 'white' : type.color }} />
                        </div>
                        <span className="cargo-type-name">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Cargo Items */}
              <div className="cargo-items-section">
                <p className="section-subtitle">Cargo Items</p>
                
                {cargoItems.map((item, index) => (
                  <div key={item.id} className="cargo-item-card">
                    <div className="item-header">
                      <h4>Item {index + 1}: {item.name}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeCargoItem(item.id)}
                        className="remove-item-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="item-details">
                      <p><strong>Description:</strong> {item.description || 'N/A'}</p>
                      <p><strong>Weight:</strong> {item.weight} kg × {item.quantity} = {(item.weight * item.quantity).toFixed(1)} kg</p>
                      <p><strong>Dimensions:</strong> {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} cm</p>
                      <p><strong>Value:</strong> KSh {((item.value || 0) * item.quantity).toLocaleString()}</p>
                      {item.isFragile && <p className="fragile-badge">FRAGILE</p>}
                      {item.isNonFragile && <p className="non-fragile-badge">NON-FRAGILE</p>}
                      {item.images.length > 0 && (
                        <div className="item-images-preview">
                          {item.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="item-image-thumb">
                              <img src={img.preview} alt={item.name} />
                              <button 
                                type="button"
                                onClick={() => removeItemImage(item.id, imgIdx)}
                                className="remove-image-btn"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add New Cargo Item */}
                <div className="add-item-section">
                  <p className="section-subtitle">Add New Cargo Item</p>
                  
                  <div className="form-row">
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Item Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Sofa, Refrigerator"
                          value={currentItem.name}
                          onChange={(e) => handleCurrentItemChange('name', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                    
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={currentItem.quantity}
                          onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="input-container">
                    <div className="input-wrapper">
                      <label className="input-label">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Brief description of the item"
                        value={currentItem.description}
                        onChange={(e) => handleCurrentItemChange('description', e.target.value)}
                        className="textarea-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Weight (kg) *</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={currentItem.weight}
                          onChange={(e) => handleCurrentItemChange('weight', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                    
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Value (KES) *</label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Enter value"
                          value={currentItem.value}
                          onChange={(e) => handleCurrentItemChange('value', e.target.value)}
                          className={`text-input ${!currentItem.value || parseFloat(currentItem.value) <= 0 ? 'input-error' : ''}`}
                          required
                        />
                        {(!currentItem.value || parseFloat(currentItem.value) <= 0) && (
                          <span className="error-text">Value is required</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Length (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={currentItem.length}
                          onChange={(e) => handleCurrentItemChange('length', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                    
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Width (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={currentItem.width}
                          onChange={(e) => handleCurrentItemChange('width', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                    
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Height (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={currentItem.height}
                          onChange={(e) => handleCurrentItemChange('height', e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="fragility-section">
                    <label className="input-label">Item Fragility</label>
                    <div className="fragility-options">
                      <label className={`fragility-option ${currentItem.isFragile ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={currentItem.isFragile}
                          onChange={(e) => {
                            handleCurrentItemChange('isFragile', e.target.checked);
                            if (e.target.checked) {
                              handleCurrentItemChange('isNonFragile', false);
                            }
                          }}
                        />
                        <div className="fragility-content">
                          <span className="fragility-icon">⚠️</span>
                          <span className="fragility-text">Fragile</span>
                        </div>
                      </label>
                      <label className={`fragility-option ${currentItem.isNonFragile ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={currentItem.isNonFragile}
                          onChange={(e) => {
                            handleCurrentItemChange('isNonFragile', e.target.checked);
                            if (e.target.checked) {
                              handleCurrentItemChange('isFragile', false);
                            }
                          }}
                        />
                        <div className="fragility-content">
                          <span className="fragility-icon">✓</span>
                          <span className="fragility-text">Non-Fragile</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="photos-section">
                    <label className="input-label">
                      <FaImage className="label-icon" />
                      Item Photos *
                    </label>
                    {currentItemImages.length === 0 && (
                      <span className="error-text" style={{ display: 'block', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        At least one photo is required
                      </span>
                    )}
                    <div className="photos-container">
                      {currentItemImages.map((img, index) => (
                        <div key={index} className="photo-preview-card">
                          <div className="photo-preview-wrapper">
                            <img src={img.preview} alt={`Item ${index + 1}`} />
                            <button 
                              type="button"
                              onClick={() => removeItemImage(null, index)}
                              className="remove-photo-btn"
                              title="Remove photo"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                      <label className="photo-upload-card">
                        <div className="photo-upload-content">
                          <FaImage className="photo-upload-icon" />
                          <span className="photo-upload-text">Add Photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleItemImageUpload(e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={addCargoItem}
                    className="add-item-button"
                    disabled={!currentItem.name.trim() || !currentItem.value || parseFloat(currentItem.value) <= 0 || currentItemImages.length === 0}
                  >
                    <FaPlus /> Add Item
                  </button>
                </div>
                
                {/* Summary */}
                {cargoItems.length > 0 && (
                  <div className="cargo-summary">
                    <h4>Cargo Summary</h4>
                    <p><strong>Total Weight:</strong> {formData.totalWeight.toFixed(1)} kg</p>
                    <p><strong>Total Declared Value:</strong> KSh {formData.declaredValue ? Number(formData.declaredValue).toLocaleString() : '0'}</p>
                    <p><strong>Number of Items:</strong> {cargoItems.length}</p>
                  </div>
                )}
                
                <div className="description-container">
                  <p className="input-label">Additional Description</p>
                  <textarea
                    rows={3}
                    placeholder="Any special instructions or additional details"
                    value={formData.additionalDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalDescription: e.target.value }))}
                    className="textarea-input"
                  />
                </div>
                
                <div className="special-requirements-section">
                  <label className="input-label">Special Requirements</label>
                  <div className="requirements-grid">
                    <label className={`requirement-card ${formData.requiresSpecialHandling ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        name="requiresSpecialHandling"
                        checked={formData.requiresSpecialHandling}
                        onChange={handleFormChange}
                      />
                      <div className="requirement-content">
                        <div className="requirement-icon">🔧</div>
                        <span className="requirement-text">Requires Special Handling</span>
                      </div>
                    </label>
                    <label className={`requirement-card ${formData.requiresInsurance ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        name="requiresInsurance"
                        checked={formData.requiresInsurance}
                        onChange={handleFormChange}
                      />
                      <div className="requirement-content">
                        <div className="requirement-icon">🛡️</div>
                        <span className="requirement-text">Requires Insurance</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="input-container">
                    <div className="input-wrapper">
                      <label className="input-label">Preferred Pickup Time</label>
                      <input
                        type="time"
                        name="preferredPickupTime"
                        value={formData.preferredPickupTime}
                        onChange={handleFormChange}
                        className="text-input"
                      />
                    </div>
                  </div>
                  
                  <div className="input-container">
                    <div className="input-wrapper">
                      <label className="input-label">Preferred Delivery Time</label>
                      <input
                        type="time"
                        name="preferredDeliveryTime"
                        value={formData.preferredDeliveryTime}
                        onChange={handleFormChange}
                        className="text-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="button-container">
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="next-button"
                  disabled={!formData.cargoType || cargoItems.length === 0}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="step-container">
              <p className="step-title">Pickup & Delivery Locations</p>
              
              <div className="form-container">
                <div className="form-column">
                  <div className="location-section">
                    <h3>Pickup Location</h3>
                    <GoogleMapWithSearch 
                      onLocationSelect={handlePickupLocationSelect}
                      placeholder="Search for pickup location..."
                      height="400px"
                    />
                    {pickupLocation && (
                      <div className="selected-location">
                        <p><strong>Selected:</strong> {pickupLocation.name}</p>
                        <p className="location-coords">Coordinates: {pickupLocation.latitude}, {pickupLocation.longitude}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="location-section" style={{ marginTop: '20px' }}>
                    <h3>Delivery Location</h3>
                    <GoogleMapWithSearch 
                      onLocationSelect={handleDeliveryLocationSelect}
                      placeholder="Search for delivery location..."
                      height="400px"
                    />
                    {deliveryLocation && (
                      <div className="selected-location">
                        <p><strong>Selected:</strong> {deliveryLocation.name}</p>
                        <p className="location-coords">Coordinates: {deliveryLocation.latitude}, {deliveryLocation.longitude}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Price Calculator */}
                  {pickupLocation && deliveryLocation && selectedOrderType && (
                    <div className="price-calculator-section" style={{ marginTop: '20px' }}>
                      <PriceCalculator
                        pickupLocation={pickupLocation}
                        deliveryLocation={deliveryLocation}
                        orderTypeId={selectedOrderType}
                        onPriceCalculated={handlePriceCalculated}
                        simplified={true}
                      />
                    </div>
                  )}
                  
                  {priceCalculation && (
                    <div className="price-summary" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <p><strong>Estimated Delivery Fee:</strong> KSh {priceCalculation.totalPrice?.toFixed(2) || '0.00'}</p>
                      <p><strong>Distance:</strong> {priceCalculation.distance?.toFixed(2) || '0.00'} km</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="button-container">
                <button 
                  type="button" 
                  onClick={handlePreviousStep}
                  className="prev-button"
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="next-button"
                  disabled={!pickupLocation || !deliveryLocation}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="step-container">
              <p className="step-title">Contact Details</p>
              
              <div className="contact-details-container">
                <div className="contact-section">
                  <p className="section-label">Your details</p>
                  <div className="contact-row">
                    <div className="contact-info-box">
                      <p>Name</p>
                      <p>{name}</p>
                    </div>
                    <div className="contact-info-box">
                      <p>Phone</p>
                      <p>{phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="contact-section">
                  <p className="section-label">Enter alternative contact details *</p>
                  <div className="contact-row">
                    <input
                      type="text"
                      name="name"
                      placeholder="Contact Name"
                      value={userDetails.name}
                      onChange={handleUserDetailsChange}
                      className="contact-input"
                      required
                    />
                    <input
                      type="text"
                      name="contact"
                      placeholder="Contact Phone number"
                      value={userDetails.contact}
                      onChange={handleUserDetailsChange}
                      className="contact-input"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="button-container">
                <button 
                  type="button" 
                  onClick={handlePreviousStep}
                  className="prev-button"
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="next-button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="step-container">
              <p className="step-title">Order Summary</p>
              
              <div className="receipt-container">
                <div className="receipt-wrapper">
                  <div className="receipt">
                    <h3 className="receipt-title">Cargo Delivery Order</h3>
                    
                    <div className="receipt-section">
                      <h4 className="receipt-section-title">Cargo Type</h4>
                      <p>{CARGO_TYPES.find(t => t.id === formData.cargoType)?.name || 'N/A'}</p>
                    </div>
                    
                    <div className="receipt-section">
                      <h4 className="receipt-section-title">Cargo Items ({cargoItems.length})</h4>
                      {cargoItems.map((item, index) => (
                        <div key={item.id} className="receipt-details">
                          <p><strong>Item {index + 1}:</strong> {item.name} × {item.quantity}</p>
                          <p>Weight: {item.weight} kg | Dimensions: {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} cm</p>
                          {item.isFragile && <p className="fragile-badge">FRAGILE</p>}
                          {item.isNonFragile && <p className="non-fragile-badge">NON-FRAGILE</p>}
                        </div>
                      ))}
                      <p><strong>Total Weight:</strong> {formData.totalWeight.toFixed(1)} kg</p>
                      <p><strong>Total Declared Value:</strong> KSh {formData.declaredValue ? Number(formData.declaredValue).toLocaleString() : '0'}</p>
                    </div>
                    
                    {priceCalculation && (
                      <div className="receipt-section">
                        <h4 className="receipt-section-title">Delivery Fee</h4>
                        <div className="receipt-details">
                          <p>KSh {priceCalculation.totalPrice?.toFixed(2) || '0.00'}</p>
                          <p>Distance: {priceCalculation.distance?.toFixed(2) || '0.00'} km</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="receipt-section">
                      <h4 className="receipt-section-title">Pickup Location</h4>
                      <div className="receipt-details">
                        <p>{pickupLocation?.name || formData.pickupAddress}</p>
                      </div>
                    </div>
                    
                    <div className="receipt-section">
                      <h4 className="receipt-section-title">Delivery Location</h4>
                      <div className="receipt-details">
                        <p>{deliveryLocation?.name || formData.deliveryAddress}</p>
                      </div>
                    </div>
                    
                    <div className="receipt-section">
                      <h4 className="receipt-section-title">Contact Information</h4>
                      <div className="receipt-details">
                        <p><span className="label">Name:</span> {userDetails.name}</p>
                        <p><span className="label">Contact:</span> {userDetails.contact}</p>
                      </div>
                    </div>
                    
                    {formData.additionalDescription && (
                      <div className="receipt-section">
                        <h4 className="receipt-section-title">Additional Description</h4>
                        <div className="receipt-details">
                          <p>{formData.additionalDescription}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {isAdmin && pickupLocation && deliveryLocation && (
                <div className="commission-section" style={{ marginTop: '20px' }}>
                  <div className="commission-header" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <FaMoneyBillWave style={{ color: '#28a745', marginRight: '10px' }} />
                    <h3 style={{ margin: 0, color: '#333' }}>Commission Breakdown</h3>
                  </div>
                  <UniversalCommissionCalculator
                    totalPrice={priceCalculation?.totalPrice || 1000}
                    taskType="cargo"
                    taskLocation={pickupLocation}
                    deliveryLocation={deliveryLocation}
                    serviceType="standard"
                    showDetails={true}
                  />
                </div>
              )}
              
              <div className="button-container">
                <button 
                  type="button" 
                  onClick={handlePreviousStep}
                  className="prev-button"
                  disabled={isSubmitting}
                >
                  Previous
                </button>
                <button 
                  type="submit"
                  className="confirm-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default CargoDelivery;
