import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const PaymentTimeoutHandler = ({ orderId, paymentId, onTimeout, onResolved }) => {
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);
  const [timeoutOptions, setTimeoutOptions] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);

  useEffect(() => {
    // Set up timeout options
    setTimeoutOptions([
      {
        value: 'retry',
        label: 'Retry Payment Check',
        description: 'Check the payment status again',
        icon: 'fas fa-redo'
      },
      {
        value: 'cancel',
        label: 'Cancel Payment',
        description: 'Cancel this payment and try again',
        icon: 'fas fa-times'
      },
      {
        value: 'contact_support',
        label: 'Contact Support',
        description: 'Get help from our support team',
        icon: 'fas fa-headset'
      },
      {
        value: 'wait_longer',
        label: 'Wait Longer',
        description: 'Continue waiting for payment to process',
        icon: 'fas fa-clock'
      }
    ]);
  }, []);

  const handleTimeoutAction = async () => {
    if (!selectedAction) return;

    setIsHandlingTimeout(true);

    try {
      switch (selectedAction) {
        case 'retry':
          await handleRetryPayment();
          break;
        case 'cancel':
          await handleCancelPayment();
          break;
        case 'contact_support':
          handleContactSupport();
          break;
        case 'wait_longer':
          handleWaitLonger();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling timeout action:', error);
    } finally {
      setIsHandlingTimeout(false);
      setShowTimeoutDialog(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`orders/${orderId}/payment-status/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment && response.data.payment.status !== 'processing') {
        onResolved && onResolved(response.data.payment.status);
      } else {
        // Still processing, but reset the timeout timer
        onTimeout && onTimeout('retry');
      }
    } catch (error) {
      console.error('Error retrying payment check:', error);
    }
  };

  const handleCancelPayment = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (paymentId) {
        await axios.post(`payments/${paymentId}/cancel/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onTimeout && onTimeout('cancelled');
    } catch (error) {
      console.error('Error cancelling payment:', error);
      // Even if cancellation fails, treat it as cancelled on frontend
      onTimeout && onTimeout('cancelled');
    }
  };

  const handleContactSupport = () => {
    // Open support contact options
    const supportMessage = `Hello, I need help with a payment that has been processing for a long time. Order ID: ${orderId}${paymentId ? `, Payment ID: ${paymentId}` : ''}`;
    
    // Try to open WhatsApp if available, otherwise show contact info
    const whatsappUrl = `https://wa.me/254700000000?text=${encodeURIComponent(supportMessage)}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
    
    onTimeout && onTimeout('support_contacted');
  };

  const handleWaitLonger = () => {
    // Reset timeout and continue waiting
    onTimeout && onTimeout('wait_longer');
  };

  if (!showTimeoutDialog) {
    return (
      <button
        className="btn btn-sm btn-outline-warning"
        onClick={() => setShowTimeoutDialog(true)}
      >
        <i className="fas fa-exclamation-triangle me-1"></i>
        Handle Timeout
      </button>
    );
  }

  return (
    <div className="payment-timeout-handler">
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-clock text-warning me-2"></i>
                Payment Taking Too Long
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowTimeoutDialog(false)}
              ></button>
            </div>
            
            <div className="modal-body">
              <p className="mb-4">
                Your payment has been processing for an unusually long time. 
                This sometimes happens due to network issues or high traffic. 
                What would you like to do?
              </p>

              <div className="timeout-options">
                {timeoutOptions.map((option) => (
                  <div key={option.value} className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="timeoutAction"
                      id={option.value}
                      value={option.value}
                      checked={selectedAction === option.value}
                      onChange={(e) => setSelectedAction(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={option.value}>
                      <div className="d-flex align-items-start">
                        <i className={`${option.icon} me-2 mt-1`}></i>
                        <div>
                          <strong>{option.label}</strong>
                          <br />
                          <small className="text-muted">{option.description}</small>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {selectedAction === 'contact_support' && (
                <div className="alert alert-info mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Support Contact:</strong>
                  <br />
                  WhatsApp: +254 700 000 000
                  <br />
                  Email: support@fagierrands.com
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTimeoutDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTimeoutAction}
                disabled={!selectedAction || isHandlingTimeout}
              >
                {isHandlingTimeout ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  'Proceed'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTimeoutHandler;