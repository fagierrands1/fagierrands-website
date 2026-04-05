import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import MapWithSearch from '../Common/MapWithSearch';
import UniversalCommissionCalculator from '../Common/UniversalCommissionCalculator';
import axios from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import { FaMapMarkerAlt, FaTools, FaMoneyBillWave, FaImage, FaTimes } from 'react-icons/fa';
import fileUploadService from '../../services/fileUploadService';
import './Handyman.css';

const Handyman = () => {
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
  
  const [serviceTypes, setServiceTypes] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  
  // State for service location
  const [serviceLocation, setServiceLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    serviceAddress: '',
    scheduledDate: '',
    scheduledTimeSlot: 'morning',
    alternativeContact: '',
    title: 'Home-Maintenance Service Request',
    order_type: '',
  });
  
  const [workImages, setWorkImages] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Required service types with fallback
  const requiredServiceTypes = [
    { id: 1, name: 'Plumbing' },
    { id: 2, name: 'Electrical Works' },
    { id: 3, name: 'Landscaping (Gardening)' }
  ];
  
  const timeSlots = [
    { value: 'morning', label: 'Morning (8:00 AM - 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon (12:00 PM - 5:00 PM)' },
    { value: 'evening', label: 'Evening (5:00 PM - 8:00 PM)' }
  ];
  
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
          // Pre-fill alternative contact with client info
          setFormData(prev => ({
            ...prev,
            alternativeContact: response.data.phone_number || response.data.phone || ''
          }));
        } catch (error) {
          console.error('Error fetching client details:', error);
          setMessage('Failed to load client details. Please try again.');
        }
      }
    };
    
    fetchClientDetails();
  }, [clientId, placeOrderForClient, getAuthToken]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get service types from Django backend
        try {
          const serviceTypesResponse = await axios.get(`/orders/handyman/service-types/`);
          
          let serviceTypesData;
          if (serviceTypesResponse.data.results) {
            serviceTypesData = serviceTypesResponse.data.results;
          } else if (Array.isArray(serviceTypesResponse.data)) {
            serviceTypesData = serviceTypesResponse.data;
          } else {
            console.warn("Unexpected service types response format:", serviceTypesResponse.data);
            serviceTypesData = [];
          }
          
          if (serviceTypesData.length > 0) {
            setServiceTypes(serviceTypesData);
          } else {
            setServiceTypes(requiredServiceTypes);
          }
        } catch (err) {
          console.error("Error fetching service types:", err);
          setServiceTypes(requiredServiceTypes);
        }
        
        // Get order types from Django backend
        try {
          const token = await getAuthToken();
          const orderTypesResponse = await axios.get(`/orders/types/`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          let orderTypesData;
          if (Array.isArray(orderTypesResponse.data)) {
            orderTypesData = orderTypesResponse.data;
          } else if (orderTypesResponse.data.results) {
            orderTypesData = orderTypesResponse.data.results;
          } else {
            const typesArray = Object.keys(orderTypesResponse.data).map(key => {
              const item = orderTypesResponse.data[key];
              return typeof item === 'object' ? { ...item, id: item.id || key } : { id: key, name: item };
            });
            orderTypesData = typesArray;
          }
          
          setOrderTypes(orderTypesData);
          
          // Set the home-maintenance order type
          const handymanOrderType = orderTypesData.find(type => 
            type.id === 5 || 
            (type.name && (
              type.name.toLowerCase().includes('handyman') || 
              type.name.toLowerCase().includes('home-maintenance') ||
              type.name.toLowerCase().includes('maintenance')
            ))
          );
          
          if (handymanOrderType) {
            setFormData(prev => ({ ...prev, order_type: handymanOrderType.id }));
          }
        } catch (err) {
          console.error("Error fetching order types:", err);
          setError(`Failed to load order types: ${err.message}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load service data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getAuthToken]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleServiceLocationSelect = (location) => {
    if (location && !location.name && formData.serviceAddress) {
      location.name = formData.serviceAddress;
    }
    setServiceLocation(location);
    if (location && location.name) {
      setFormData(prev => ({ ...prev, serviceAddress: location.name }));
    }
  };
  
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      const validation = fileUploadService.validateFile(file);
      if (!validation.valid) {
        setMessage(validation.error);
        continue;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setWorkImages(prev => [...prev, { file, preview: previewUrl, name: file.name }]);
    }
    event.target.value = '';
  };
  
  const removePhoto = (index) => {
    const photo = workImages[index];
    if (photo.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setWorkImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleNextStep = () => {
    setMessage('');
    
    if (currentStep === 1) {
      if (!formData.serviceType) {
        setMessage('Please select a service type');
        return;
      }
      if (!formData.description.trim()) {
        setMessage('Please provide a description');
        return;
      }
      if (workImages.length === 0) {
        setMessage('Please add at least one photo');
        return;
      }
    } else if (currentStep === 2) {
      if (!serviceLocation) {
        setMessage('Please select a service location');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.scheduledDate) {
        setMessage('Please select a scheduled date');
        return;
      }
      if (!formData.scheduledTimeSlot) {
        setMessage('Please select a time slot');
        return;
      }
      
      // Validate date is not in the past
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setMessage('Please select a future date');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };
  
  const handlePreviousStep = () => {
    setMessage('');
    setCurrentStep(currentStep - 1);
  };
  
  const validateForm = () => {
    if (!formData.serviceType) {
      setMessage('Please select a service type');
      return false;
    }
    if (!formData.description.trim()) {
      setMessage('Please provide a description');
      return false;
    }
    if (!serviceLocation) {
      setMessage('Please select a service location');
      return false;
    }
    if (!formData.scheduledDate) {
      setMessage('Please select a scheduled date');
      return false;
    }
    if (!formData.scheduledTimeSlot) {
      setMessage('Please select a time slot');
      return false;
    }
    if (workImages.length === 0) {
      setMessage('Please add at least one photo');
      return false;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setMessage('Please select a future date');
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
    
    setSubmitLoading(true);
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        setMessage('You are not logged in. Please log in to place an order.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Format date to ensure it's in YYYY-MM-DD format
      let formattedDate = formData.scheduledDate;
      if (formData.scheduledDate && typeof formData.scheduledDate === 'string') {
        const dateObj = new Date(formData.scheduledDate);
        formattedDate = dateObj.toISOString().split('T')[0];
      }
      
      const orderData = {
        service_type_id: parseInt(formData.serviceType),
        title: formData.title.trim(),
        description: formData.description.trim(),
        address: serviceLocation.name || formData.serviceAddress || 'Custom location',
        latitude: serviceLocation.latitude,
        longitude: serviceLocation.longitude,
        scheduled_date: formattedDate,
        scheduled_time_slot: formData.scheduledTimeSlot,
        alternative_contact: formData.alternativeContact.trim() || null,
        order_type_id: formData.order_type || 5,
        // Add client_id if placing order on behalf of a client
        ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
      };
      
      const response = await axios.post(
        `/orders/handyman/orders/`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const newOrder = response.data;
      const orderId = newOrder.id || newOrder.order_id;
      
      // Upload photos if order was created successfully
      if (orderId && workImages.length > 0) {
        setUploadingPhotos(true);
        try {
          await Promise.allSettled(
            workImages.map(async (photo) => {
              await fileUploadService.uploadOrderAttachment(orderId, photo.file);
            })
          );
        } catch (uploadError) {
          console.error('Error uploading photos:', uploadError);
          setMessage('Order created but photo upload failed. You can add photos later.');
        } finally {
          setUploadingPhotos(false);
        }
      }
      
      setMessage('Order placed successfully');
      setTimeout(() => {
        navigate(`/orders/${orderId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating home-maintenance order:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setMessage('Authentication error. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          const errorData = error.response.data;
          let errorMessage = 'Failed to create order. ';
          
          if (errorData.detail) {
            errorMessage += errorData.detail;
          } else if (typeof errorData === 'string') {
            errorMessage += errorData;
          } else if (typeof errorData === 'object') {
            const fieldErrors = [];
            for (const [field, messages] of Object.entries(errorData)) {
              if (Array.isArray(messages)) {
                fieldErrors.push(`${field}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                fieldErrors.push(`${field}: ${messages}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage += fieldErrors.join('; ');
            }
          }
          
          setMessage(errorMessage);
        }
      } else if (error.request) {
        setMessage('Network error. Please check your connection and try again.');
      } else {
        setMessage(`Failed to create order: ${error.message}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service types...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <main className="main-content">
        <div className="shop-header">
          <h1 className="shop-title">
            <FaTools className="inline-block mr-2" />
            {placeOrderForClient && clientName 
              ? `Place Order for ${clientName}`
              : 'Home-Maintenance Services'}
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
        
        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success-message' : 'error-message'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <div className="step-container">
            <p className="step-title">Service Details</p>
              
              <div className="select-container">
                <div className="select-wrapper">
                  <label className="input-label">Order Type *</label>
                  <select 
                    className="select-input"
                    name="order_type"
                    value={formData.order_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Order Type</option>
                    {orderTypes.map(type => (
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
                    onChange={handleChange}
                    className="text-input"
                    required
                  />
                </div>
              </div>
              
              <div className="select-container">
                <div className="select-wrapper">
                  <label className="input-label">Service Type *</label>
                  <select 
                    className="select-input"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.service_name || service.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="input-container">
                <div className="input-wrapper">
                  <label className="input-label">Service Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="textarea-input"
                    placeholder="Describe the work that needs to be done"
                    rows="4"
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="input-container">
                <div className="input-wrapper">
                  <label className="input-label">Alternative Contact</label>
                  <input
                    type="text"
                    name="alternativeContact"
                    value={formData.alternativeContact}
                    onChange={handleChange}
                    className="text-input"
                    placeholder="Alternative contact number (optional)"
                  />
                </div>
              </div>
              
              {/* Work Images - Required */}
              <div className="photos-section">
                <label className="input-label">Add Photos (required, at least 1) *</label>
                <div className="photos-container">
                  {workImages.map((photo, index) => (
                    <div key={index} className="photo-preview">
                      <img src={photo.preview} alt={`Work ${index + 1}`} />
                      <button 
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="remove-photo"
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
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <p className="input-hint">Please add at least one photo showing the work that needs to be done</p>
              </div>
            
            {/* Service Location Section */}
            <div style={{ marginTop: '30px' }}>
              <p className="step-title">Service Location *</p>
              <p className="step-description">
                Where should the service be performed?
              </p>
              
              <div className="location-container">
                <div className="input-container">
                  <div className="input-wrapper">
                    <label className="input-label">Service Address *</label>
                    <input
                      type="text"
                      name="serviceAddress"
                      value={formData.serviceAddress}
                      onChange={handleChange}
                      className="text-input"
                      placeholder="Enter service address"
                      required
                    />
                  </div>
                </div>
                
                <div className="map-wrapper">
                  <label className="input-label">Select on Map *</label>
                  <MapWithSearch 
                    onLocationSelect={handleServiceLocationSelect}
                    placeholder="Search for service location..."
                  />
                  {serviceLocation && (
                    <div className="selected-location" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Selected: {serviceLocation.name}</p>
                          {serviceLocation.latitude && serviceLocation.longitude && (
                            <p className="text-xs text-blue-600">
                              Coordinates: {serviceLocation.latitude.toFixed(4)}, {serviceLocation.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Schedule Service Section */}
            <div style={{ marginTop: '30px' }}>
              <p className="step-title">Schedule Service *</p>
              
              <div className="schedule-container">
                <div className="form-row">
                  <div className="form-group">
                    <label className="input-label">Scheduled Date *</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      className="text-input"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="input-label">Time Slot *</label>
                    <select
                      name="scheduledTimeSlot"
                      value={formData.scheduledTimeSlot}
                      onChange={handleChange}
                      className="select-input"
                      required
                    >
                      <option value="">-- Select Time --</option>
                      {timeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Commission Section (Admin only) */}
            {isAdmin && serviceLocation && (
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
                  totalPrice={500}
                  taskType="maintenance"
                  taskLocation={serviceLocation}
                  serviceType="standard"
                  showDetails={true}
                />
              </div>
            )}
            
            {/* Submit Button */}
            <div className="button-container" style={{ marginTop: '30px', marginBottom: '20px' }}>
              <button
                type="submit"
                className={submitLoading || uploadingPhotos ? "confirm-button disabled" : "confirm-button"}
                disabled={submitLoading || uploadingPhotos}
                style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {submitLoading || uploadingPhotos ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Handyman;
