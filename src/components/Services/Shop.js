import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Common/Header';
import GoogleMapWithSearch from '../Common/GoogleMapWithSearch';
import PriceCalculator from '../Common/PriceCalculator';
import UniversalCommissionCalculator from '../Common/UniversalCommissionCalculator';
import Footer from '../Common/Footer';
import { FaMinus, FaMoneyBillWave, FaImage, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axiosConfig';
import fileUploadService from '../../services/fileUploadService';
import './Shop.css';

const Shop = () => {
    const { user, profile, getAuthToken, isAdmin } = useAuth();
    const location = useLocation(); // For navigation state
    const name = user?.name || profile?.name || '';
    const phone = user?.phone || profile?.phone || '';
    
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userLocation } = useLocationContext();
    
    // Check if this is for placing an order on behalf of a client
    const placeOrderForClient = location.state?.placeOrderForClient || false;
    const clientId = location.state?.clientId || null;
    const clientName = location.state?.clientName || null;
    const [clientDetails, setClientDetails] = useState(null);
    const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [user_details, setUserDetails] = useState({ contact: phone || '', name: name || '' });
    const [additional_description, setAdditionalDescription] = useState('');
    const [orderTypes, setOrderTypes] = useState([]);
    const [selectedOrderType, setSelectedOrderType] = useState('');
    const [title, setTitle] = useState('Shopping Order');
    const [preferred_outlet, setPreferredOutlet] = useState('');
    
    // Location states - separate pickup and delivery
    const defaultPickupLocation = useMemo(() => ({
        latitude: -1.2921, // Nairobi CBD coordinates
        longitude: 36.8219,
        name: 'Nairobi CBD Shopping Area'
    }), []);
    
    const [pickupLocation, setPickupLocation] = useState(defaultPickupLocation);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    
    // Attachments
    const [attachments, setAttachments] = useState([]);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);
    
    // Price calculation
    const [priceCalculation, setPriceCalculation] = useState(null);
    
    // Payment method
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [paymentPhone, setPaymentPhone] = useState(phone || '');
    const [paymentEmail, setPaymentEmail] = useState('');
    
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
    
    // Fetch order types when component mounts
    useEffect(() => {
        const fetchOrderTypes = async () => {
            try {
                const token = await getAuthToken();
                
                const response = await axios.get(
                    `/orders/types/`,
                    {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    }
                );
                
                if (Array.isArray(response.data)) {
                    setOrderTypes(response.data);
                } else if (typeof response.data === 'object' && response.data !== null) {
                    if (Array.isArray(response.data.results)) {
                        setOrderTypes(response.data.results);
                    } else {
                        const typesArray = Object.keys(response.data).map(key => {
                            const item = response.data[key];
                            return typeof item === 'object' ? { ...item, id: item.id || key } : { id: key, name: item };
                        });
                        setOrderTypes(typesArray);
                    }
                } else {
                    console.error('Unexpected response format:', response.data);
                    setOrderTypes([]);
                }
                
                // Set shopping order type as default
                const shoppingType = Array.isArray(response.data) 
                    ? response.data.find(t => t.name?.toLowerCase().includes('shop'))
                    : (response.data.results?.find(t => t.name?.toLowerCase().includes('shop')) || 
                       Object.values(response.data).find(t => typeof t === 'object' && t?.name?.toLowerCase().includes('shop')));
                
                if (shoppingType) {
                    setSelectedOrderType(shoppingType.id);
                } else if (Array.isArray(response.data) && response.data.length > 0) {
                    setSelectedOrderType(response.data[0].id);
                } else if (response.data.results?.length > 0) {
                    setSelectedOrderType(response.data.results[0].id);
                }
            } catch (error) {
                console.error('Error fetching order types:', error);
                setOrderTypes([]);
                if (error.response?.status === 401) {
                    setMessage('Authentication required. Please log in.');
                    navigate('/login');
                }
            }
        };
        
        fetchOrderTypes();
    }, [navigate, getAuthToken]);

    const handleAddItem = () => {
        setItems([...items, { name: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        calculateTotalPrice(newItems);
    };

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newItems = [...items];
        newItems[index][name] = name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value;
        setItems(newItems);
        calculateTotalPrice(newItems);
    };

    const calculateTotalPrice = (items) => {
        const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        setTotalPrice(total);
    };


    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const validation = fileUploadService.validateFile(file);
        if (!validation.valid) {
            setMessage(validation.error);
            return;
        }
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setAttachments(prev => [...prev, { file, preview: previewUrl, name: file.name }]);
        event.target.value = ''; // Reset input
    };

    const removeAttachment = (index) => {
        const attachment = attachments[index];
        if (attachment.preview) {
            URL.revokeObjectURL(attachment.preview);
        }
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handlePriceCalculated = (calculation) => {
        setPriceCalculation(calculation);
    };

    const validateForm = () => {
        if (!selectedOrderType) {
            setMessage('Please select an order type');
            return false;
        }
        if (!title.trim()) {
            setMessage('Please enter an order title');
            return false;
        }
        if (!additional_description.trim()) {
            setMessage('Please provide a description');
            return false;
        }
        if (items.length === 0 || items.every(item => !item.name.trim())) {
            setMessage('Please add at least one item');
            return false;
        }
        if (!deliveryLocation) {
            setMessage('Please select a delivery location');
            return false;
        }
        if (!user_details.name.trim() || !user_details.contact.trim()) {
            setMessage('Please provide contact details');
            return false;
        }
        if (paymentMethod === 'mpesa' && !paymentPhone.trim()) {
            setMessage('Please enter your M-Pesa phone number');
            return false;
        }
        if (paymentMethod === 'card' && !paymentEmail.trim()) {
            setMessage('Please enter your email for card payment');
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
    
        try {
            const token = await getAuthToken();
            
            if (!token) {
                setMessage('You are not logged in. Please log in to place an order.');
                navigate('/login');
                return;
            }
            
            // Format data to match the mobile app's order structure
            const orderData = {
                order_type: selectedOrderType,
                title: title.trim(),
                description: additional_description.trim(),
                pickup_address: preferred_outlet.trim() || '',
                delivery_address: deliveryLocation.name || 'Custom location',
                pickup_latitude: pickupLocation.latitude,
                pickup_longitude: pickupLocation.longitude,
                delivery_latitude: deliveryLocation.latitude,
                delivery_longitude: deliveryLocation.longitude,
                contact_name: user_details.name.trim() || name,
                contact_phone: user_details.contact.trim() || phone,
                items: items.filter(item => item.name.trim()).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price || 0
                })),
                estimated_price: priceCalculation?.totalPrice ? Number(priceCalculation.totalPrice.toFixed(2)) : undefined,
                distance: priceCalculation?.distance ? Number(priceCalculation.distance.toFixed(3)) : undefined,
                attachments_count: attachments.length || undefined,
                payment_method: paymentMethod,
                ...(paymentMethod === 'mpesa' ? { phone_number: paymentPhone.trim() } : {}),
                ...(paymentMethod === 'card' ? { email: paymentEmail.trim() } : {}),
                // Add client_id if placing order on behalf of a client
                ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
            };
            
            const response = await axios.post(
                `/orders/shopping/`,
                orderData,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Upload attachments if order was created successfully
            const orderId = response.data?.id || response.data?.order_id || response.data?.order?.id;
            if (orderId && attachments.length > 0) {
                setUploadingAttachments(true);
                try {
                    await Promise.allSettled(
                        attachments.map(async (attachment) => {
                            const formData = new FormData();
                            formData.append('file', attachment.file);
                            await fileUploadService.uploadOrderAttachment(orderId, attachment.file);
                        })
                    );
                } catch (uploadError) {
                    console.error('Error uploading attachments:', uploadError);
                    // Don't fail the order if attachments fail
                } finally {
                    setUploadingAttachments(false);
                }
            }
            
            setMessage('Order placed successfully');
            setTimeout(() => {
                navigate('/my-orders');
            }, 1500);
            
        } catch (error) {
            console.error('Error placing order:', error);
            
            if (error.response) {
                if (error.response.status === 401) {
                    setMessage('Authentication error. Please log in again.');
                    navigate('/login');
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

    const safeOrderTypes = Array.isArray(orderTypes) ? orderTypes : [];
    const depositAmount = Math.round(totalPrice * 0.3);

    return (
        <div className='shop-container'>
            <main className='shop-main'>
                <div className="shop-header">
                    <h1 className="shop-title">
                        {placeOrderForClient && clientName 
                            ? `Place Order for ${clientName}`
                            : 'Shop Online'}
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
                        <p className='step-title'>Shopping Items</p>
                            
                            {/* Order Type Selection */}
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
                                        {safeOrderTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Order Title */}
                            <div className="input-container">
                                <div className="input-wrapper">
                                    <label className="input-label">Order Title *</label>
                                    <input 
                                        type="text" 
                                        className="text-input"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter order title"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Preferred Outlet */}
                            <div className="input-container">
                                <div className="input-wrapper">
                                    <label className="input-label">Preferred Outlet (optional)</label>
                                    <input 
                                        type="text" 
                                        className="text-input"
                                        value={preferred_outlet}
                                        onChange={(e) => setPreferredOutlet(e.target.value)}
                                        placeholder="e.g., Carrefour, Quickmart, Naivas, etc."
                                    />
                                </div>
                            </div>
                            
                            {items.map((item, index) => (
                                <div key={index} className="item-row">
                                    <div className='item-fields'>
                                        <div className='item-name-field'>
                                            <p>Name *</p>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Shopping item Name"
                                                value={item.name}
                                                onChange={(e) => handleInputChange(index, e)}
                                                className='text-input'
                                                required
                                            />
                                        </div>

                                        <div className='item-quantity-field'>
                                            <p>Quantity *</p>
                                            <input
                                                type="number"
                                                name="quantity"
                                                placeholder="Quantity"
                                                value={item.quantity}
                                                onChange={(e) => handleInputChange(index, e)}
                                                className='text-input'
                                                required
                                                min="1"
                                            />
                                        </div>

                                        <div className='item-price-field'>
                                            <p>Item Price (KES) *</p>
                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="Price per item"
                                                value={item.price}
                                                onChange={(e) => handleInputChange(index, e)}
                                                className='text-input'
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className='item-buttons'>
                                        <button type="button" onClick={handleAddItem}>
                                            <FaPlus />
                                        </button>
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveItem(index)}>
                                                <FaMinus />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <div className='description-container'>
                                <p className='input-label'>Important Description *</p>
                                <textarea
                                    rows={3}
                                    className='textarea-input'
                                    placeholder="Additional Items Description ie Nature of items to be shopped (weight, volume, value, fragility and legality)"
                                    value={additional_description}
                                    onChange={(e) => setAdditionalDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Attachments */}
                            <div className="attachments-section">
                                <label className="input-label">Attachments (optional, max 5)</label>
                                <div className="attachments-container">
                                    {attachments.map((attachment, index) => (
                                        <div key={index} className="attachment-preview">
                                            <img src={attachment.preview} alt={attachment.name} />
                                            <button 
                                                type="button" 
                                                className="remove-attachment"
                                                onClick={() => removeAttachment(index)}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                    {attachments.length < 5 && (
                                        <label className="attachment-upload-btn">
                                            <FaImage /> Add Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="attachment-hint">You can attach up to 5 images (receipts, item photos, lists)</p>
                            </div>

                            <div className='total-price'>Items Total: KSh {totalPrice.toFixed(2)}</div>
                            {totalPrice > 0 && (
                                <div className='deposit-info'>
                                    <p>Required Deposit (30%): KSh {depositAmount.toLocaleString()}</p>
                                </div>
                            )}
                            
                        {/* Contact Details Section */}
                        <div style={{ marginTop: '30px' }}>
                            <h2 className='step-title'>Contact Details</h2>
                            <div className='contact-details-container'>
                                <div className='contact-section'>
                                    <p className='section-label'>Your details</p>
                                    <div className='contact-row'>
                                        <div className='contact-info-box'>
                                            <p>Name</p>
                                            <p>{name}</p>
                                        </div>
                                        <div className='contact-info-box'>
                                            <p>Phone</p>
                                            <p>{phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='contact-section'>
                                    <p className='section-label'>Enter alternative contact details *</p>
                                    <div className='contact-row'>
                                        <input
                                            type="text"
                                            placeholder="Contact Name"
                                            value={user_details.name}
                                            onChange={(e) => setUserDetails({ ...user_details, name: e.target.value })}
                                            className='contact-input'
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Contact Phone number"
                                            value={user_details.contact}
                                            onChange={(e) => setUserDetails({ ...user_details, contact: e.target.value })}
                                            className='contact-input'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Delivery Location Section */}
                        <div style={{ marginTop: '30px' }}>
                            <h2 className='location-title'>Delivery Location *</h2>
                            <GoogleMapWithSearch 
                                onLocationSelect={(location) => {
                                    setDeliveryLocation(location);
                                }}
                                placeholder="Search for delivery location..."
                                height="500px"
                            />
                            
                            {deliveryLocation && (
                                <div className="location-info">
                                    <h3 className="location-subtitle">Selected Delivery Location:</h3>
                                    <p>{deliveryLocation.name || 'Custom location'}</p>
                                    <p className="location-coordinates">
                                        Lat: {deliveryLocation.latitude}, Lng: {deliveryLocation.longitude}
                                    </p>
                                </div>
                            )}

                            {/* Price Calculator */}
                            {deliveryLocation && pickupLocation && selectedOrderType && (
                                <div className="price-calculator-section">
                                    <PriceCalculator
                                        pickupLocation={pickupLocation}
                                        deliveryLocation={deliveryLocation}
                                        orderTypeId={selectedOrderType}
                                        items={items.filter(i => i.name.trim()).map(i => ({ 
                                            name: i.name, 
                                            price: i.price || 0, 
                                            quantity: i.quantity || 1 
                                        }))}
                                        onPriceCalculated={handlePriceCalculated}
                                        simplified={true}
                                    />
                                </div>
                            )}

                            {priceCalculation && (
                                <div className="price-summary">
                                    <p><strong>Estimated Delivery Fee:</strong> KSh {priceCalculation.totalPrice?.toFixed(2) || '0.00'}</p>
                                    <p><strong>Distance:</strong> {priceCalculation.distance?.toFixed(2) || '0.00'} km</p>
                                </div>
                            )}
                            
                        </div>
                        
                        {/* Payment Method Section */}
                        <div style={{ marginTop: '30px' }}>
                            <h2 className='step-title'>Payment Method for Deposit</h2>
                            <p className="section-subtitle">A 30% deposit will be automatically charged to confirm your order</p>
                            
                            <div className="payment-method-selection">
                                <button
                                    type="button"
                                    className={`payment-method-btn ${paymentMethod === 'mpesa' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('mpesa')}
                                >
                                    M-Pesa
                                </button>
                                <button
                                    type="button"
                                    className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    Card
                                </button>
                            </div>

                            {paymentMethod === 'mpesa' ? (
                                <div className="input-container">
                                    <div className="input-wrapper">
                                        <label className="input-label">M-Pesa Phone Number *</label>
                                        <input
                                            type="tel"
                                            className="text-input"
                                            value={paymentPhone}
                                            onChange={(e) => setPaymentPhone(e.target.value)}
                                            placeholder="07XXXXXXXX or 254XXXXXXX"
                                            required
                                        />
                                        <p className="input-hint">You'll receive an STK push to complete payment</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="input-container">
                                    <div className="input-wrapper">
                                        <label className="input-label">Email for Card Payment *</label>
                                        <input
                                            type="email"
                                            className="text-input"
                                            value={paymentEmail}
                                            onChange={(e) => setPaymentEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                        />
                                        <p className="input-hint">Payment link will be sent to this email</p>
                                    </div>
                                </div>
                            )}

                        </div>
                        
                        {/* Commission Section (Admin only) */}
                        {isAdmin && deliveryLocation && totalPrice > 0 && (
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
                                    totalPrice={totalPrice}
                                    taskType="shopping"
                                    taskLocation={deliveryLocation}
                                    serviceType="standard"
                                    showDetails={true}
                                />
                            </div>
                        )}
                        
                        {/* Submit Button */}
                        <div className='final-buttons-container' style={{ marginTop: '30px', marginBottom: '20px' }}>
                            <button
                                className='confirm-button'
                                type="submit"
                                disabled={isSubmitting || uploadingAttachments}
                                style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                {isSubmitting || uploadingAttachments ? 'Processing...' : 'Create Order & Pay Deposit'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default Shop;
