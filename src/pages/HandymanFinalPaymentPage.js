import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FaMoneyBillWave, FaCreditCard, FaMobile, FaLock, FaExclamationTriangle, FaTools, FaCheckCircle } from 'react-icons/fa';
import config from '../config';
import Header from '../components/Common/Header';

const API_BASE_URL = config.API_BASE_URL;

const HandymanFinalPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch handyman order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        if (!orderId) {
          setError('Order ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/orders/handyman/orders/${orderId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrder(response.data);
        
        // Pre-fill phone number and email from user data if available
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.phone_number) {
          setPhoneNumber(userData.phone_number);
        }
        if (userData.email) {
          setEmail(userData.email);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      setPhoneNumber(value);
    } else if (name === 'email') {
      setEmail(value);
    }
  };

  // Process final payment for home-maintenance service
  const processFinalPayment = async (e) => {
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
      
      // Process the final payment for home-maintenance service
      const response = await axios.post(
        `/orders/handyman/orders/${orderId}/final-payment/`, 
        {
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          email: email
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Handle the response based on payment method
      if (paymentMethod === 'mpesa') {
        // Show a message to check phone for STK push
        setPaymentSuccess(true);
        alert('Please check your phone for the M-Pesa payment prompt and enter your PIN to complete the payment.');
      } else if (paymentMethod === 'card') {
        // Redirect to IntaSend payment page
        const paymentLink = response.data.checkout_url;
        setPaymentLink(paymentLink);
        
        // Open the payment link in a new window
        window.open(paymentLink, '_blank');
      }
      
      setProcessingPayment(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.error || 'Failed to process payment. Please try again.');
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
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-700">Loading payment information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
            <div className="text-center">
              <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <Link to="/orders" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
            <div className="text-center">
              <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-500 mb-2">Payment Initiated</h2>
              <p className="text-gray-700 mb-4">
                Your payment has been initiated. Please check your phone or email to complete the payment.
              </p>
              <Link to="/orders" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
            <div className="text-center">
              <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-500 mb-2">Order Not Found</h2>
              <p className="text-gray-700 mb-4">The requested order could not be found.</p>
              <Link to="/orders" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FaTools className="text-blue-500 text-2xl mr-3" />
                <h1 className="text-2xl font-bold">Final Payment for home-maintenance service</h1>
              </div>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-semibold mb-2">Order Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-1">Service Type</p>
                    <p className="font-medium">{order.service_type_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Order ID</p>
                    <p className="font-medium">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Status</p>
                    <p className="font-medium capitalize">{order.status.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Service Address</p>
                    <p className="font-medium">{order.address}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-semibold mb-2">Payment Summary</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Facilitation Fee (Already Paid)</span>
                    <span className="font-medium">{formatCurrency(order.facilitation_fee)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Service Quote</span>
                    <span className="font-medium">{formatCurrency(order.service_quote)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Approved Service Price</span>
                    <span className="font-medium">{formatCurrency(order.approved_service_price)}</span>
                  </div>
                  <div className="border-t border-gray-300 my-2 pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Amount Due Now</span>
                      <span className="text-green-600">{formatCurrency(order.approved_service_price)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      You are only paying for the approved service price. The facilitation fee was already paid upfront.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => setPaymentMethod('mpesa')}
                  >
                    <div className="flex items-center">
                      <FaMobile className="text-green-500 mr-2 text-xl" />
                      <span className="font-medium">M-Pesa</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-9">Pay using M-Pesa mobile money</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center">
                      <FaCreditCard className="text-blue-500 mr-2 text-xl" />
                      <span className="font-medium">Card Payment</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-9">Pay using credit or debit card</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={processFinalPayment}>
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
                        placeholder="e.g., 0712345678"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter your phone number in the format 07XXXXXXXX or 254XXXXXXXXX</p>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'card' && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Card Payment Details</h2>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">You'll receive payment confirmation at this email</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                    <div className="flex">
                      <FaExclamationTriangle className="flex-shrink-0 mr-3" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <Link to={`/orders/${order.id}`} className="w-full md:w-auto mb-4 md:mb-0 text-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Back to Order
                  </Link>
                  
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaLock className="mr-2" />
                        Pay {formatCurrency(order.approved_service_price)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaLock className="text-green-500 mr-2" />
              Secure Payment
            </h2>
            <p className="text-gray-600 mb-4">
              All payments are processed securely through IntaSend, a trusted payment provider. Your payment information is encrypted and never stored on our servers.
            </p>
            <div className="text-sm text-gray-500">
              <p>• You are only paying for the approved service price ({formatCurrency(order.approved_service_price)})</p>
              <p>• The facilitation fee ({formatCurrency(order.facilitation_fee)}) was already paid upfront</p>
              <p>• For any payment issues, please contact our support team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandymanFinalPaymentPage;
