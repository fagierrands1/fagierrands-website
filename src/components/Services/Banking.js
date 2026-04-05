import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MapWithSearch from '../Common/MapWithSearch';
import UniversalCommissionCalculator from '../Common/UniversalCommissionCalculator';
import bankingService from '../../services/bankingService';
import axios from '../../utils/axiosConfig';
import { FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';
import './Banking.css';

const Banking = () => {
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

  const [formData, setFormData] = useState({
    bank: 'KCB',
    transaction_type: 'cheque_deposit',
    amount: '',
    transaction_details: '',
    recipient_name: '',
    recipient_account: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    order_type_id: '',
    bank_location: '',
  });
  
  const [bankLocation, setBankLocation] = useState(null);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderTypes, setOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const banks = [
    'KCB', 'Equity Bank', 'Cooperative Bank', 'NCBA Bank', 'Absa Bank',
    'Standard Chartered', 'DTB', 'I&M Bank', 'Family Bank', 'Stanbic Bank'
  ];

  const transactionTypes = [
    { value: 'cheque_deposit', label: 'Cheque Deposit' }
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
          // Pre-fill recipient name with client info
          setFormData(prev => ({
            ...prev,
            recipient_name: response.data.first_name && response.data.last_name 
              ? `${response.data.first_name} ${response.data.last_name}`
              : response.data.username || clientName || ''
          }));
        } catch (error) {
          console.error('Error fetching client details:', error);
          setError('Failed to load client details. Please try again.');
        }
      }
    };
    
    fetchClientDetails();
  }, [clientId, placeOrderForClient, getAuthToken, clientName]);
  
  // Fetch order types when component mounts
  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('/orders/types/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const typesArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        setOrderTypes(typesArray);
        
        // Set default order type if available
        if (typesArray.length > 0) {
          const bankingOrderType = typesArray.find(
            type => type.name?.toLowerCase().includes('banking')
          );
          
          if (bankingOrderType) {
            setFormData(prev => ({ ...prev, order_type_id: bankingOrderType.id }));
          } else {
            setFormData(prev => ({ ...prev, order_type_id: typesArray[0].id }));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order types:', error);
        setError('Failed to load order types. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchOrderTypes();
  }, [getAuthToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankLocationSelect = (location) => {
    setBankLocation(location);
    if (location && location.name) {
      setFormData(prev => ({ ...prev, bank_location: location.name }));
    }
  };

  const validateForm = () => {
    if (!formData.bank || !formData.transaction_type || !formData.transaction_details.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!formData.amount.trim()) {
      setError('Amount is required for cheque deposit');
      return false;
    }

    if (!formData.order_type_id) {
      setError('Please select an order type');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);

    try {
      const token = await getAuthToken();
      
      if (!token) {
        setError('You are not logged in. Please log in to place an order.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Prepare order data to match mobile app's structure
      const orderData = {
        title: `Cheque Banking - ${transactionTypes.find(t => t.value === formData.transaction_type)?.label || 'Cheque Deposit'}`,
        bank: formData.bank,
        bank_location: formData.bank_location.trim() || (bankLocation?.name || ''),
        bank_latitude: bankLocation?.latitude,
        bank_longitude: bankLocation?.longitude,
        transaction_type: formData.transaction_type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        transaction_details: formData.transaction_details.trim(),
        scheduled_date: formData.scheduled_date || null,
        order_type_id: formData.order_type_id,
        contact_name: name,
        contact_phone: phone,
        ...(formData.recipient_name && { recipient_name: formData.recipient_name }),
        ...(formData.recipient_account && { recipient_account: formData.recipient_account }),
        // Add client_id if placing order on behalf of a client
        ...(clientId && placeOrderForClient ? { client_id: clientId } : {}),
      };

      // Use bankingService to create banking order
      const response = await bankingService.createBankingOrder(orderData);

      setOrderId(response.id || null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating banking order:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Authentication error. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        setError('Could not connect to the server. Please check your internet connection.');
      } else {
        setError('An error occurred while processing your request.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Success!</h2>
          <p className="text-gray-600 text-center mb-6">
            Your banking request has been submitted successfully.
            <br />
            {orderId && `Order ID: ${orderId}`}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/dashboard');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            {orderId && (
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/orders/${orderId}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="banking-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="banking-container">
      {showSuccessModal && <SuccessModal />}

      <div className="banking-main">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {placeOrderForClient && clientName 
              ? `Place Order for ${clientName}`
              : 'Cheque Banking'}
          </h1>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
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

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Request Banking Service</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type *</label>
                  <select
                    name="order_type_id"
                    value={formData.order_type_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                  <select
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Amount (KES) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      KSh
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md pl-12 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Details *</label>
                  <textarea
                    name="transaction_details"
                    value={formData.transaction_details}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide cheque details (e.g., cheque number, payee name, account to deposit into)"
                    rows="4"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Bank Location Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Location *</label>
                  <MapWithSearch 
                    onLocationSelect={handleBankLocationSelect}
                    placeholder="Search for bank branch location..."
                  />
                  {bankLocation && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Selected: {bankLocation.name}</p>
                          {bankLocation.latitude && bankLocation.longitude && (
                            <p className="text-xs text-blue-600">
                              Coordinates: {bankLocation.latitude.toFixed(4)}, {bankLocation.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {!bankLocation && (
                    <p className="mt-1 text-xs text-gray-500">Please select the bank branch location on the map</p>
                  )}
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Important Notice
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Our assistant will handle your cheque banking needs securely</li>
                    <li>You may need to provide additional verification</li>
                    <li>Service fees may apply based on transaction type</li>
                    <li>Banking hours: Monday - Friday, 9:00 AM - 3:00 PM</li>
                  </ul>
                </div>

                {/* Commission Calculator - Only visible to admins */}
                {isAdmin && formData.amount && parseFloat(formData.amount) > 0 && (
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
                      totalPrice={parseFloat(formData.amount) || 0}
                      taskType="general"
                      taskLocation={bankLocation || { latitude: -1.2921, longitude: 36.8219 }}
                      serviceType="standard"
                      showDetails={true}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full flex justify-center items-center gap-2 px-4 py-3 rounded-md text-white font-medium 
                    ${submitLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 transition-colors'}`}
                  disabled={submitLoading || !bankLocation}
                >
                  {submitLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Create Banking Order
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Banking Services Information</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-2">Available Services</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Cheque deposits</li>
                      <li>Banking transactions</li>
                      <li>Secure handling of banking documents</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h3 className="font-medium text-amber-800 mb-2">Service Hours</h3>
                    <p className="text-gray-600">Banking services are processed during business hours:</p>
                    <p className="text-gray-600 mt-1">Monday to Friday: 9:00 AM - 3:00 PM</p>
                    <p className="text-gray-600">Requests made outside these hours will be processed the next business day.</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-800 mb-2">Security</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>All transactions are handled securely</li>
                      <li>Verification may be required</li>
                      <li>Service fees apply based on transaction type</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banking;
