// src/components/Common/CommissionCalculator.js
import React, { useState, useEffect } from 'react';
import { FaPercentage, FaMoneyBillWave, FaShieldAlt, FaCalculator, FaInfoCircle } from 'react-icons/fa';
import { 
  calculateCommission, 
  formatCommissionDisplay, 
  COMMISSION_RATES,
  validateLocationsForCommission 
} from '../../utils/commissionCalculator';
import { 
  isPointInNairobiCBD, 
  getCBDGeofenceStatus 
} from '../../utils/nairobiCBDGeofence';

const CommissionCalculator = ({ 
  pickupLocation, 
  deliveryLocation, 
  totalPrice,
  serviceType = null,
  showDetails = true,
  className = ""
}) => {
  const [commissionData, setCommissionData] = useState(null);
  const [pickupGeofenceStatus, setPickupGeofenceStatus] = useState(null);
  const [deliveryGeofenceStatus, setDeliveryGeofenceStatus] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Calculate commission when inputs change
  useEffect(() => {
    if (totalPrice && pickupLocation && deliveryLocation) {
      // Validate locations
      const validation = validateLocationsForCommission(pickupLocation, deliveryLocation);
      setValidationErrors(validation.errors);
      
      if (validation.isValid) {
        // Calculate commission
        const commission = calculateCommission(totalPrice, pickupLocation, deliveryLocation, serviceType);
        setCommissionData(commission);
        
        // Get geofence status for both locations
        const pickupStatus = getCBDGeofenceStatus(pickupLocation, 1);
        const deliveryStatus = getCBDGeofenceStatus(deliveryLocation, 1);
        setPickupGeofenceStatus(pickupStatus);
        setDeliveryGeofenceStatus(deliveryStatus);
      } else {
        setCommissionData(null);
        setPickupGeofenceStatus(null);
        setDeliveryGeofenceStatus(null);
      }
    } else {
      setCommissionData(null);
      setPickupGeofenceStatus(null);
      setDeliveryGeofenceStatus(null);
      setValidationErrors([]);
    }
  }, [totalPrice, pickupLocation, deliveryLocation, serviceType]);

  // Show validation errors
  if (validationErrors.length > 0) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <FaInfoCircle className="mr-2" />
          <span className="font-semibold">Commission Calculation Error</span>
        </div>
        <ul className="text-sm text-red-600 list-disc list-inside">
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Show loading state
  if (!commissionData && totalPrice && pickupLocation && deliveryLocation) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-gray-600">Calculating commission...</span>
        </div>
      </div>
    );
  }

  // Show placeholder when no data
  if (!commissionData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-gray-500">
          <FaCalculator className="mr-2" />
          <span>Commission will be calculated when price and locations are available</span>
        </div>
      </div>
    );
  }

  // Show error if commission calculation failed
  if (commissionData.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <FaInfoCircle className="mr-2" />
          <span>{commissionData.error}</span>
        </div>
      </div>
    );
  }

  const displayData = formatCommissionDisplay(commissionData);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-gray-800">
            <FaPercentage className="text-blue-500 mr-2" />
            Commission Breakdown
          </h3>
          {showDetails && (
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showBreakdown ? 'Hide' : 'Show'} Details
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Service Type Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Service Type:</span>
            <span className="text-sm font-semibold text-blue-600">
              {displayData.serviceTypeDisplay}
            </span>
          </div>
          
          {/* Geofence Status */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <FaShieldAlt className={`mr-1 ${commissionData.isPickupInCBD ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={commissionData.isPickupInCBD ? 'text-green-600' : 'text-gray-500'}>
                Pickup {commissionData.isPickupInCBD ? 'in CBD' : 'outside CBD'}
              </span>
            </div>
            <div className="flex items-center">
              <FaShieldAlt className={`mr-1 ${commissionData.isDeliveryInCBD ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={commissionData.isDeliveryInCBD ? 'text-green-600' : 'text-gray-500'}>
                Delivery {commissionData.isDeliveryInCBD ? 'in CBD' : 'outside CBD'}
              </span>
            </div>
          </div>
          
          {/* Benefit Text */}
          <div className={`mt-2 text-sm font-medium ${displayData.benefitColor}`}>
            {displayData.icon} {displayData.benefitText}
          </div>
        </div>

        {/* Commission Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Assistant Earnings</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {displayData.assistantDisplay}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <FaPercentage className="text-red-600 mr-2" />
              <span className="font-semibold text-red-800">Company Commission</span>
            </div>
            <span className="text-lg font-bold text-red-600">
              {displayData.companyDisplay}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showBreakdown && showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Breakdown</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Order Value:</span>
                <span className="font-medium">KES {totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Rate:</span>
                <span className="font-medium">
                  Company {commissionData.companyPercentage}% / Assistant {commissionData.assistantPercentage}%
                </span>
              </div>
              
              <div className="flex justify-between text-red-600">
                <span>Company Commission:</span>
                <span className="font-medium">KES {commissionData.companyCommission.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Assistant Earnings:</span>
                <span className="font-medium">KES {commissionData.assistantEarnings.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Commission Structure Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">Commission Structure</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>CBD Service (both locations in CBD):</span>
                  <span className="font-medium">Company 30% / Assistant 70%</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Service (outside CBD):</span>
                  <span className="font-medium">Company 25% / Assistant 75%</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium Service:</span>
                  <span className="font-medium">Company 40% / Assistant 60%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionCalculator;