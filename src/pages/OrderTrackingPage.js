import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Header from '../components/Common/Header';
import GoogleMapComponent from '../components/Common/GoogleMapComponent';
import PriceCalculator from '../components/Common/PriceCalculator';
import { FaMapMarkerAlt, FaExclamationTriangle, FaTruck, FaFlag, FaMoneyBillWave } from 'react-icons/fa';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrderTracking } from '../hooks/useOrderTracking';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    trackingData, 
    locationHistory, 
    loading: trackingLoading, 
    updateTrackingLocation,
    addTrackingEvent,
    initializeTracking,
    startTracking,
    stopTracking,
    getTrackingStatus
  } = useOrderTracking(id);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [userRole, setUserRole] = useState('client'); // Added userRole state
  const { connected, orderLocations, waypoints, connectToOrder } = useWebSocket();

  // Function to fetch rider location and waypoints - now uses tracking hook data
  const fetchRiderLocation = useCallback(async () => {
    try {
      // Check if we have valid coordinates from tracking data
      if (trackingData && trackingData.current_latitude && trackingData.current_longitude) {
        // Validate coordinates before setting state
        const latitude = parseFloat(trackingData.current_latitude);
        const longitude = parseFloat(trackingData.current_longitude);
        
        if (!isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
          // Set rider location with validated data
          setRiderLocation({
            latitude: latitude,
            longitude: longitude,
            estimatedArrival: trackingData.estimated_arrival_time,
            waypoints: (trackingData.waypoints || []).map(wp => ({
              ...wp,
              latitude: parseFloat(wp.latitude),
              longitude: parseFloat(wp.longitude)
            })),
            events: trackingData.events || [],
            locationHistory: locationHistory || []
          });
          console.log('Rider location updated from tracking data:', {
            latitude,
            longitude,
            trackingId: trackingData.id
          });
          return; // Exit early since we have valid data
        }
      }
      
      // If no tracking data or invalid coordinates, check if order has pickup location as fallback
      if (order && order.pickup_latitude && order.pickup_longitude) {
        const pickupLat = parseFloat(order.pickup_latitude);
        const pickupLng = parseFloat(order.pickup_longitude);
        
        if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
          console.log('Using order pickup location as fallback for tracking display');
          setRiderLocation({
            latitude: pickupLat,
            longitude: pickupLng,
            estimatedArrival: null,
            waypoints: [],
            events: [],
            locationHistory: [],
            isFallback: true
          });
          return;
        }
      }
      
      // If we get here, we don't have any valid coordinates
      console.log('No valid coordinates available for tracking display');
      setRiderLocation(null);
    } catch (err) {
      console.error('Error processing tracking data:', err);
      setRiderLocation(null);
    }
  }, [trackingData, locationHistory, order]);

  // Function to update tracking location from assistant's current location
  const updateTrackingFromAssistantLocation = useCallback(async () => {
    if (!order || !order.assistant || !order.assistant.id) return;
    
    // Only allow tracking updates if the current user is the assigned assistant
    // Handlers can view tracking but not update it
    if (!user || user.user_type !== 'assistant' || user.id !== order.assistant.id) {
      console.log('Tracking updates only allowed for assigned assistant');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      // Get assistant's current location
      const assistantLocationResponse = await axios.get(
        `locations/current/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (assistantLocationResponse.data && 
          assistantLocationResponse.data.latitude && 
          assistantLocationResponse.data.longitude) {
        
        // Update the order tracking with assistant's location
        const trackingUpdateResponse = await axios.patch(
          `orders/${id}/tracking/`,
          {
            current_latitude: assistantLocationResponse.data.latitude,
            current_longitude: assistantLocationResponse.data.longitude
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Updated tracking location from assistant location');
        
        // Refresh tracking data
        fetchRiderLocation();
      }
    } catch (error) {
      console.log('Could not update tracking from assistant location:', error.message);
    }
  }, [order, id, API_BASE_URL, fetchRiderLocation, user]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('OrderTrackingPage - Fetching order details for ID:', id);
        
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        const response = await axios.get(`orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('OrderTrackingPage - Response received:', response.data);
        setOrder(response.data);

        // Get user role from local storage or API
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setUserRole(userInfo.user_type || userInfo.role || 'client');

        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id, API_BASE_URL]);

  // Function to update price based on pickup and delivery locations
  const updatePriceRealtime = useCallback(async () => {
    if (!id || !order || (order.status !== 'in_progress' && order.status !== 'assigned')) return;
    
    // Only allow price updates for assistants, handlers, or admins
    if (!user || (user.user_type !== 'assistant' && user.user_type !== 'handler' && user.user_type !== 'admin')) {
      console.log('Price updates not available for user type:', user?.user_type || 'unknown');
      return;
    }
    
    // For assistants, only allow if they are assigned to this order
    if (user.user_type === 'assistant' && (!order.assistant || order.assistant.id !== user.id)) {
      console.log('Price updates only available for assigned assistant');
      return;
    }
    
    try {
      // Import the service function
      const { updateOrderPriceRealtime } = await import('../services/orders');
      
      // Call the API to update the price
      const result = await updateOrderPriceRealtime(id);
      
      if (result && result.new_price) {
        // Update the order with the new price
        setOrder(prev => ({
          ...prev,
          price: result.new_price
        }));
        
        console.log('Order price updated based on pickup/delivery distance:', result.new_price);
      }
    } catch (err) {
      // Handle different types of errors gracefully
      if (err.detail && err.detail.includes('permission')) {
        console.log('Price update not available for this user role');
      } else if (err.message && err.message.includes('403')) {
        console.log('Price update not available for this user role');
      } else {
        console.error('Error updating price:', err);
      }
    }
  }, [id, order, user]);

  // Connect to WebSocket for real-time tracking
  useEffect(() => {
    if (order && id) {
      // Connect to WebSocket for real-time updates
      connectToOrder(id);
      
      // Initial fetch regardless of connection status
      fetchRiderLocation();
      
      // Update tracking location from assistant's current location
      if (order.assistant && (order.status === 'assigned' || order.status === 'in_progress')) {
        updateTrackingFromAssistantLocation();
      }
      
      // Initial price update
      if (order.status === 'in_progress' || order.status === 'assigned') {
        updatePriceRealtime();
      }
      
      // If WebSocket is not connected, fall back to polling
      let trackingInterval = null;
      let priceUpdateInterval = null;
      
      if (!connected) {
        // Set up interval for continuous tracking
        trackingInterval = setInterval(() => {
          fetchRiderLocation();
          // Also update tracking location from assistant's current location
          if (order.assistant && (order.status === 'assigned' || order.status === 'in_progress')) {
            updateTrackingFromAssistantLocation();
          }
        }, 10000); // Update every 10 seconds
      }
      
      // Set up interval for price updates (every 2 minutes)
      if (order.status === 'in_progress' || order.status === 'assigned') {
        priceUpdateInterval = setInterval(updatePriceRealtime, 120000); // Update every 2 minutes
      }
      
      return () => {
        if (trackingInterval) clearInterval(trackingInterval);
        if (priceUpdateInterval) clearInterval(priceUpdateInterval);
      };
    }
  }, [order, id, connected, connectToOrder, fetchRiderLocation, updatePriceRealtime, updateTrackingFromAssistantLocation]);

  // Update rider location when tracking data changes
  useEffect(() => {
    fetchRiderLocation();
  }, [trackingData, fetchRiderLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <FaExclamationTriangle className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Tracking</h2>
          <p className="text-gray-700 mb-6">{error || 'Order not found or you do not have permission to view it.'}</p>
          <Link to="/orders" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <div className="container mx-auto px-4 py-20 mt-8">
        <div className="mb-6">
          <Link to={`/orders/${id}`} className="flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Order Details
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Tracking Order: {order.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
              order.status === 'completed' ? 'bg-green-100 text-green-800' : 
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status === 'in_progress' ? 'In Progress' : 
               order.status === 'completed' ? 'Completed' : 
               order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
            </span>
          </div>
          
          <div className="p-6">
            {/* Tracking Status Section */}
            {trackingData && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FaTruck className="text-blue-500 mr-2" />
                  Tracking Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium">
                      {getTrackingStatus() === 'active' ? 'Active Tracking' : 'Tracking Inactive'}
                    </p>
                  </div>
                  {trackingData.current_latitude && trackingData.current_longitude && (
                    <div>
                      <p className="text-sm text-gray-600">Last Location</p>
                      <p className="font-medium text-xs">
                        {trackingData.current_latitude.toFixed(4)}, {trackingData.current_longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                  {trackingData.last_updated && (
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium text-sm">
                        {new Date(trackingData.last_updated).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Location History Summary */}
                {locationHistory && locationHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-gray-600">
                      Location History: {locationHistory.length} points tracked
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="text-red-500 mr-2" />
                Live Tracking
              </h2>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-gray-700">
                  {order.status === 'in_progress' ? 
                    (getTrackingStatus() === 'active' ? 
                      'Your order is in progress. Live tracking is active below.' : 
                      'Your order is in progress. Waiting for assistant to start tracking.') : 
                    order.status === 'assigned' ?
                    (getTrackingStatus() === 'active' ? 
                      'Order assigned. Assistant tracking is active.' : 
                      'Order assigned. Waiting for assistant to start tracking.') :
                    order.status === 'completed' ?
                    'Your order has been completed successfully. Thank you for using Fagi Errands!' :
                    'Tracking is only available when your order is assigned or in progress.'}
                </p>
                
                {/* Show tracking status for better user understanding */}
                {(order.status === 'assigned' || order.status === 'in_progress') && (
                  <div className="mt-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getTrackingStatus() === 'active' ? 
                      'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getTrackingStatus() === 'active' ? '🟢 Live Tracking Active' : '🟡 Tracking Not Started'}
                    </span>
                  </div>
                )}
                
                {/* Initialize Tracking Button for Assistants */}
                {user && user.user_type === 'assistant' && 
                 order.assistant && order.assistant.id === user.id && 
                 (order.status === 'assigned' || order.status === 'in_progress') &&
                 getTrackingStatus() === 'inactive' && (
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        try {
                          await initializeTracking();
                          alert('Tracking initialized successfully!');
                        } catch (error) {
                          alert('Failed to initialize tracking. Please try again.');
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium inline-flex items-center transition duration-200"
                    >
                      <FaTruck className="mr-2" />
                      Start Tracking
                    </button>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/payment?orderId=${order.id}`)}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center transition duration-200"
                    >
                      <FaMoneyBillWave className="mr-2" />
                      Proceed to Payment
                    </button>
                  </div>
                )}
              </div>
              
              <div className="h-96 rounded-lg overflow-hidden border border-gray-300 relative">
                {/* Overlay message when tracking is not active */}
                {getTrackingStatus() === 'inactive' && (order.status === 'assigned' || order.status === 'in_progress') && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="bg-white p-4 rounded-lg text-center max-w-sm">
                      <FaTruck className="text-gray-400 text-3xl mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Live Tracking Not Started</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {user && user.user_type === 'assistant' && order.assistant && order.assistant.id === user.id ?
                          'Click "Start Tracking" above to begin live tracking' :
                          'Waiting for assistant to start tracking'
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                <GoogleMapComponent
                  pickupLocation={
                    order.pickup_latitude && order.pickup_longitude && 
                    !isNaN(parseFloat(order.pickup_latitude)) && !isNaN(parseFloat(order.pickup_longitude)) ? 
                    { 
                      lat: parseFloat(order.pickup_latitude), 
                      lng: parseFloat(order.pickup_longitude),
                      name: order.pickup_address || 'Pickup Location'
                    } : null
                  }
                  deliveryLocation={
                    order.delivery_latitude && order.delivery_longitude && 
                    !isNaN(parseFloat(order.delivery_latitude)) && !isNaN(parseFloat(order.delivery_longitude)) ? 
                    { 
                      lat: parseFloat(order.delivery_latitude), 
                      lng: parseFloat(order.delivery_longitude),
                      name: order.delivery_address || 'Delivery Location'
                    } : null
                  }
                  markers={[
                    ...(order.pickup_latitude && order.pickup_longitude && 
                        !isNaN(parseFloat(order.pickup_latitude)) && !isNaN(parseFloat(order.pickup_longitude)) ? [{
                      latitude: parseFloat(order.pickup_latitude),
                      longitude: parseFloat(order.pickup_longitude),
                      name: order.pickup_address || 'Pickup Location',
                      color: '#22c55e',
                      type: 'pickup'
                    }] : []),
                    ...(order.delivery_latitude && order.delivery_longitude && 
                        !isNaN(parseFloat(order.delivery_latitude)) && !isNaN(parseFloat(order.delivery_longitude)) ? [{
                      latitude: parseFloat(order.delivery_latitude),
                      longitude: parseFloat(order.delivery_longitude),
                      name: order.delivery_address || 'Delivery Location',
                      color: '#ef4444',
                      type: 'delivery'
                    }] : []),
                    ...(riderLocation && riderLocation.latitude && riderLocation.longitude && 
                        !isNaN(parseFloat(riderLocation.latitude)) && !isNaN(parseFloat(riderLocation.longitude)) ? [{
                      latitude: parseFloat(riderLocation.latitude),
                      longitude: parseFloat(riderLocation.longitude),
                      name: 'Current Position',
                      color: '#3b82f6',
                      type: 'rider'
                    }] : [])
                  ]}
                  showRoute={riderLocation && Array.isArray(riderLocation.waypoints) && riderLocation.waypoints.length > 0}
                  routeCoordinates={
                    riderLocation && Array.isArray(riderLocation.waypoints) && riderLocation.waypoints.length > 0 ?
                    riderLocation.waypoints.map(wp => ({
                      latitude: parseFloat(wp.latitude || wp.lat),
                      longitude: parseFloat(wp.longitude || wp.lng)
                    })).filter(wp => !isNaN(wp.latitude) && !isNaN(wp.longitude)) :
                    []
                  }
                  height="100%"
                  center={
                    riderLocation ? 
                    [parseFloat(riderLocation.longitude), parseFloat(riderLocation.latitude)] :
                    (order.pickup_latitude && order.pickup_longitude ? 
                      [parseFloat(order.pickup_longitude), parseFloat(order.pickup_latitude)] :
                      null)
                  }
                  zoom={12}
                  showControls={true}
                />
              </div>
              
              {/* Price and Distance Information */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaMoneyBillWave className="text-green-500 mr-2" />
                    Price & Distance
                  </h3>
                  
                  <PriceCalculator 
                    pickupLocation={
                      order.pickup_latitude && order.pickup_longitude ? 
                      { 
                        latitude: parseFloat(order.pickup_latitude), 
                        longitude: parseFloat(order.pickup_longitude) 
                      } : null
                    }
                    deliveryLocation={
                      order.delivery_latitude && order.delivery_longitude ? 
                      { 
                        latitude: parseFloat(order.delivery_latitude), 
                        longitude: parseFloat(order.delivery_longitude) 
                      } : null
                    }
                    orderTypeId={order.order_type ? order.order_type.id : null}
                    items={order.shopping_items || []}
                  />
                </div>
              
                <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-2">Map Legend</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                        <FaMapMarkerAlt size={12} />
                      </div>
                      <span className="text-sm">Pickup Location</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white mr-2">
                        <FaFlag size={12} />
                      </div>
                      <span className="text-sm">Delivery Location</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white mr-2">
                        <FaTruck size={12} />
                      </div>
                      <span className="text-sm">Rider Location</span>
                    </div>
                  </div>
                </div>
              
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaTruck className="text-red-500 mr-2" />
                    Delivery Status
                  </h3>
                  
                  {connected ? (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                      <p className="font-semibold">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Live tracking active
                      </p>
                      <p>Real-time updates are enabled</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                      <p className="font-semibold">
                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        Polling mode active
                      </p>
                      <p>Updates every 10 seconds</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Delivery Progress */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaFlag className="text-blue-500 mr-2" />
                  Delivery Progress
                </h3>
                
                {/* Fixed the conditional rendering here */}
                {((waypoints && waypoints.length > 0) || (riderLocation && riderLocation.waypoints && riderLocation.waypoints.length > 0)) ? (
                  <div>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Delivery Route</h4>
                      <div className="space-y-2">
                        {(waypoints && waypoints.length > 0 ? waypoints : (riderLocation?.waypoints || []))
                          .sort((a, b) => {
                            // Handle different property names between WebSocket and API data
                            const aIndex = a.order_index !== undefined ? a.order_index : a.orderIndex;
                            const bIndex = b.order_index !== undefined ? b.order_index : b.orderIndex;
                            return aIndex - bIndex;
                          })
                          .map((waypoint, index) => {
                            // Handle different property names
                            const waypointType = waypoint.waypoint_type || waypoint.type;
                            const isVisited = waypoint.is_visited || waypoint.isVisited;
                            
                            return (
                              <div key={waypoint.id || index} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white mr-2 ${
                                  isVisited ? 'bg-green-600' :
                                  waypointType === 'pickup' ? 'bg-blue-500' :
                                  waypointType === 'delivery' ? 'bg-green-500' : 'bg-indigo-500'
                                }`}>
                                  {isVisited ? '✓' : index + 1}
                                </div>
                                <span className={isVisited ? 'text-green-600' : ''}>
                                  {waypoint.name || waypointType}
                                  {isVisited && waypoint.visited_at && (
                                    <span className="text-xs ml-2">
                                      (Visited at {new Date(waypoint.visited_at).toLocaleTimeString()})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  
                    {/* Recent Events */}
                    {riderLocation && riderLocation.events && riderLocation.events.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Recent Updates</h4>
                        <div className="space-y-2">
                          {riderLocation.events
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .slice(0, 3)
                            .map((event, index) => (
                              <div key={event.id || index} className="text-sm">
                                <span className="font-medium">
                                  {new Date(event.timestamp).toLocaleTimeString()}:
                                </span>
                                <span className="ml-2">
                                  {event.description || event.event_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ) : order.status === 'in_progress' ? (
                  <div className="mt-4 bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                    <p>Waiting for rider location updates...</p>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Order Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Pickup Location</h3>
                  <p className="text-gray-900">{order.pickup_address || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Delivery Location</h3>
                  <p className="text-gray-900">{order.delivery_address || 'Not specified'}</p>
                </div>
                
                {order.scheduled_date && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Scheduled Date</h3>
                    <p className="text-gray-900">{new Date(order.scheduled_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                {order.scheduled_time && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Scheduled Time</h3>
                    <p className="text-gray-900">{order.scheduled_time}</p>
                  </div>
                )}
              </div>
            </div>
            
              <div className="mt-8 flex justify-between items-center">
                <Link 
                  to={`/orders/${id}`} 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition duration-200"
                >
                  Back to Order Details
                </Link>
                
                {/* Add Update Price button here */}
                {(order.status === 'in_progress' || order.status === 'assigned' || 
                  order.status === 'In Progress' || order.status === 'Assigned') && 
                  (userRole === 'assistant' || userRole === 'rider') && !order.price_finalized && (
                  <button
                    onClick={updatePriceRealtime}
                    disabled={order.price_finalized}
                    className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200 flex items-center ${order.price_finalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Update Price
                  </button>
                )}
                
                {/* Report Issue button - only for non-completed orders */}
                {order.status !== 'completed' && (
                  <Link 
                    to={`/orders/${id}/report-issue`} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded-lg transition duration-200"
                  >
                    Report an Issue
                  </Link>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
