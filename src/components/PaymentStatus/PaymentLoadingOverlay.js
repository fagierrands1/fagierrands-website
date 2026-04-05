import React, { useState, useEffect } from 'react';
import { usePaymentStatusPolling } from '../../hooks/usePaymentStatusPolling';
import PaymentTimeoutHandler from './PaymentTimeoutHandler';
import './PaymentLoadingOverlay.css';

const PaymentLoadingOverlay = ({ 
  orderId, 
  paymentId, 
  isVisible, 
  onPaymentComplete, 
  onPaymentFailed, 
  onCancel,
  initialMessage = "Processing your payment...",
  showProgressBar = true 
}) => {
  const {
    paymentStatus,
    paymentData,
    isPolling,
    isLoading,
    error,
    processingDuration,
    suggestTimeout,
    timeoutMessage,
    retryPaymentCheck
  } = usePaymentStatusPolling(orderId, 'processing');

  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [progress, setProgress] = useState(0);
  const [showTimeoutHandler, setShowTimeoutHandler] = useState(false);

  // Update progress based on processing duration
  useEffect(() => {
    if (processingDuration > 0) {
      // Progress increases over time, but caps at 90% until completion
      const timeProgress = Math.min((processingDuration / 300) * 90, 90); // 5 minutes = 90%
      setProgress(timeProgress);
    }
  }, [processingDuration]);

  // Update messages based on processing duration
  useEffect(() => {
    if (processingDuration < 10) {
      setCurrentMessage("Initializing payment...");
    } else if (processingDuration < 30) {
      setCurrentMessage("Contacting payment provider...");
    } else if (processingDuration < 60) {
      setCurrentMessage("Processing payment...");
    } else if (processingDuration < 120) {
      setCurrentMessage("Payment is taking longer than usual...");
    } else if (processingDuration < 300) {
      setCurrentMessage("Still processing... This may take a few more minutes.");
    } else {
      setCurrentMessage("Payment is taking unusually long. You may want to check your connection or try again.");
    }
  }, [processingDuration]);

  // Handle payment status changes
  useEffect(() => {
    switch (paymentStatus) {
      case 'paid':
      case 'completed':
        setProgress(100);
        setCurrentMessage("Payment successful!");
        setTimeout(() => {
          onPaymentComplete && onPaymentComplete(paymentData);
        }, 1500);
        break;
      case 'failed':
      case 'cancelled':
        setCurrentMessage("Payment failed or was cancelled.");
        setTimeout(() => {
          onPaymentFailed && onPaymentFailed(paymentStatus, paymentData);
        }, 2000);
        break;
      default:
        break;
    }
  }, [paymentStatus, paymentData, onPaymentComplete, onPaymentFailed]);

  // Show timeout handler if payment is taking too long
  useEffect(() => {
    if (suggestTimeout) {
      setShowTimeoutHandler(true);
    }
  }, [suggestTimeout]);

  const handleTimeoutAction = (action) => {
    setShowTimeoutHandler(false);
    
    switch (action) {
      case 'retry':
        retryPaymentCheck();
        break;
      case 'cancelled':
        onCancel && onCancel();
        break;
      case 'wait_longer':
        // Reset timeout and continue
        break;
      case 'support_contacted':
        // Keep overlay open but show support message
        setCurrentMessage("Support has been contacted. Please wait for assistance.");
        break;
      default:
        break;
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="payment-loading-overlay">
      <div className="payment-loading-backdrop" onClick={onCancel}></div>
      <div className="payment-loading-modal">
        <div className="payment-loading-content">
          {/* Header */}
          <div className="payment-loading-header">
            <h4 className="payment-loading-title">
              <i className="fas fa-credit-card me-2"></i>
              Payment Processing
            </h4>
            {onCancel && (
              <button 
                className="btn-close payment-loading-close"
                onClick={onCancel}
                aria-label="Close"
              ></button>
            )}
          </div>

          {/* Main Content */}
          <div className="payment-loading-body">
            {/* Status Icon */}
            <div className="payment-status-icon">
              {paymentStatus === 'completed' || paymentStatus === 'paid' ? (
                <i className="fas fa-check-circle text-success payment-icon-large"></i>
              ) : paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
                <i className="fas fa-times-circle text-danger payment-icon-large"></i>
              ) : (
                <div className="payment-spinner">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {showProgressBar && paymentStatus !== 'completed' && paymentStatus !== 'paid' && paymentStatus !== 'failed' && (
              <div className="payment-progress-container">
                <div className="progress payment-progress">
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <small className="text-muted">{Math.round(progress)}% complete</small>
              </div>
            )}

            {/* Status Message */}
            <div className="payment-status-message">
              <p className="mb-2">{currentMessage}</p>
              
              {processingDuration > 0 && (
                <small className="text-muted">
                  Processing time: {formatDuration(processingDuration)}
                </small>
              )}
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="payment-details">
                <small className="text-muted">
                  <strong>Amount:</strong> KES {paymentData.amount}
                  {paymentData.payment_method && (
                    <>
                      <br />
                      <strong>Method:</strong> {paymentData.payment_method.toUpperCase()}
                    </>
                  )}
                  {paymentData.transaction_reference && (
                    <>
                      <br />
                      <strong>Reference:</strong> {paymentData.transaction_reference}
                    </>
                  )}
                </small>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mt-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Timeout Warning */}
            {suggestTimeout && !showTimeoutHandler && (
              <div className="alert alert-warning mt-3">
                <i className="fas fa-clock me-2"></i>
                <strong>Taking longer than expected</strong>
                <p className="mb-2">{timeoutMessage}</p>
                <button 
                  className="btn btn-sm btn-outline-warning"
                  onClick={() => setShowTimeoutHandler(true)}
                >
                  View Options
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="payment-loading-footer">
            {paymentStatus === 'processing' || paymentStatus === 'pending' ? (
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Please don't close this window
                </small>
                {processingDuration > 60 && (
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={retryPaymentCheck}
                    disabled={isLoading}
                  >
                    <i className="fas fa-sync me-1"></i>
                    Check Status
                  </button>
                )}
              </div>
            ) : paymentStatus === 'completed' || paymentStatus === 'paid' ? (
              <div className="text-center">
                <button 
                  className="btn btn-success"
                  onClick={() => onPaymentComplete && onPaymentComplete(paymentData)}
                >
                  <i className="fas fa-check me-2"></i>
                  Continue
                </button>
              </div>
            ) : paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
              <div className="text-center">
                <button 
                  className="btn btn-danger me-2"
                  onClick={() => onPaymentFailed && onPaymentFailed(paymentStatus, paymentData)}
                >
                  <i className="fas fa-times me-2"></i>
                  Close
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={retryPaymentCheck}
                >
                  <i className="fas fa-redo me-2"></i>
                  Try Again
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Timeout Handler Modal */}
      {showTimeoutHandler && (
        <PaymentTimeoutHandler
          orderId={orderId}
          paymentId={paymentId}
          onTimeout={handleTimeoutAction}
          onResolved={(status) => {
            setShowTimeoutHandler(false);
            if (status === 'completed' || status === 'paid') {
              onPaymentComplete && onPaymentComplete(paymentData);
            }
          }}
        />
      )}
    </div>
  );
};

export default PaymentLoadingOverlay;