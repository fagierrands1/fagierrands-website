// src/utils/commissionCalculator.js
import { isPointInNairobiCBD } from './nairobiCBDGeofence';

/**
 * Commission Calculator Utility
 * Calculates commission breakdown based on geofencing and service type
 */

// Commission rates configuration
export const COMMISSION_RATES = {
  CBD_SERVICE: {
    COMPANY_PERCENTAGE: 30,
    ASSISTANT_PERCENTAGE: 70,
    DESCRIPTION: 'CBD Service (both pickup and delivery within Nairobi CBD)'
  },
  STANDARD_SERVICE: {
    COMPANY_PERCENTAGE: 25,
    ASSISTANT_PERCENTAGE: 75,
    DESCRIPTION: 'Standard Service (at least one location outside CBD)'
  },
  PREMIUM_SERVICE: {
    COMPANY_PERCENTAGE: 40,
    ASSISTANT_PERCENTAGE: 60,
    DESCRIPTION: 'Premium Service (special handling or urgent delivery)'
  }
};

/**
 * Determine service type based on pickup and delivery locations
 * @param {object} pickupLocation - {latitude, longitude}
 * @param {object} deliveryLocation - {latitude, longitude}
 * @param {string} serviceType - Optional service type override ('premium', 'express', etc.)
 * @returns {string} Service type key
 */
export const determineServiceType = (pickupLocation, deliveryLocation, serviceType = null) => {
  // Check for premium service override
  if (serviceType === 'premium' || serviceType === 'express') {
    return 'PREMIUM_SERVICE';
  }
  
  // Check if both locations are in CBD
  const isPickupInCBD = isPointInNairobiCBD(pickupLocation);
  const isDeliveryInCBD = isPointInNairobiCBD(deliveryLocation);
  
  if (isPickupInCBD && isDeliveryInCBD) {
    return 'CBD_SERVICE';
  }
  
  return 'STANDARD_SERVICE';
};

/**
 * Calculate commission breakdown for any type of task
 * @param {number} totalPrice - Total task price
 * @param {object|array} taskLocation - Single location {lat, lng} or array of locations for multi-point tasks
 * @param {object} deliveryLocation - Optional delivery location for pickup/delivery tasks
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateCommissionForTask = (totalPrice, taskLocation, deliveryLocation = null, serviceType = null) => {
  if (!totalPrice || !taskLocation) {
    return {
      error: 'Invalid parameters provided',
      companyCommission: 0,
      assistantEarnings: 0,
      companyPercentage: 0,
      assistantPercentage: 0
    };
  }

  try {
    let serviceTypeKey;
    let isTaskInCBD = false;
    let taskLocations = [];

    // Handle different task location formats
    if (Array.isArray(taskLocation)) {
      // Multiple locations (e.g., shopping with multiple stores, multi-stop delivery)
      taskLocations = taskLocation;
      isTaskInCBD = taskLocation.every(loc => isPointInNairobiCBD(loc));
    } else if (deliveryLocation) {
      // Pickup and delivery task
      taskLocations = [taskLocation, deliveryLocation];
      isTaskInCBD = isPointInNairobiCBD(taskLocation) && isPointInNairobiCBD(deliveryLocation);
    } else {
      // Single location task (e.g., shopping at one store, cleaning, maintenance)
      taskLocations = [taskLocation];
      isTaskInCBD = isPointInNairobiCBD(taskLocation);
    }

    // Determine service type based on locations and task type
    if (serviceType === 'premium' || serviceType === 'express') {
      serviceTypeKey = 'PREMIUM_SERVICE';
    } else if (isTaskInCBD) {
      serviceTypeKey = 'CBD_SERVICE';
    } else {
      serviceTypeKey = 'STANDARD_SERVICE';
    }

    const rates = COMMISSION_RATES[serviceTypeKey];
    const companyCommission = (totalPrice * rates.COMPANY_PERCENTAGE) / 100;
    const assistantEarnings = (totalPrice * rates.ASSISTANT_PERCENTAGE) / 100;

    return {
      companyCommission,
      assistantEarnings,
      companyPercentage: rates.COMPANY_PERCENTAGE,
      assistantPercentage: rates.ASSISTANT_PERCENTAGE,
      serviceType: serviceTypeKey,
      serviceDescription: rates.DESCRIPTION,
      isTaskInCBD,
      taskLocations,
      totalPrice,
      breakdown: {
        company: {
          amount: companyCommission,
          percentage: rates.COMPANY_PERCENTAGE
        },
        assistant: {
          amount: assistantEarnings,
          percentage: rates.ASSISTANT_PERCENTAGE
        }
      }
    };
  } catch (error) {
    console.error('Error calculating commission:', error);
    return {
      error: 'Error calculating commission',
      companyCommission: 0,
      assistantEarnings: 0,
      companyPercentage: 0,
      assistantPercentage: 0
    };
  }
};

/**
 * Calculate commission breakdown for pickup/delivery tasks (backward compatibility)
 * @param {number} totalPrice - Total order price
 * @param {object} pickupLocation - {latitude, longitude}
 * @param {object} deliveryLocation - {latitude, longitude}
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateCommission = (totalPrice, pickupLocation, deliveryLocation, serviceType = null) => {
  // Use the new flexible function for backward compatibility
  return calculateCommissionForTask(totalPrice, pickupLocation, deliveryLocation, serviceType);
};

/**
 * Calculate commission for multiple orders (batch calculation)
 * @param {array} orders - Array of order objects with totalPrice, pickupLocation, deliveryLocation
 * @returns {object} Aggregated commission data
 */
