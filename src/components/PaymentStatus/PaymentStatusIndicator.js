import React, { useEffect, useState } from 'react';
import { usePaymentStatusPolling } from '../../hooks/usePaymentStatusPolling';
import './PaymentStatusIndicator.css';

const PaymentStatusIndicator = ({ orderId, onStatusChange, showDetails = true }) => {
  const {
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
    retryPaymentCheck
  } = usePaymentStatusPolling(orderId);

  const [showRetryOption, setShowRetryOption] = useState(false);

  useEffect(() => {
    if (orderId && ['processing', 'pending', 'initiated'].includes(paymentStatus)) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [orderId, paymentStatus]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(paymentStatus, orderStatus);
    }
  }, [paymentStatus, orderStatus, onStatusChange]);

  // Show retry option after 2 minutes of processing
  useEffect(() => {
    if (processingDuration > 120) {
      setShowRetryOption(true);
    }
  }, [processingDuration]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
      case 'pending':
      case 'initiated':
        return (
          <div className="payment-status-spinner">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        );
      case 'paid':
      case 'completed':
        return <i className="fas fa-check-circle text-success"></i>;
      case 'failed':
      case 'cancelled':
        return <i className="fas fa-times-circle text-danger"></i>;
      case 'refunded':
        return <i className="fas fa-undo text-warning"></i>;
      default:
        return <i className="fas fa-clock text-muted"></i>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing':
        return 'Processing Payment...';
      case 'pending':
        return 'Payment Pending';
      case 'initiated':
        return 'Payment Initiated';
      case 'paid':
        return 'Payment Successful';
      case 'completed':
        return 'Payment Completed';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'refunded':
        return 'Payment Refunded';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
      case 'pending':
      case 'initiated':
        return 'primary';
      case 'paid':
      case 'completed':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'danger';
      case 'refunded':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const handleRetryCheck = async () => {
    setShowRetryOption(false);
    await checkPaymentStatus();
  };

  const handleForceRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="payment-status-indicator">
      <div className={`payment-status-main alert alert-${getStatusColor(paymentStatus)} d-flex align-items-center`}>
        <div className="me-2">
          {getStatusIcon(paymentStatus)}
        </div>
        <div className="flex-grow-1">
          <strong>{getStatusText(paymentStatus)}</strong>
          {isLoading && (
            <small className="d-block text-muted">
              <i className="fas fa-sync fa-spin me-1"></i>
              Checking status...
            </small>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="payment-status-details">
          {/* Processing Duration */}
          {['processing', 'pending'].includes(paymentStatus) && processingDuration > 0 && (
            <div className="payment-detail-item">
              <small className="text-muted">
                <i className="fas fa-clock me-1"></i>
                Processing for: {formatDuration(processingDuration)}
              </small>
            </div>
          )}

          {/* Payment Amount */}
          {paymentData?.amount && (
            <div className="payment-detail-item">
              <small className="text-muted">
                <i className="fas fa-money-bill me-1"></i>
                Amount: KES {paymentData.amount}
              </small>
            </div>
          )}

          {/* Payment Method */}
          {paymentData?.payment_method && (
            <div className="payment-detail-item">
              <small className="text-muted">
                <i className="fas fa-credit-card me-1"></i>
                Method: {paymentData.payment_method.toUpperCase()}
              </small>
            </div>
          )}

          {/* Transaction Reference */}
          {paymentData?.transaction_reference && (
            <div className="payment-detail-item">
              <small className="text-muted">
                <i className="fas fa-hashtag me-1"></i>
                Ref: {paymentData.transaction_reference}
              </small>
            </div>
          )}

          {/* Last Checked */}
          {lastChecked && (
            <div className="payment-detail-item">
              <small className="text-muted">
                <i className="fas fa-sync me-1"></i>
                Last checked: {lastChecked.toLocaleTimeString()}
              </small>
            </div>
          )}

          {/* Polling Status */}
          {isPolling && (
            <div className="payment-detail-item">
              <small className="text-success">
                <i className="fas fa-broadcast-tower me-1"></i>
                Auto-checking every few seconds...
              </small>
            </div>
          )}
        </div>
      )}

      {/* Timeout Warning */}
      {suggestTimeout && timeoutMessage && (
        <div className="alert alert-warning mt-2">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Long Processing Time</strong>
          <p className="mb-2">{timeoutMessage}</p>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-warning"
              onClick={handleRetryCheck}
              disabled={isLoading}
            >
              <i className="fas fa-redo me-1"></i>
              Check Again
            </button>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleForceRefresh}
            >
              <i className="fas fa-refresh me-1"></i>
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger mt-2">
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong>Error:</strong> {error}
          <div className="mt-2">
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={handleRetryCheck}
              disabled={isLoading}
            >
              <i className="fas fa-redo me-1"></i>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Manual Retry Option */}
      {showRetryOption && !suggestTimeout && (
        <div className="mt-2">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={handleRetryCheck}
            disabled={isLoading}
          >
            <i className="fas fa-redo me-1"></i>
            Check Payment Status
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusIndicator;