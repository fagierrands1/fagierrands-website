import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GoogleMapWithSearch from '../Common/GoogleMapWithSearch';
import PriceCalculator from '../Common/PriceCalculator';
import UniversalCommissionCalculator from '../Common/UniversalCommissionCalculator';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaMinus, FaMapMarkerAlt, FaMoneyBillWave, FaImage, FaTimes } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import fileUploadService from '../../services/fileUploadService';
import './PickupDelivery.css';

const PickupDelivery = () => {
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
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  
  // Items state - with dimensions
  const [items, setItems] = useState([{ id: '1', name: '', description: '', quantity: 1, dimensions: '' }]);
  const [currentItem, setCurrentItem] = useState({ name: '', description: '', quantity: 1, dimensions: '' });
  
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [approximateValue, setApproximateValue] = useState('');
  
  const [userDetails, setUserDetails] = useState({
    name: name || '',
    contact: phone || '',
  });
  
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    title: 'Pickup & Delivery Order',
  });
  
  // Photos - required
  const [pickupPhotos, setPickupPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
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
        
        const pickupType = typesArray.find(type => 
          type.name?.toLowerCase().includes('pickup') || 
          type.name?.toLowerCase().includes('delivery')
        );
        if (pickupType) {
          setSelectedOrderType(pickupType.id);
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
    if (!placeOrderForClient) {
      setUserDetails(prev => ({ ...prev, name: name || '', contact: phone || '' }));
    }
  }, [name, phone, placeOrderForClient]);
  
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const newItems = [...items];
    newItems[index][name] = name === 'quantity' ? parseInt(value) || 1 : value;
    setItems(newItems);
  };
  
  const handleAddItem = () => {
    if (!currentItem.name.trim()) {
      setMessage('Please enter item name');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      name: currentItem.name.trim(),
      description: currentItem.description.trim(),
      quantity: currentItem.quantity,
      dimensions: currentItem.dimensions.trim(),
    };
    
    setItems([...items, newItem]);
    setCurrentItem({ name: '', description: '', quantity: 1, dimensions: '' });
  };
  
  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = fileUploadService.validateFile(file);
    if (!validation.valid) {
      setMessage(validation.error);
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setPickupPhotos(prev => [...prev, { file, preview: previewUrl, name: file.name }]);
    event.target.value = '';
  };
  
  const removePhoto = (index) => {
    const photo = pickupPhotos[index];
    if (photo.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPickupPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePriceCalculated = (calculation) => {
    setPriceCalculation(calculation);
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
    if (!formData.title.trim()) {
      setMessage('Please enter an order title');
      return false;
    }
    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      setMessage('Please add at least one item');
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
    if (pickupPhotos.length === 0) {
      setMessage('Please add at least one photo');
      return false;
    }
    if (!approximateValue.trim() || isNaN(Number(approximateValue)) || Number(approximateValue) <= 0) {
      setMessage('Please enter a valid approximate value');
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
      
      const validItems = items.filter(item => item.name.trim());
      
      // Convert approximate_value to a number - preserve exact value entered by user
      let approximateValueNum = null;
      if (approximateValue) {
        // Get the raw value and ensure it's a valid number
        const rawValue = String(approximateValue).trim();
        
        // Use Number() for conversion which is more precise than parseFloat for integers
        // But first validate it's a valid number string
        if (!/^-?\d*\.?\d+$/.test(rawValue)) {
          setMessage('Please enter a valid approximate value (numbers only)');
          setIsSubmitting(false);
          return;
        }
        
        // Convert to number - for integers, this should preserve the exact value
        approximateValueNum = Number(rawValue);
        
        // Validate the converted value
        if (isNaN(approximateValueNum) || approximateValueNum <= 0 || !isFinite(approximateValueNum)) {
          setMessage('Please enter a valid approximate value');
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('[PickupDelivery] Approximate value conversion:', {
        originalInput: approximateValue,
        rawValue: approximateValue ? String(approximateValue).trim() : null,
        converted: approximateValueNum,
        convertedString: approximateValueNum !== null ? String(approximateValueNum) : null,
        type: typeof approximateValueNum
      });
      
      const orderData = {
        order_type_id: selectedOrderType,
        title: formData.title.trim(),
        additional_description: additionalDescription.trim(),
        pickup_address: pickupLocation.name || formData.pickupAddress || 'Custom location',
        pickup_latitude: pickupLocation.latitude,
        pickup_longitude: pickupLocation.longitude,
        delivery_address: deliveryLocation.name || formData.deliveryAddress || 'Custom location',
        delivery_latitude: deliveryLocation.latitude,
        delivery_longitude: deliveryLocation.longitude,
        recipient_name: userDetails.name.trim(),
        contact_number: userDetails.contact.trim(),
        items: validItems.map(item => ({
          name: item.name,
          description: item.dimensions 
            ? `${item.description} | Dimensions: ${item.dimensions}` 
            : item.description,
          quantity: item.quantity
        })),
        approximate_value: approximateValueNum,
        estimated_price: priceCalculation?.totalPrice ? Number(priceCalculation.totalPrice.toFixed(2)) : undefined,
        distance: priceCalculation?.distance ? Number(priceCalculation.distance.toFixed(3)) : undefined,
        // Add client_id if placing order on behalf of a client
        ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
      };
      
      // Log the exact data being sent
      console.log('[PickupDelivery] Order data being sent:', {
        approximate_value: orderData.approximate_value,
        approximate_value_type: typeof orderData.approximate_value,
        approximate_value_string: String(orderData.approximate_value),
        full_orderData: JSON.stringify(orderData, null, 2)
      });
      
      const response = await axios.post(
        '/orders/pickup-delivery/',
        orderData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      // Upload photos if order was created successfully
      const orderId = response.data?.id || response.data?.order_id || response.data?.order?.id;
      if (orderId && pickupPhotos.length > 0) {
        setUploadingPhotos(true);
        try {
          const uploadResults = await Promise.allSettled(
            pickupPhotos.map(async (photo) => {
              const result = await fileUploadService.uploadOrderAttachment(orderId, photo.file);
              if (!result.success) {
                console.error('Photo upload failed:', result.message || result.error);
                throw new Error(result.message || 'Upload failed');
              }
              return result;
            })
          );
          
          // Check for any failed uploads
          const failedUploads = uploadResults.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value?.success));
          if (failedUploads.length > 0) {
            console.error(`${failedUploads.length} photo(s) failed to upload`);
            setMessage(`Order created successfully, but ${failedUploads.length} photo(s) failed to upload. Please try uploading them again.`);
          }
        } catch (uploadError) {
          console.error('Error uploading photos:', uploadError);
          setMessage('Order created successfully, but photos failed to upload. Please try uploading them again.');
        } finally {
          setUploadingPhotos(false);
        }
      }
      
      setMessage('Order placed successfully!');
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating pickup & delivery order:', error);
      
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
              : 'Pickup & Delivery'}
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
        
        <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <div className="step-container">
            {/* Order Type & Title */}
            <div className="select-container" style={{ marginBottom: '20px' }}>
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
            
            <div className="form-container">
              <div className="form-column">
                <div className="input-container">
                  <div className="input-wrapper">
                    <label className="input-label">Order Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter order title"
                      value={formData.title}
                      onChange={handleChange}
                      className="text-input"
                      required
                    />
                  </div>
                </div>
                
                {/* Items Section */}
                <div className="items-section" style={{ marginTop: '20px' }}>
                  <p className="section-subtitle">Items to Pickup & Deliver</p>
                  
                  {items.map((item, index) => (
                    <div key={item.id} className="item-row">
                      <div className="item-fields">
                        <div className="item-field">
                          <label className="input-label">Item Name *</label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => handleInputChange(index, e)}
                            className="text-input"
                            required
                          />
                        </div>
                        
                        <div className="item-field">
                          <label className="input-label">Description</label>
                          <input
                            type="text"
                            name="description"
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleInputChange(index, e)}
                            className="text-input"
                          />
                        </div>
                        
                        <div className="item-field">
                          <label className="input-label">Dimensions (optional)</label>
                          <input
                            type="text"
                            name="dimensions"
                            placeholder="e.g., 30cm x 20cm x 15cm"
                            value={item.dimensions}
                            onChange={(e) => handleInputChange(index, e)}
                            className="text-input"
                          />
                        </div>
                        
                        <div className="item-quantity">
                          <label className="input-label">Quantity *</label>
                          <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(index, e)}
                            className="text-input"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="item-actions">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length === 1}
                          className="action-button"
                        >
                          <FaMinus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add New Item */}
                <div className="add-item-section" style={{ marginTop: '20px' }}>
                  <p className="section-subtitle">Add New Item</p>
                  <div className="item-fields">
                    <div className="item-field">
                      <label className="input-label">Item Name</label>
                      <input
                        type="text"
                        placeholder="Item name"
                        value={currentItem.name}
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="item-field">
                      <label className="input-label">Description</label>
                      <input
                        type="text"
                        placeholder="Item description"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="item-field">
                      <label className="input-label">Dimensions (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., 30cm x 20cm x 15cm"
                        value={currentItem.dimensions}
                        onChange={(e) => setCurrentItem({ ...currentItem, dimensions: e.target.value })}
                        className="text-input"
                      />
                    </div>
                    
                    <div className="item-quantity">
                      <label className="input-label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                        className="text-input"
                      />
                    </div>
                  </div>
                  <button type="button" onClick={handleAddItem} className="add-item-button">
                    <FaPlus /> Add Item
                  </button>
                </div>
                
                {/* Additional Instructions */}
                <div className="description-container" style={{ marginTop: '20px' }}>
                  <p className="input-label">Additional Instructions</p>
                  <textarea
                    rows={3}
                    placeholder="Any special instructions or additional details"
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                    className="textarea-input"
                  />
                </div>
                
                {/* Approximate Value */}
                <div className="input-container" style={{ marginTop: '20px' }}>
                  <div className="input-wrapper">
                    <label className="input-label">Approximate Value of Items (KES) *</label>
                    <input
                      type="number"
                      placeholder="e.g., 2500"
                      value={approximateValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Store the exact value as entered by the user
                        setApproximateValue(value);
                        console.log('[PickupDelivery] Input changed:', { value, type: typeof value });
                      }}
                      className="text-input"
                      required
                      min="1"
                      step="1"
                    />
                    <p className="input-hint">Enter the estimated value of the items being picked up</p>
                  </div>
                </div>
                
                {/* Photo Upload */}
                <div className="photos-section" style={{ marginTop: '20px' }}>
                  <label className="input-label">Upload Photos (required, at least 1) *</label>
                  <div className="photos-container">
                    {pickupPhotos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img src={photo.preview} alt={photo.name} />
                        <button 
                          type="button" 
                          className="remove-photo"
                          onClick={() => removePhoto(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                    <label className="photo-upload-btn">
                      <FaImage /> Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <p className="input-hint">Please add at least one photo of the items to be picked up</p>
                </div>
                
                {/* Contact Information */}
                <div className="contact-section" style={{ marginTop: '20px' }}>
                  <p className="section-subtitle">Contact Information</p>
                  
                  <div className="form-row">
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Your Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={userDetails.name}
                          onChange={handleUserDetailsChange}
                          className="text-input"
                          placeholder="Full name"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="input-container">
                      <div className="input-wrapper">
                        <label className="input-label">Contact Number *</label>
                        <input
                          type="tel"
                          name="contact"
                          value={userDetails.contact}
                          onChange={handleUserDetailsChange}
                          className="text-input"
                          placeholder="Phone number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pickup Location */}
                <div style={{ marginTop: '30px' }}>
                  <p className="section-subtitle">Pickup Location *</p>
                  <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '15px' }}>Please select your pickup location on the map</p>
                  
                  <GoogleMapWithSearch 
                    onLocationSelect={handlePickupLocationSelect}
                    placeholder="Search for pickup location..."
                    height="400px"
                  />
                  
                  <div className="input-container" style={{ marginTop: '15px' }}>
                    <div className="input-wrapper">
                      <label className="input-label">Pickup Address</label>
                      <input
                        type="text"
                        name="pickupAddress"
                        placeholder="Address will be filled automatically when you select on map"
                        value={formData.pickupAddress}
                        onChange={handleChange}
                        className="text-input"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Delivery Location */}
                <div style={{ marginTop: '30px' }}>
                  <p className="section-subtitle">Delivery Location *</p>
                  <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '15px' }}>Please select your delivery location on the map</p>
                  
                  <GoogleMapWithSearch 
                    onLocationSelect={handleDeliveryLocationSelect}
                    placeholder="Search for delivery location..."
                    height="400px"
                  />
                  
                  <div className="input-container" style={{ marginTop: '15px' }}>
                    <div className="input-wrapper">
                      <label className="input-label">Delivery Address</label>
                      <input
                        type="text"
                        name="deliveryAddress"
                        placeholder="Address will be filled automatically when you select on map"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        className="text-input"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Price Calculator */}
                  {pickupLocation && deliveryLocation && selectedOrderType && (
                    <div className="price-calculator-section" style={{ marginTop: '20px' }}>
                      <PriceCalculator
                        pickupLocation={pickupLocation}
                        deliveryLocation={deliveryLocation}
                        orderTypeId={selectedOrderType}
                        onPriceCalculated={handlePriceCalculated}
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
                
                {/* Commission Section (Admin only) */}
                {isAdmin && pickupLocation && deliveryLocation && (
                  <div className="commission-section" style={{ marginTop: '30px' }}>
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
                      taskType="delivery"
                      taskLocation={pickupLocation}
                      deliveryLocation={deliveryLocation}
                      serviceType="standard"
                      showDetails={true}
                    />
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="button-container" style={{ marginTop: '30px', marginBottom: '20px' }}>
                  <button 
                    type="submit"
                    className="confirm-button"
                    disabled={isSubmitting || uploadingPhotos}
                    style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    {isSubmitting || uploadingPhotos ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PickupDelivery;
