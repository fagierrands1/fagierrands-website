// src/hooks/usePaymentStatusPolling.js
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';

/**
 * Hook for polling payment status updates
 * Automatically checks payment status at intervals until completion
 */
export const usePaymentStatusPolling = (orderId, initialStatus = 'processing') => {
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentData, setPaymentData] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [processingDuration, setProcessingDuration] = useState(0);
  const [suggestTimeout, setSuggestTimeout] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);

  const checkPaymentStatus = async () => {
    if (!orderId) return paymentStatus;

    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(`/api/orders/${orderId}/payment-status/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      
      // Update payment status from the new endpoint structure
      if (data.payment) {
        setPaymentStatus(data.payment.status);
        setPaymentData(data.payment);
        setProcessingDuration(data.payment.processing_duration_seconds || 0);
        setSuggestTimeout(data.payment.suggest_timeout || false);
        setTimeoutMessage(data.payment.timeout_message || '');
      }
      
      if (data.order) {
        setOrderStatus(data.order.status);
      }
      
      setLastChecked(new Date());
      retryCountRef.current = 0; // Reset retry count on success
      
      // Stop polling if payment is complete or failed
      const currentStatus = data.payment?.status;
      if (['paid', 'completed', 'failed', 'cancelled', 'refunded'].includes(currentStatus)) {
        stopPolling();
      }
      
      // Adjust polling interval based on processing duration
      if (currentStatus === 'processing' && data.payment?.processing_duration_seconds > 120) {
        // Slow down polling for long-running payments
        return { status: currentStatus, nextInterval: 10000 }; // 10 seconds
      }
      
      return { status: currentStatus, nextInterval: data.next_check_in_seconds * 1000 || 5000 };
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to check payment status');
      
      // Implement exponential backoff for retries
      retryCountRef.current += 1;
      if (retryCountRef.current >= 5) {
        console.warn('Max retries reached for payment status polling');
        stopPolling();
        setError('Unable to check payment status after multiple attempts. Please refresh the page or contact support.');
      }
      
      return { status: paymentStatus, nextInterval: Math.min(5000 * Math.pow(2, retryCountRef.current), 30000) };
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (intervalMs = 5000) => {
    if (intervalRef.current) return; // Already polling
    
    console.log(`Starting payment status polling for order ${orderId}`);
    setIsPolling(true);
    retryCountRef.current = 0;
    
    // Check immediately, then set dynamic interval
    const pollWithDynamicInterval = async () => {
      const result = await checkPaymentStatus();
      
      if (intervalRef.current && result?.nextInterval) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(pollWithDynamicInterval, result.nextInterval);
      }
    };
    
    pollWithDynamicInterval();
    intervalRef.current = setInterval(pollWithDynamicInterval, intervalMs);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      console.log(`Stopping payment status polling for order ${orderId}`);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const retryPaymentCheck = async () => {
    setError(null);
    retryCountRef.current = 0;
    return await checkPaymentStatus();
  };

  // Auto-start polling for processing payments
  useEffect(() => {
    if (orderId && ['processing', 'pending', 'initiated'].includes(paymentStatus)) {
      startPolling();
    }

    return () => stopPolling();
  }, [orderId, paymentStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  return {
    paymentStatus,
    orderStatus,
    paymentData,
    isPolling,
    isLoading,
    lastChecked,
    error,
    processingDuration,
    suggestTimeout,
    timeoutMessage,
    checkPaymentStatus,
    startPolling,
    stopPolling,
    retryPaymentCheck,
    retryCount: retryCountRef.current
  };
};

/**
 * Hook for manual payment verification
 * Used when user wants to manually check payment status
 */
export const usePaymentVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const verifyPayment = async (orderId, paymentReference) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post('/api/payments/verify/', {
        order_id: orderId,
        payment_reference: paymentReference,
        provider: 'intasend'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVerificationResult(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Payment verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    isVerifying,
    verificationResult,
    error,
    verifyPayment
  };
};

export default usePaymentStatusPolling;