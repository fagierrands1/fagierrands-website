import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FaMoneyBillWave, FaCreditCard, FaMobile, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const PaymentPage = () => {
  const { paymentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract orderId from URL query parameters if available
  const queryParams = new URLSearchParams(location.search);
  const orderIdFromQuery = queryParams.get('orderId');
  
  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);

  // Fetch payment details or order details based on what's available
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        // If we have a payment ID, fetch the payment details
        if (paymentId) {
          try {
            const paymentResponse = await axios.get(`orders/payments/${paymentId}/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            setPayment(paymentResponse.data);
            
            // Fetch the order details
            const orderResponse = await axios.get(`orders/${paymentResponse.data.order}/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            setOrder(orderResponse.data);
          } catch (paymentError) {
            console.error('Error fetching payment:', paymentError);
            
            // If payment not found but we have an orderId in the URL, treat as a new payment
            if (orderIdFromQuery) {
              const orderResponse = await axios.get(`orders/${orderIdFromQuery}/`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              setOrder(orderResponse.data);
            } else {
              setError('Payment not found. Please try again.');
            }
          }
        } 
        // If we have an order ID from query parameters, fetch order details
        else if (orderIdFromQuery) {
          const orderResponse = await axios.get(`orders/${orderIdFromQuery}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setOrder(orderResponse.data);
        } else {
          setError('No payment or order ID provided.');
        }
        
        // Pre-fill user details
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setPhoneNumber(userInfo.phone_number || '');
        setEmail(userInfo.email || '');
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [paymentId, orderIdFromQuery]);

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      setPhoneNumber(value);
    } else if (name === 'email') {
      setEmail(value);
    }
  };

  // Process payment
  const processPayment = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      setError('Please enter your phone number for M-Pesa payment');
      return;
    }
    
    if (paymentMethod === 'card' && !email) {
      setError('Please enter your email for card payment');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      // If we don't have a payment yet, initiate one
      if (!payment) {
        // Get the order ID from the state or URL
        const orderId = order?.id || orderIdFromQuery;
        
        if (!orderId) {
          setError('Order ID is missing. Please try again.');
          setProcessingPayment(false);
          return;
        }
        
        // Initiate payment
        const paymentData = {
          order: orderId,
          payment_method: paymentMethod
        };
        
        // Add payment method specific fields
        if (paymentMethod === 'mpesa') {
          paymentData.phone_number = phoneNumber;
        } else if (paymentMethod === 'card') {
          paymentData.email = email;
        }
        
        const initiateResponse = await axios.post(`orders/payments/initiate/`, paymentData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Redirect to the payment page with the payment ID
        navigate(`/payment/${initiateResponse.data.payment_id}`);
        return;
      }
      
      // Process the payment with IntaSend
      const processResponse = await axios.post(`orders/payments/${payment.id}/process/`, {
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle the response based on payment method
      if (paymentMethod === 'mpesa') {
        // Show a message to check phone for STK push
        alert('Please check your phone for the M-Pesa payment prompt and enter your PIN to complete the payment.');
      } else if (paymentMethod === 'card') {
        // Redirect to IntaSend payment page
        const paymentLink = processResponse.data.data.payment_link;
        setPaymentLink(paymentLink);
        
        // Open the payment link in a new window
        window.open(paymentLink, '_blank');
      }
      
      setProcessingPayment(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaMoneyBillWave className="text-green-500 mr-2" />
              Payment
            </h1>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
                <FaExclamationTriangle className="mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {paymentLink && (
              <div className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
                <p className="font-medium">Payment link opened in a new window. If it didn't open, please click the button below:</p>
                <a 
                  href={paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
                >
                  Open Payment Page
                </a>
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {order ? (
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Order ID:</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Title:</p>
                      <p className="font-medium">{order.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status:</p>
                      <p className="font-medium">{order.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Amount Due:</p>
                      <p className="font-medium text-lg text-green-600">{formatCurrency(order.price || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No order information available.</p>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition duration-200 ${
                    paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                  }`}
                  onClick={() => handlePaymentMethodChange('mpesa')}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-3">
                      {paymentMethod === 'mpesa' && (
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <FaMobile className="text-green-500 mr-2 text-xl" />
                      <span className="font-medium">M-Pesa</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-9">Pay using M-Pesa mobile money</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition duration-200 ${
                    paymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                  }`}
                  onClick={() => handlePaymentMethodChange('card')}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-3">
                      {paymentMethod === 'card' && (
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <FaCreditCard className="text-blue-500 mr-2 text-xl" />
                      <span className="font-medium">Card Payment</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-9">Pay using credit or debit card</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={processPayment}>
              {paymentMethod === 'mpesa' && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">M-Pesa Details</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="phoneNumber" className="block text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 254712345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">Enter your M-Pesa registered phone number starting with country code (e.g. 254)</p>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'card' && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Card Details</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">You'll be redirected to a secure payment page to enter your card details</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-8">
                <Link 
                  to={order ? `/orders/${order.id}` : '/orders'}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Cancel and return to order
                </Link>
                
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium flex items-center transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processingPayment || !order}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaLock className="mr-2" />
                      Pay {order ? formatCurrency(order.price || 0) : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center text-gray-600 mb-4">
                <FaLock className="text-green-500 mr-2" />
                <p className="text-sm">All payments are secure and encrypted.</p>
              </div>
              
              <p className="text-xs text-gray-500">
                By making a payment, you agree to Fagi Errands' terms and conditions. 
                Your payment information is processed securely by IntaSend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
