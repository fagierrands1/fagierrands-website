import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaCalculator, FaRoute, FaClock, FaMoneyBillWave, FaShieldAlt, FaPercentage } from 'react-icons/fa';
import * as turf from '@turf/turf';
import { getApiBaseUrl } from '../../utils/environment';
import { 
  isPointInNairobiCBD, 
  getCBDGeofenceStatus, 
  formatGeofenceStatus 
} from '../../utils/nairobiCBDGeofence';
import { calculateCommission } from '../../utils/commissionCalculator';

const PriceCalculator = ({ 
  pickupLocation, 
  deliveryLocation, 
  orderTypeId,
  items = [],
  simplified = false,
  onPriceCalculated
}) => {
  const [price, setPrice] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [distanceMethod, setDistanceMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [breakdown, setBreakdown] = useState({
    basePrice: 0,
    distancePrice: 0,
    itemsPrice: 0
  });
  const [commissionBreakdown, setCommissionBreakdown] = useState({
    companyCommission: 0,
    assistantEarnings: 0,
    companyPercentage: 0,
    assistantPercentage: 0,
    isPickupInCBD: false,
    isDeliveryInCBD: false,
    isBothInCBD: false
  });
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);

  // Calculate price when locations or items change
  useEffect(() => {
    const hasValidLocations = 
      pickupLocation && deliveryLocation && 
      pickupLocation.latitude && pickupLocation.longitude &&
      deliveryLocation.latitude && deliveryLocation.longitude;
    
    // Recalculate whenever locations or items change
    if (hasValidLocations && !loading) {
      calculatePrice();
    } else {
      // Reset if locations are invalid
      setPrice(null);
      setDistance(null);
      setDuration(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pickupLocation?.latitude, 
    pickupLocation?.longitude, 
    deliveryLocation?.latitude, 
    deliveryLocation?.longitude,
    orderTypeId,
    items.length,
    // Include items price/quantity changes
    ...items.map(item => `${item.price || 0}-${item.quantity || 1}`)
  ]);

  // Calculate commission breakdown using the utility function
  const calculateCommissionBreakdown = (totalPrice, pickupLocation, deliveryLocation) => {
    const commission = calculateCommission(totalPrice, pickupLocation, deliveryLocation);
    return commission;
  };

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, calculate distance using OpenStreetMap's OSRM for accurate road distances
      const token = localStorage.getItem('authToken');
      
      // Use the backend's distance calculation endpoint which uses OSRM for accurate road distances
      const distanceResponse = await axios.post(
        `locations/calculate-distance/`,
        {
          start_lat: pickupLocation.latitude,
          start_lng: pickupLocation.longitude,
          end_lat: deliveryLocation.latitude,
          end_lng: deliveryLocation.longitude,
          use_osrm: true // Use OpenStreetMap's OSRM for accurate road distances
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (distanceResponse.data) {
        setDistance(distanceResponse.data.distance);
        setDuration(distanceResponse.data.duration);
        setDistanceMethod(distanceResponse.data.method || 'haversine');

        // Calculate items price
        const itemsPrice = items.reduce((total, item) => {
          return total + (parseFloat(item.price || 0) * parseInt(item.quantity || 1));
        }, 0);

        // Use a dedicated endpoint for price calculation to ensure consistency with backend logic
        try {
          const priceResponse = await axios.post(
            `${getApiBaseUrl()}orders/calculate-price/`,
            {
              distance_km: distanceResponse.data.distance,
              order_type_id: orderTypeId,
              items: items.map(item => ({
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1)
              }))
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (priceResponse.data) {
            // Set price and breakdown from backend response
            const totalPrice = priceResponse.data.total_price;
            setPrice(totalPrice);
            setBreakdown({
              basePrice: priceResponse.data.base_price,
              distancePrice: priceResponse.data.distance_price,
              itemsPrice: priceResponse.data.items_price
            });
            
            // Calculate commission breakdown based on geofencing
            const commissionData = calculateCommissionBreakdown(totalPrice, pickupLocation, deliveryLocation);
            setCommissionBreakdown(commissionData);
            
            // Notify parent component of calculated price
            if (onPriceCalculated) {
              onPriceCalculated({
                totalPrice,
                distance: distanceResponse.data.distance,
                duration: distanceResponse.data.duration,
                breakdown: {
                  basePrice: priceResponse.data.base_price,
                  distancePrice: priceResponse.data.distance_price,
                  itemsPrice: priceResponse.data.items_price
                }
              });
            }
          }
        } catch (priceError) {
          console.log('Price calculation API not available, using frontend calculation');
          
          // Fall back to frontend calculation if the API is not available
          // This ensures the app still works even if the backend endpoint is not implemented yet
          
          // Get order type details for pricing if available
          let basePrice = 250;
          let pricePerKm = 30;

          if (orderTypeId) {
            try {
              // Get all order types and find the one matching the ID
              const orderTypesResponse = await axios.get(
                `orders/types/`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );

              if (orderTypesResponse.data && Array.isArray(orderTypesResponse.data)) {
                const orderType = orderTypesResponse.data.find(type => type.id === orderTypeId);
                if (orderType) {
                  basePrice = parseFloat(orderType.base_price || 250);
                  pricePerKm = parseFloat(orderType.price_per_km || 30);
                }
              }
            } catch (orderTypeError) {
              // Silently use default pricing - this is expected if order type doesn't exist
              // console.log('Order type not found, using default pricing');
            }
          }

          // Calculate distance price using the new pricing model
          const distance = distanceResponse.data.distance;
          const distancePrice = distance <= 5 ? 0 : (distance - 5) * pricePerKm;
          
          // Calculate total price
          const totalPrice = basePrice + distancePrice + itemsPrice;
          
          // Set price and breakdown
          setPrice(totalPrice);
          setBreakdown({
            basePrice,
            distancePrice,
            itemsPrice
          });
          
          // Calculate commission breakdown based on geofencing
          const commissionData = calculateCommissionBreakdown(totalPrice, pickupLocation, deliveryLocation);
          setCommissionBreakdown(commissionData);
          
          // Notify parent component of calculated price
          if (onPriceCalculated) {
            onPriceCalculated({
              totalPrice,
              distance: distanceResponse.data.distance,
              duration: distanceResponse.data.duration,
              breakdown: {
                basePrice,
                distancePrice,
                itemsPrice
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Error calculating price:', err);
      
      // Provide more specific error messages based on the error
      if (err.response && err.response.status === 500) {
        setError('Server error. Our team has been notified. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to calculate price. Please try again.');
      }
      
      // Fall back to a simple calculation if the API fails
      if (pickupLocation && deliveryLocation) {
        try {
          // Calculate straight-line distance using turf.js
          const point1 = turf.point([pickupLocation.longitude, pickupLocation.latitude]);
          const point2 = turf.point([deliveryLocation.longitude, deliveryLocation.latitude]);
          const distance = turf.distance(point1, point2, { units: 'kilometers' });
          
          setDistance(distance);
          setDistanceMethod('turf');
          
          // Calculate duration (assuming 30 km/h average speed)
          const durationMinutes = (distance / 30) * 60;
          setDuration(durationMinutes);
          
          // Calculate price using the new pricing model
          const basePrice = 250;
          const distancePrice = distance <= 5 ? 0 : (distance - 5) * 30;
          
          // Calculate items price
          const itemsPrice = items.reduce((total, item) => {
            return total + (parseFloat(item.price || 0) * parseInt(item.quantity || 1));
          }, 0);
          
          // Set price and breakdown
          const totalPrice = basePrice + distancePrice + itemsPrice;
          setPrice(totalPrice);
          setBreakdown({
            basePrice,
            distancePrice,
            itemsPrice
          });
          
          // Calculate commission breakdown based on geofencing
          const commissionData = calculateCommissionBreakdown(totalPrice, pickupLocation, deliveryLocation);
          setCommissionBreakdown(commissionData);
          
          // Notify parent component of calculated price
          if (onPriceCalculated) {
            onPriceCalculated({
              totalPrice,
              distance,
              duration: durationMinutes,
              breakdown: {
                basePrice,
                distancePrice,
                itemsPrice
              }
            });
          }
          
          // Update error message to indicate we're using a fallback calculation
          setError('Using estimated distance calculation. For more accuracy, please try again later.');
        } catch (fallbackError) {
          console.error('Fallback calculation failed:', fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
          <p>Calculating price...</p>
        </div>
      </div>
    );
  }

  // Only show error as a complete replacement if we don't have a price
  if (error && !price) {
    return (
      <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!price && (!pickupLocation || !deliveryLocation)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <p className="text-yellow-700">
          <FaCalculator className="inline mr-2" />
          Please select pickup and delivery locations to calculate price.
        </p>
      </div>
    );
  }

  // Simplified view for Pickup & Delivery
  if (simplified) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold flex items-center">
            <FaMoneyBillWave className="text-green-600 mr-2" />
            Price Estimate
          </h3>
        </div>
        
        {/* Show warning if we have an error but still have a price (using fallback) */}
        {error && price && (
          <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 mb-3 text-xs text-yellow-700">
            {error}
          </div>
        )}
        
        {distance && (
          <div className="mb-3">
            <div className="flex items-center text-gray-700">
              <FaRoute className="text-blue-500 mr-2" />
              <span className="font-medium">Distance: {distance.toFixed(1)} km</span>
            </div>
          </div>
        )}
        
        {duration && (
          <div className="mb-3 flex items-center text-gray-700">
            <FaClock className="text-purple-500 mr-2" />
            <span className="font-medium">Estimated time: {duration < 60 ? `${Math.round(duration)} minutes` : `${Math.floor(duration/60)} hours ${Math.round(duration % 60)} minutes`}</span>
          </div>
        )}
        
        {price && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Estimated Total:</span>
              <span className="text-green-600 font-bold text-lg">KES {price.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view with all details
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          <FaMoneyBillWave className="text-green-600 mr-2" />
          Price Estimate
        </h3>
      </div>
      
      {/* Show warning if we have an error but still have a price (using fallback) */}
      {error && price && (
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4 text-sm text-yellow-700">
          {error.includes('estimated') ? error : 'Using estimated distance calculation. For more accuracy, please try again later.'}
        </div>
      )}
      
      {distance && (
        <div className="mb-3">
          <div className="text-2xl font-bold text-gray-800 mb-3">
            {distance.toFixed(0)} km
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-3 mt-3">
        {breakdown.itemsPrice > 0 && (
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Items total:</span>
            <span className="font-medium">KES {breakdown.itemsPrice.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-xl mt-3 pt-3 border-t border-gray-200">
          <span>Total:</span>
          <span className="text-green-600">KES {price ? price.toFixed(2) : '0.00'}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;