export const calculateBatchCommission = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalCompanyCommission: 0,
      totalAssistantEarnings: 0,
      averageCommissionRate: 0,
      serviceTypeBreakdown: {}
    };
  }
  
  let totalRevenue = 0;
  let totalCompanyCommission = 0;
  let totalAssistantEarnings = 0;
  const serviceTypeBreakdown = {};
  
  orders.forEach(order => {
    const commission = calculateCommission(
      order.totalPrice,
      order.pickupLocation,
      order.deliveryLocation,
      order.serviceType
    );
    
    if (!commission.error) {
      totalRevenue += order.totalPrice;
      totalCompanyCommission += commission.companyCommission;
      totalAssistantEarnings += commission.assistantEarnings;
      
      // Track service type breakdown
      const serviceType = commission.serviceType;
      if (!serviceTypeBreakdown[serviceType]) {
        serviceTypeBreakdown[serviceType] = {
          count: 0,
          revenue: 0,
          companyCommission: 0,
          assistantEarnings: 0
        };
      }
      
      serviceTypeBreakdown[serviceType].count++;
      serviceTypeBreakdown[serviceType].revenue += order.totalPrice;
      serviceTypeBreakdown[serviceType].companyCommission += commission.companyCommission;
      serviceTypeBreakdown[serviceType].assistantEarnings += commission.assistantEarnings;
    }
  });
  
  const averageCommissionRate = totalRevenue > 0 ? (totalCompanyCommission / totalRevenue) * 100 : 0;
  
  return {
    totalOrders: orders.length,
    totalRevenue,
    totalCompanyCommission,
    totalAssistantEarnings,
    averageCommissionRate,
    serviceTypeBreakdown
  };
};

/**
 * Get commission rate for a specific service type
 * @param {string} serviceType - Service type key
 * @returns {object} Commission rates
 */
export const getCommissionRates = (serviceType = 'STANDARD_SERVICE') => {
  return COMMISSION_RATES[serviceType] || COMMISSION_RATES.STANDARD_SERVICE;
};

/**
 * Format commission data for display
 * @param {object} commissionData - Commission data from calculateCommission
 * @returns {object} Formatted display data
 */
export const formatCommissionDisplay = (commissionData) => {
  if (commissionData.error) {
    return {
      error: commissionData.error,
      displayText: 'Error calculating commission'
    };
  }
  
  const {
    companyCommission,
    assistantEarnings,
    companyPercentage,
    assistantPercentage,
    serviceDescription,
    isBothInCBD
  } = commissionData;
  
  return {
    companyDisplay: `KES ${companyCommission.toFixed(2)} (${companyPercentage}%)`,
    assistantDisplay: `KES ${assistantEarnings.toFixed(2)} (${assistantPercentage}%)`,
    serviceTypeDisplay: serviceDescription,
    benefitText: isBothInCBD 
      ? 'Enhanced earnings for CBD service!' 
      : 'Standard commission rates apply',
    benefitColor: isBothInCBD ? 'text-green-600' : 'text-gray-600',
    icon: isBothInCBD ? '🎯' : '📍'
  };
};

/**
 * Validate locations for commission calculation
 * @param {object} pickupLocation - Pickup location
 * @param {object} deliveryLocation - Delivery location
 * @returns {object} Validation result
 */
export const validateLocationsForCommission = (pickupLocation, deliveryLocation) => {
  const errors = [];
  
  if (!pickupLocation) {
    errors.push('Pickup location is required');
  } else if (!pickupLocation.latitude || !pickupLocation.longitude) {
    errors.push('Pickup location must have valid coordinates');
  }
  
  if (!deliveryLocation) {
    errors.push('Delivery location is required');
  } else if (!deliveryLocation.latitude || !deliveryLocation.longitude) {
    errors.push('Delivery location must have valid coordinates');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate commission for shopping tasks
 * @param {number} totalPrice - Total shopping cost
 * @param {object|array} storeLocation - Single store or array of stores
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateShoppingCommission = (totalPrice, storeLocation, serviceType = null) => {
  return calculateCommissionForTask(totalPrice, storeLocation, null, serviceType);
};

/**
 * Calculate commission for cleaning/maintenance tasks
 * @param {number} totalPrice - Total service cost
 * @param {object} serviceLocation - Location where service is performed
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateServiceCommission = (totalPrice, serviceLocation, serviceType = null) => {
  return calculateCommissionForTask(totalPrice, serviceLocation, null, serviceType);
};

/**
 * Calculate commission for multi-stop tasks
 * @param {number} totalPrice - Total task cost
 * @param {array} locations - Array of locations to visit
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateMultiStopCommission = (totalPrice, locations, serviceType = null) => {
  return calculateCommissionForTask(totalPrice, locations, null, serviceType);
};

/**
 * Calculate commission for any errand task
 * @param {number} totalPrice - Total task cost
 * @param {object|array} taskLocation - Task location(s)
 * @param {string} taskType - Type of task ('shopping', 'cleaning', 'delivery', 'maintenance', etc.)
 * @param {string} serviceType - Optional service type
 * @returns {object} Commission breakdown
 */
export const calculateErrandCommission = (totalPrice, taskLocation, taskType = 'general', serviceType = null) => {
  // Map task types to service types if needed
  let mappedServiceType = serviceType;
  
  if (taskType === 'express' || taskType === 'urgent') {
    mappedServiceType = 'premium';
  }
  
  return calculateCommissionForTask(totalPrice, taskLocation, null, mappedServiceType);
};

export default {
  COMMISSION_RATES,
  calculateCommission,
  calculateCommissionForTask,
  calculateShoppingCommission,
  calculateServiceCommission,
  calculateMultiStopCommission,
  calculateErrandCommission,
  calculateBatchCommission,
  determineServiceType,
  getCommissionRates,
  formatCommissionDisplay,
  validateLocationsForCommission
};