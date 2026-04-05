// src/components/Common/UniversalCommissionCalculator.js
import React, { useState, useEffect } from 'react';
import { 
  FaPercentage, 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaTruck, 
  FaBroom, 
  FaWrench,
  FaMapMarkerAlt,
  FaCalculator 
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculateCommissionForTask,
  calculateShoppingCommission,
  calculateServiceCommission,
  calculateMultiStopCommission,
  calculateErrandCommission,
  formatCommissionDisplay 
} from '../../utils/commissionCalculator';

const UniversalCommissionCalculator = ({ 
  totalPrice,
  taskType = 'general', // 'delivery', 'shopping', 'cleaning', 'maintenance', 'multi-stop', 'general'
  taskLocation, // Single location or array of locations
  deliveryLocation = null, // For delivery tasks
  serviceType = null,
  showDetails = true,
  className = "",
  adminOnly = true // Only show to admins by default
}) => {
  const [commissionData, setCommissionData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const { isAdmin } = useAuth();

  // Calculate commission when inputs change
  useEffect(() => {
    if (totalPrice && taskLocation) {
      try {
        let commission;
        
        switch (taskType) {
          case 'shopping':
            commission = calculateShoppingCommission(totalPrice, taskLocation, serviceType);
            break;
          case 'cleaning':
          case 'maintenance':
            commission = calculateServiceCommission(totalPrice, taskLocation, serviceType);
            break;
          case 'multi-stop':
            commission = calculateMultiStopCommission(totalPrice, taskLocation, serviceType);
            break;
          case 'delivery':
            if (deliveryLocation) {
              commission = calculateCommissionForTask(totalPrice, taskLocation, deliveryLocation, serviceType);
            } else {
              setValidationErrors(['Delivery location is required for delivery tasks']);
              return;
            }
            break;
          default:
            commission = calculateErrandCommission(totalPrice, taskLocation, taskType, serviceType);
        }
        
        setCommissionData(commission);
        setValidationErrors([]);
      } catch (error) {
        setValidationErrors([`Error calculating commission: ${error.message}`]);
        setCommissionData(null);
      }
    } else {
      setCommissionData(null);
      setValidationErrors([]);
    }
  }, [totalPrice, taskLocation, deliveryLocation, taskType, serviceType]);

  // Get task type icon and display name
  const getTaskTypeInfo = (type) => {
    const taskTypes = {
      delivery: { icon: FaTruck, name: 'Delivery Service', color: 'text-blue-600' },
      shopping: { icon: FaShoppingCart, name: 'Shopping Service', color: 'text-green-600' },
      cleaning: { icon: FaBroom, name: 'Cleaning Service', color: 'text-purple-600' },
      maintenance: { icon: FaWrench, name: 'Maintenance Service', color: 'text-orange-600' },
      'multi-stop': { icon: FaMapMarkerAlt, name: 'Multi-Stop Service', color: 'text-red-600' },
      general: { icon: FaCalculator, name: 'General Errand', color: 'text-gray-600' }
    };
    
    return taskTypes[type] || taskTypes.general;
  };

  const taskInfo = getTaskTypeInfo(taskType);
  const TaskIcon = taskInfo.icon;

  // Show validation errors
  if (validationErrors.length > 0) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <TaskIcon className="mr-2" />
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

  // Show placeholder when no data
  if (!commissionData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-gray-500">
          <TaskIcon className="mr-2" />
          <span>Commission will be calculated when price and location are provided</span>
        </div>
      </div>
    );
  }

  // Show error if commission calculation failed
  if (commissionData.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <TaskIcon className="mr-2" />
          <span>{commissionData.error}</span>
        </div>
      </div>
    );
  }

  const displayData = formatCommissionDisplay(commissionData);

  // If adminOnly is true and user is not admin, don't render anything
  if (adminOnly && !isAdmin) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-gray-800">
            <TaskIcon className={`mr-2 ${taskInfo.color}`} />
            {taskInfo.name} - Commission
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
        {/* Task Type and Location Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Task Type:</span>
            <span className={`text-sm font-semibold ${taskInfo.color}`}>
              {taskInfo.name}
            </span>
          </div>
          
          {/* Location Status */}
          <div className="text-xs text-gray-600">
            {Array.isArray(taskLocation) ? (
              <div>
                <span className="font-medium">Multiple Locations:</span>
                <span className={`ml-2 ${commissionData.isTaskInCBD ? 'text-green-600' : 'text-orange-600'}`}>
                  {commissionData.isTaskInCBD ? 'All locations in CBD' : 'Some locations outside CBD'}
                </span>
              </div>
            ) : (
              <div>
                <span className="font-medium">Task Location:</span>
                <span className={`ml-2 ${commissionData.isTaskInCBD ? 'text-green-600' : 'text-orange-600'}`}>
                  {commissionData.isTaskInCBD ? 'Within CBD' : 'Outside CBD'}
                </span>
              </div>
            )}
            
            {deliveryLocation && (
              <div className="mt-1">
                <span className="font-medium">Delivery Location:</span>
                <span className="ml-2 text-gray-500">Included in calculation</span>
              </div>
            )}
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
                <span className="text-gray-600">Total Task Value:</span>
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
              <h5 className="text-sm font-semibold text-blue-800 mb-2">Universal Commission Structure</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>CBD Tasks (location(s) in CBD):</span>
                  <span className="font-medium">Company 30% / Assistant 70%</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-CBD Tasks (outside CBD):</span>
                  <span className="font-medium">Company 25% / Assistant 75%</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium/Express Tasks:</span>
                  <span className="font-medium">Company 40% / Assistant 60%</span>
                </div>
              </div>
            </div>
            
            {/* Task-Specific Info */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">Task Type Benefits</h5>
              <div className="text-xs text-gray-700">
                {taskType === 'shopping' && (
                  <p>Shopping tasks: Commission applies to total shopping cost including items and service fee</p>
                )}
                {taskType === 'cleaning' && (
                  <p>Cleaning tasks: Commission based on service location and total cleaning fee</p>
                )}
                {taskType === 'maintenance' && (
                  <p>Maintenance tasks: Commission includes labor and materials cost</p>
                )}
                {taskType === 'delivery' && (
                  <p>Delivery tasks: Commission based on both pickup and delivery locations</p>
                )}
                {taskType === 'multi-stop' && (
                  <p>Multi-stop tasks: Commission determined by whether all stops are in CBD</p>
                )}
                {taskType === 'general' && (
                  <p>General errands: Flexible commission based on task location and complexity</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalCommissionCalculator;