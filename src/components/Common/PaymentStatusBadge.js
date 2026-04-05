// src/components/Common/PaymentStatusBadge.js
import React from 'react';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner, 
  FaClock, 
  FaBan,
  FaUndo,
  FaExclamationTriangle 
} from 'react-icons/fa';
import paymentService from '../../services/paymentService';

/**
 * Payment Status Badge Component
 * Displays payment status with appropriate styling and icons
 */
const PaymentStatusBadge = ({ 
  status, 
  amount = null, 
  currency = 'KES', 
  showAmount = false,
  size = 'md',
  className = ''
}) => {
  const statusInfo = paymentService.getPaymentStatusInfo(status);
  
  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Color configurations
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  // Icon mapping
  const iconMap = {
    pending: FaClock,
    processing: FaSpinner,
    paid: FaCheckCircle,
    completed: FaCheckCircle,
    failed: FaTimesCircle,
    cancelled: FaBan,
    refunded: FaUndo,
    default: FaExclamationTriangle
  };

  const IconComponent = iconMap[status] || iconMap.default;
  const isSpinning = status === 'processing';

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-full border font-medium
      ${sizeClasses[size]}
      ${colorClasses[statusInfo.color]}
      ${className}
    `}>
      <IconComponent 
        className={`
          ${iconSizes[size]} 
          ${isSpinning ? 'animate-spin' : ''}
        `} 
      />
      
      <span>{statusInfo.label}</span>
      
      {showAmount && amount && (
        <span className="font-semibold">
          {paymentService.formatAmount(amount, currency)}
        </span>
      )}
    </div>
  );
};

/**
 * Detailed Payment Status Component
 * Shows more information about payment status
 */
export const PaymentStatusDetails = ({ 
  status, 
  amount, 
  currency = 'KES',
  paymentReference,
  transactionId,
  lastUpdated,
  onRetry = null,
  showRetry = false
}) => {
  const statusInfo = paymentService.getPaymentStatusInfo(status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Payment Status</h3>
        <PaymentStatusBadge status={status} size="lg" />
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p>{statusInfo.description}</p>
        
        {amount && (
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-semibold">
              {paymentService.formatAmount(amount, currency)}
            </span>
          </div>
        )}
        
        {paymentReference && (
          <div className="flex justify-between">
            <span>Reference:</span>
            <span className="font-mono text-xs">{paymentReference}</span>
          </div>
        )}
        
        {transactionId && (
          <div className="flex justify-between">
            <span>Transaction ID:</span>
            <span className="font-mono text-xs">{transactionId}</span>
          </div>
        )}
        
        {lastUpdated && (
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{new Date(lastUpdated).toLocaleString()}</span>
          </div>
        )}
      </div>
      
      {showRetry && onRetry && ['failed', 'processing'].includes(status) && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onRetry}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
          >
            {status === 'processing' ? 'Check Status' : 'Retry Payment'}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Payment Status Timeline Component
 * Shows payment status progression
 */
export const PaymentStatusTimeline = ({ statusHistory = [] }) => {
  const timelineSteps = [
    { key: 'initiated', label: 'Payment Initiated', icon: FaClock },
    { key: 'processing', label: 'Processing', icon: FaSpinner },
    { key: 'paid', label: 'Payment Completed', icon: FaCheckCircle }
  ];

  const getStepStatus = (stepKey) => {
    const historyItem = statusHistory.find(item => item.status === stepKey);
    if (historyItem) return 'completed';
    
    // Check if this step should be active based on current status
    const currentStatus = statusHistory[statusHistory.length - 1]?.status;
    if (currentStatus === stepKey) return 'active';
    
    return 'pending';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Progress</h3>
      
      <div className="space-y-4">
        {timelineSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const IconComponent = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2
                ${stepStatus === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                  stepStatus === 'active' ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-400'}
              `}>
                <IconComponent className={`text-sm ${stepStatus === 'active' ? 'animate-spin' : ''}`} />
              </div>
              
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  stepStatus === 'completed' ? 'text-green-700' :
                  stepStatus === 'active' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
                
                {statusHistory.find(item => item.status === step.key) && (
                  <p className="text-xs text-gray-500">
                    {new Date(statusHistory.find(item => item.status === step.key).timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              
              {index < timelineSteps.length - 1 && (
                <div className={`absolute left-4 mt-8 w-0.5 h-4 ${
                  stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentStatusBadge;