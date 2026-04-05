import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Header from '../components/Common/Header';
import { usePaymentStatusPolling, usePaymentVerification } from '../hooks/usePaymentStatusPolling';
import paymentService from '../services/paymentService';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying payment status...');
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use payment status polling hook
  const { 
    paymentStatus, 
    orderStatus, 
    isPolling, 
    lastChecked, 
    error: pollingError,
    checkPaymentStatus,
    startPolling,
    stopPolling 
  } = usePaymentStatusPolling(orderId);

  // Use payment verification hook
  const { 
    isVerifying, 
    verificationResult, 
    error: verificationError, 
    verifyPayment 
  } = usePaymentVerification();

  // Handle manual retry
  const handleRetry = async () => {
    if (!orderId || !paymentReference) return;
    
    setRetryCount(prev => prev + 1);
    setStatus('processing');
    setMessage('Retrying payment verification...');
    
    try {
      await verifyPayment(orderId, paymentReference);
      startPolling(); // Restart polling after manual verification
    } catch (error) {
      setStatus('failed');
      setMessage('Retry failed. Please contact support if the issue persists.');
    }
  };

  // Initial payment verification
  useEffect(() => {
    const verifyInitialPayment = async () => {
      try {
        // Get query parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const txRef = urlParams.get('tx_ref');
        const flwStatus = urlParams.get('status');
        const transactionId = urlParams.get('transaction_id');
        const orderIdParam = urlParams.get('order_id');
        
        if (!txRef) {
          setStatus('failed');
          setMessage('Invalid payment reference. Please try again.');
          return;
        }
        
        setPaymentReference(txRef);
        if (orderIdParam) setOrderId(orderIdParam);
        
        // Enhanced verification with payment service
        const verificationData = {
          tx_ref: txRef,
          status: flwStatus,
          transaction_id: transactionId,
          provider: 'intasend'
        };
        
        const result = await paymentService.verifyPayment(verificationData);
        
        if (result.success) {
          setOrderId(result.order_id);
          setStatus('success');
          setMessage('Payment completed successfully!');
          
          // Update order status immediately
          try {
            await paymentService.updatePaymentStatus(result.order_id, {
              payment_status: 'paid',
              order_status: 'confirmed',
              payment_reference: txRef,
              transaction_id: transactionId
            });
          } catch (updateError) {
            console.warn('Failed to update order status immediately:', updateError);
          }
          
          // Redirect after delay
          setTimeout(() => {
            navigate(`/orders/${result.order_id}`);
          }, 3000);
        } else {
          // Payment is still processing - start polling
          setOrderId(result.order_id || orderIdParam);
          setStatus('processing');
          setMessage('Payment is being processed. Please wait...');
          
          if (result.order_id || orderIdParam) {
            startPolling();
          }
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('failed');
        setMessage(err.message || 'Failed to verify payment. Please try again.');
        setError(err);
      }
    };
    
    verifyInitialPayment();
  }, [navigate, startPolling]);

  // Update UI based on polling results
  useEffect(() => {
    if (paymentStatus === 'paid' || paymentStatus === 'completed') {
      setStatus('success');
      setMessage('Payment completed successfully!');
      stopPolling();
      
      // Auto-redirect on success
      setTimeout(() => {
        navigate(`/orders/${orderId}`);
      }, 2000);
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
      setMessage('Payment failed. Please try again.');
      stopPolling();
    } else if (paymentStatus === 'cancelled') {
      setStatus('failed');
      setMessage('Payment was cancelled.');
      stopPolling();
    }
  }, [paymentStatus, orderId, navigate, stopPolling]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            {status === 'processing' && (
              <>
                <div className="flex justify-center mb-4">
                  <FaSpinner className="text-blue-500 text-5xl animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                
                {isPolling && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <p className="text-sm text-blue-700 flex items-center">
                      <FaSync className="animate-spin mr-2" />
                      Checking payment status automatically...
                    </p>
                    {lastChecked && (
                      <p className="text-xs text-blue-600 mt-1">
                        Last checked: {lastChecked.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mb-4">
                  Please wait while we verify your payment with IntaSend...
                </p>
                
                {retryCount < 3 && orderId && (
                  <button
                    onClick={handleRetry}
                    disabled={isVerifying}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                  >
                    {isVerifying ? 'Checking...' : 'Check Status Now'}
                  </button>
                )}
                
                {pollingError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <FaExclamationTriangle className="mr-2" />
                      {pollingError}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <FaCheckCircle className="text-green-500 text-5xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500 mb-6">You will be redirected to your order page shortly.</p>
                
                <Link 
                  to={orderId ? `/orders/${orderId}` : '/orders'}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition duration-200 inline-block"
                >
                  View Order
                </Link>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <div className="flex justify-center mb-4">
                  <FaTimesCircle className="text-red-500 text-5xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                    <p className="text-sm text-red-600">Error details: {error.message}</p>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/payment"
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
                  >
                    Try Again
                  </Link>
                  
                  <Link 
                    to="/orders"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Return to Orders
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
