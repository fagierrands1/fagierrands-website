import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import GoogleMapComponent from '../Common/GoogleMapComponent';
import PaymentStatusIndicator from '../PaymentStatus/PaymentStatusIndicator';
import { FaStar } from 'react-icons/fa';

import config from '../../config';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatCurrency } from '../../utils/helpers';

// Define API base URL for all requests
const API_BASE_URL = config.API_BASE_URL;

// Simple map component for order locations using Google Maps
const SimpleMapComponent = ({ pickupLocation, deliveryLocation }) => {
  // Calculate center point between pickup and delivery
  const center = [
    (pickupLocation.lng + deliveryLocation.lng) / 2,
    (pickupLocation.lat + deliveryLocation.lat) / 2
  ];

  // Create markers for pickup and delivery
  const markers = [
    {
      latitude: pickupLocation.lat,
      longitude: pickupLocation.lng,
      name: 'Pickup Location',
      color: '#22c55e',
      popup: '<strong>Pickup Location</strong>'
    },
    {
      latitude: deliveryLocation.lat,
      longitude: deliveryLocation.lng,
      name: 'Delivery Location',
      color: '#ef4444',
      popup: '<strong>Delivery Location</strong>'
    }
  ];

  return (
    <GoogleMapComponent
      markers={markers}
      center={center}
      zoom={12}
      height="100%"
      showControls={true}
    />
  );
};

const OrderDetails = () => {
  const params = useParams();
  const orderId = params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Rating functionality
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState(null);

  // Live assistant locations via WebSocket or polling
  // Primary: WebSocket (orderLocations) - Real-time updates from /api/orders/{id}/tracking/
  // Fallback: HTTP Polling (pollingLocations) - 3s interval if WebSocket unavailable
  const { connectToOrder, disconnect, orderLocations, waypoints } = useWebSocket();
  const [pollingLocations, setPollingLocations] = useState([]);
  const [pollingWaypoints, setPollingWaypoints] = useState([]);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);
  const [geocodedWaypoints, setGeocodedWaypoints] = useState([]);
  const [lastWaypointsFetch, setLastWaypointsFetch] = useState(0);

  // Debug: Log the params object to see what's available
  useEffect(() => {
    console.log("URL Parameters:", params);
    console.log("OrderDetails mounted. orderId:", orderId);
  }, [params, orderId]);

  useEffect(() => {
    if (order) {
      console.log("Order object:", order);
      console.log("Type of price:", typeof order.price);
      console.log("Order status:", order.status);
      console.log("Has review:", order.has_review);
      console.log("Review:", order.review);
      console.log("Should show review button:", (order.status === 'completed' || order.status === 'Completed'));
    }
  }, [order]);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        const storedOrderId = localStorage.getItem('lastOrderId');
        
        if (storedOrderId) {
          navigate(`/orders/${storedOrderId}`, { replace: true });
          return;
        } else {
          setError('Order ID not found. Please navigate from the orders list.');
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const response = await axios.get(`orders/${orderId}/`, config);
        
        console.log("Order details response:", response.data);
        const orderData = response.data;
        setOrder(orderData);
        
        // Check if order has waypoints directly
        if (orderData.waypoints && Array.isArray(orderData.waypoints) && orderData.waypoints.length > 0) {
          console.log('[OrdersDetails] Found waypoints in order data:', orderData.waypoints);
          setPollingWaypoints(orderData.waypoints);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        
        if (err.response) {
          if (err.response.status === 404) {
            setError('Order not found.');
          } else if (err.response.status === 401) {
            navigate('/login');
            return;
          } else {
            setError(`Failed to load order details: ${err.response.data?.detail || 'Unknown error'}`);
          }
        } else if (err.request) {
          console.log('Network error details:', err.message);
          if (err.message.includes('CORS')) {
            setError('Cross-Origin Request Blocked. This is a server configuration issue. Please contact support.');
          } else {
            setError('Network error. Please check your connection.');
          }
        } else {
          setError('Failed to load order details.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);

  // Load order attachments for display (images, PDFs, etc.)
  useEffect(() => {
    if (!orderId) return;
    const loadAttachments = async () => {
      try {
        setAttachmentsLoading(true);
        setAttachmentsError(null);
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const cfg = { headers: { 'Authorization': `Bearer ${token}` } };
        const res = await axios.get(`orders/${orderId}/attachments/`, cfg);
        const items = Array.isArray(res.data?.results) ? res.data.results : [];
        setAttachments(items);
      } catch (e) {
        setAttachmentsError('Failed to load attachments');
      } finally {
        setAttachmentsLoading(false);
      }
    };
    loadAttachments();
  }, [orderId]);

  // Connect to live assistant locations for this order
  useEffect(() => {
    if (!orderId) return;
    try {
      connectToOrder(orderId);
    } catch (e) {
      console.log('WebSocket connect skipped/not available:', e?.message);
    }
    return () => {
      try { disconnect(); } catch (_) {}
    };
  }, [orderId, connectToOrder, disconnect]);

  // Polling fallback for live tracking when WebSocket is unavailable
  useEffect(() => {
    if (!orderId) return;

    const fetchTrackingData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        console.log('[OrdersDetails] Fetching tracking data for order:', orderId);
        const response = await axios.get(`orders/${orderId}/tracking/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('[OrdersDetails] Tracking response:', response.data);

        // Handle assistant location from tracking response
        if (response.data) {
          const hasLocation = response.data.current_latitude && response.data.current_longitude;
          console.log('[OrdersDetails] Tracking response location data:', {
            hasLocation: hasLocation,
            current_latitude: response.data.current_latitude,
            current_longitude: response.data.current_longitude,
            assistant_id: response.data.assistant_id,
            assistant: response.data.assistant
          });
          
          if (hasLocation) {
            setPollingLocations([{
              user_id: response.data.assistant_id || response.data.assistant?.id || response.data.id || 'tracking',
              username: response.data.assistant?.username || response.data.assistant?.name || 'Assistant',
              user_type: 'assistant',
              latitude: response.data.current_latitude,
              longitude: response.data.current_longitude,
              heading: response.data.heading || 0,
              speed: response.data.current_speed || 0,
              accuracy: response.data.accuracy || 0,
              last_updated: response.data.updated_at || new Date().toISOString()
            }]);
            console.log('[OrdersDetails] Set polling locations with assistant location');
          } else {
            console.log('[OrdersDetails] No valid assistant location in tracking response (coordinates are null)');
            // Try to fetch assistant location from locations API if order has an assistant
            if (order && order.assistant && order.assistant.id) {
              try {
                console.log('[OrdersDetails] Attempting to fetch assistant location from locations API for assistant:', order.assistant.id);
                const locationResponse = await axios.get(`locations/current/?user_id=${order.assistant.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (locationResponse.data && locationResponse.data.latitude && locationResponse.data.longitude) {
                  setPollingLocations([{
                    user_id: order.assistant.id,
                    username: order.assistant.username || order.assistant.name || 'Assistant',
                    user_type: 'assistant',
                    latitude: locationResponse.data.latitude,
                    longitude: locationResponse.data.longitude,
                    last_updated: locationResponse.data.last_updated || new Date().toISOString()
                  }]);
                  console.log('[OrdersDetails] Found assistant location from locations API');
                }
              } catch (locationErr) {
                console.log('[OrdersDetails] Could not fetch assistant location from locations API:', locationErr.message);
              }
            } else {
              // Clear polling locations if coordinates are null and no assistant
              setPollingLocations([]);
            }
          }
        }

        // Check multiple possible locations for waypoints in the response
        let waypointsData = null;
        
        if (response.data) {
          // Try direct waypoints array
          if (response.data.waypoints && Array.isArray(response.data.waypoints)) {
            waypointsData = response.data.waypoints;
            console.log('[OrdersDetails] Found waypoints in response.data.waypoints:', waypointsData);
          }
          // Try nested waypoints
          else if (response.data.tracking && response.data.tracking.waypoints) {
            waypointsData = response.data.tracking.waypoints;
            console.log('[OrdersDetails] Found waypoints in response.data.tracking.waypoints:', waypointsData);
          }
          // Try waypoints from related tracking object
          else if (response.data.tracking_waypoints && Array.isArray(response.data.tracking_waypoints)) {
            waypointsData = response.data.tracking_waypoints;
            console.log('[OrdersDetails] Found waypoints in response.data.tracking_waypoints:', waypointsData);
          }
        }

        if (waypointsData && Array.isArray(waypointsData) && waypointsData.length > 0) {
          console.log('[OrdersDetails] Setting polling waypoints:', waypointsData.length, 'waypoints');
          setPollingWaypoints(waypointsData);
          setLastWaypointsFetch(Date.now());
        } else {
          // Fallback: Fetch waypoints from tracking waypoints endpoint
          // Only fetch if we haven't fetched recently (every 10 seconds max)
          const timeSinceLastFetch = Date.now() - lastWaypointsFetch;
          if (timeSinceLastFetch < 10000 && pollingWaypoints.length > 0) {
            console.log('[OrdersDetails] Skipping waypoint fetch (recently fetched)', Math.round(timeSinceLastFetch / 1000), 'seconds ago');
            return;
          }

          console.log('[OrdersDetails] No waypoints in tracking response, fetching from waypoints endpoint. Order ID:', orderId);
          
          try {
            const waypointsResponse = await axios.get(`orders/${orderId}/tracking/waypoints/`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (waypointsResponse.data && Array.isArray(waypointsResponse.data) && waypointsResponse.data.length > 0) {
              console.log('[OrdersDetails] Found waypoints from waypoints endpoint:', waypointsResponse.data.length);
              setPollingWaypoints(waypointsResponse.data);
              setLastWaypointsFetch(Date.now());
            } else {
              console.log('[OrdersDetails] No waypoints found (empty array)');
              setPollingWaypoints([]);
            }
          } catch (waypointsErr) {
            console.warn('[OrdersDetails] Failed to fetch waypoints:', {
              status: waypointsErr.response?.status,
              message: waypointsErr.message
            });
            
            // Try alternative tracking ID based path if main path fails
            if (response.data?.id && waypointsErr.response?.status === 404) {
              try {
                console.log('[OrdersDetails] Trying alternative waypoints endpoint with tracking ID:', response.data.id);
                const altResponse = await axios.get(`orders/tracking/${response.data.id}/waypoints/`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (altResponse.data && Array.isArray(altResponse.data) && altResponse.data.length > 0) {
                  console.log('[OrdersDetails] Found waypoints from alternative endpoint:', altResponse.data.length);
                  setPollingWaypoints(altResponse.data);
                  setLastWaypointsFetch(Date.now());
                }
              } catch (altErr) {
                console.warn('[OrdersDetails] Alternative endpoint also failed:', altErr.message);
                setPollingWaypoints([]);
              }
            } else {
              setPollingWaypoints([]);
            }
          }
        }
      } catch (err) {
        console.error('[OrdersDetails] Polling tracking data failed:', err);
        console.error('[OrdersDetails] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
      }
    };

    // Start polling every 3 seconds as a fallback (faster updates for live tracking)
    // Only poll if WebSocket is not connected to avoid duplicate requests
    const shouldPoll = !orderLocations || orderLocations.length === 0;
    
    if (shouldPoll) {
      console.log('[OrdersDetails] Starting polling fallback (WebSocket unavailable)');
      const intervalId = setInterval(fetchTrackingData, 3000);
      setPollingIntervalId(intervalId);
    } else {
      console.log('[OrdersDetails] WebSocket connected, using live data instead of polling');
    }

    // Fetch once immediately
    fetchTrackingData();

    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        console.log('[OrdersDetails] Polling stopped');
      }
    };
  }, [orderId, orderLocations]);

  // Geocode waypoints that don't have coordinates or have pickup/delivery coordinates
  useEffect(() => {
    const geocodeWaypoints = async () => {
      const waypointsArray = (waypoints && waypoints.length > 0 ? waypoints : pollingWaypoints) || [];
      if (waypointsArray.length === 0) {
        setGeocodedWaypoints([]);
        return;
      }

      // Get pickup/delivery coordinates for comparison
      const pickupLat = order?.pickup_latitude ? Number(order.pickup_latitude) : null;
      const pickupLng = order?.pickup_longitude ? Number(order.pickup_longitude) : null;
      const deliveryLat = order?.delivery_latitude ? Number(order.delivery_latitude) : null;
      const deliveryLng = order?.delivery_longitude ? Number(order.delivery_longitude) : null;

      const waypointsToGeocode = waypointsArray.filter(w => {
        const lat = Number(w.latitude);
        const lng = Number(w.longitude);
        const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);
        const hasAddress = !!(w.name || w.address || w.description);
        
        if (!hasValidCoords && hasAddress) {
          return true; // Always geocode if no coordinates
        }
        
        if (!hasAddress) {
          return false; // Can't geocode without address
        }
        
        // Check if coordinates match pickup or delivery (likely wrong)
        const matchesPickup = pickupLat && pickupLng && 
          Math.abs(lat - pickupLat) < 0.0001 && Math.abs(lng - pickupLng) < 0.0001;
        const matchesDelivery = deliveryLat && deliveryLng && 
          Math.abs(lat - deliveryLat) < 0.0001 && Math.abs(lng - deliveryLng) < 0.0001;
        
        // Also check if coordinates are very close to pickup/delivery (within ~20 meters)
        // This catches cases where coordinates are slightly off but still wrong
        const veryCloseToPickup = pickupLat && pickupLng && 
          Math.abs(lat - pickupLat) < 0.0003 && Math.abs(lng - pickupLng) < 0.0003;
        const veryCloseToDelivery = deliveryLat && deliveryLng && 
          Math.abs(lat - deliveryLat) < 0.0003 && Math.abs(lng - deliveryLng) < 0.0003;
        
        const shouldGeocode = matchesPickup || matchesDelivery || veryCloseToPickup || veryCloseToDelivery;
        
        if (shouldGeocode) {
          console.log('[OrdersDetails] Waypoint coordinates too close to pickup/delivery, will geocode:', {
            name: w.name,
            waypointCoords: { lat, lng },
            pickupCoords: { lat: pickupLat, lng: pickupLng },
            deliveryCoords: { lat: deliveryLat, lng: deliveryLng },
            matchesPickup,
            matchesDelivery,
            veryCloseToPickup,
            veryCloseToDelivery
          });
        }
        
        return shouldGeocode;
      });

      if (waypointsToGeocode.length === 0) {
        setGeocodedWaypoints([]);
        return;
      }

      console.log('[OrdersDetails] Geocoding', waypointsToGeocode.length, 'waypoints (missing or wrong coordinates)');

      const geocodeAddress = async (address) => {
        try {
          // Add delay to respect Nominatim rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000));
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.length > 0) {
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              success: true
            };
          }
          return { success: false };
        } catch (error) {
          console.error('[OrdersDetails] Geocoding error:', error);
          return { success: false };
        }
      };

      const geocoded = [];
      for (let i = 0; i < waypointsToGeocode.length; i++) {
        const w = waypointsToGeocode[i];
        const address = w.name || w.address || w.description || '';
        const waypointIndex = (w.order_index !== undefined && w.order_index !== null) 
          ? Number(w.order_index) 
          : waypointsArray.indexOf(w);
        
        console.log('[OrdersDetails] Geocoding waypoint:', address, 'Current coords:', w.latitude, w.longitude);
        const result = await geocodeAddress(address);
        
        if (result.success) {
          geocoded.push({
            latitude: result.lat,
            longitude: result.lng,
            name: w.name || `Waypoint ${waypointIndex + 1}`,
            originalIndex: waypointsArray.indexOf(w),
            orderIndex: waypointIndex,
            originalName: address,
            originalWaypoint: w // Store reference to original waypoint
          });
          console.log('[OrdersDetails] ✓ Geocoded waypoint:', address, '->', result.lat, result.lng);
        } else {
          console.warn('[OrdersDetails] Failed to geocode waypoint:', address);
        }
      }

      setGeocodedWaypoints(geocoded);
      console.log('[OrdersDetails] Geocoded', geocoded.length, 'waypoints');
    };

    geocodeWaypoints();
  }, [waypoints, pollingWaypoints, order]);

  // Function to get color for waypoint type
  const getWaypointColor = (waypointType) => {
    const colorMap = {
      'pickup': '#16a34a',
      'delivery': '#dc2626',
      'intermediate': '#a855f7',
      'custom': '#a855f7'
    };
    return colorMap[waypointType] || '#4b5563';
  };

  // Function to format status for display
  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'assigned': 'In Progress'
    };
    
    return statusMap[status] || status;
  };

  // Function to get appropriate status badge styling
  const getStatusClass = (status) => {
    const formattedStatus = formatStatus(status);
    switch (formattedStatus) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format the date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to format order ID
  const formatOrderId = (id) => {
    return typeof id === 'string' ? `#${id.substring(0, 8)}` : `#${id}`;
  };
  
  // Function to determine the order type from different order structures
  const getOrderType = (order) => {
    if (order.order_type && order.order_type.name) {
      return order.order_type.name;
    }
    
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      return 'Home-Maintenance Service';
    }
    
    if (order.service_type) {
      if (typeof order.service_type === 'string') {
        return order.service_type;
      } else if (order.service_type.name) {
        return order.service_type.name;
      }
    }
    
    if (order.banking_orders && order.banking_orders.length > 0) {
      const bankingOrder = order.banking_orders[0];
      return `Banking - ${bankingOrder.transaction_type || 'Transaction'}`;
    }
    
    if (order.title) {
      if (order.title.includes('Handyman')) {
        return 'Home-Maintenance Service';
      } else if (order.title.includes('Banking')) {
        return 'Banking Service';
      }
      return order.title;
    }
    
    return 'General Service';
  };
  
  // Function to get the price from different order structures
  const getOrderPrice = (order) => {
    // Check direct price fields first
    if (order.price && parseFloat(order.price) > 0) {
      return parseFloat(order.price).toFixed(2);
    }
    
    if (order.total_amount && parseFloat(order.total_amount) > 0) {
      return parseFloat(order.total_amount).toFixed(2);
    }
    
    // Check handyman orders
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      const handymanOrder = order.handyman_orders[0];
      if (handymanOrder.price && parseFloat(handymanOrder.price) > 0) {
        return parseFloat(handymanOrder.price).toFixed(2);
      }
      // Check facilitation fee + service quote
      const facilitationFee = parseFloat(handymanOrder.facilitation_fee || 0);
      const serviceQuote = parseFloat(handymanOrder.service_quote || 0);
      const approvedPrice = parseFloat(handymanOrder.approved_service_price || 0);
      if (facilitationFee + serviceQuote + approvedPrice > 0) {
        return (facilitationFee + serviceQuote + approvedPrice).toFixed(2);
      }
    }
    
    // Check banking orders
    if (order.banking_orders && order.banking_orders.length > 0) {
      const bankingOrder = order.banking_orders[0];
      if (bankingOrder.amount && parseFloat(bankingOrder.amount) > 0) {
        return parseFloat(bankingOrder.amount).toFixed(2);
      }
    }
    
    // Calculate from shopping items if available
    if (order.shopping_items && Array.isArray(order.shopping_items) && order.shopping_items.length > 0) {
      const itemsTotal = order.shopping_items.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return sum + (itemPrice * quantity);
      }, 0);
      if (itemsTotal > 0) {
        return itemsTotal.toFixed(2);
      }
    }
    
    // Calculate from items array if available
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const itemsTotal = order.items.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return sum + (itemPrice * quantity);
      }, 0);
      if (itemsTotal > 0) {
        return itemsTotal.toFixed(2);
      }
    }
    
    return '0.00';
  };

  const handleCancelOrder = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const orderIdInt = parseInt(orderId, 10);
      
      await axios.patch(`orders/${orderIdInt}/status/`, {
        status: 'cancelled'
      }, config);
      
      setOrder({...order, status: 'cancelled'});
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order. Please try again later.');
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const orderIdInt = parseInt(orderId, 10);
      
      await axios.patch(`orders/${orderIdInt}/status/`, {
        status: 'completed'
      }, config);
      
      setOrder({...order, status: 'completed'});
    } catch (err) {
      console.error('Error confirming order completion:', err);
      setError('Failed to complete order. Please try again later.');
    }
  };

  // Handle to add feedback/review for completed orders
  const handleAddReview = () => {
    setShowReviewForm(true);
  };
  
  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }
    
    try {
      setSubmittingReview(true);
      const token = localStorage.getItem('authToken');
      
      await axios.post(`orders/${orderId}/review/`, {
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReviewSuccess(true);
      setShowReviewForm(false);
      
      setOrder({...order, has_review: true, review: { rating, comment }});
      
      setRating(0);
      setComment('');
      
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
          <div className="text-center">
            <Link to="/orders" className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
            <Link to="/orders" className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Adapt backend status to frontend format
  const displayStatus = formatStatus(order.status);
  
  // Handle mapping for display
  const orderItems = order.items || [];
  
  // Check if coordinates are available for map display (at least one location)
  const hasMapCoordinates = (order.pickup_latitude && order.pickup_longitude) || 
                          (order.delivery_latitude && order.delivery_longitude) ||
                          (orderLocations && orderLocations.length > 0) ||
                          (pollingLocations && pollingLocations.length > 0) ||
                          (waypoints && waypoints.length > 0) ||
                          (pollingWaypoints && pollingWaypoints.length > 0);
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Back Navigation */}
          <div className="mb-4">
            {(() => {
              const from = (typeof window !== 'undefined' && window.history.state && window.history.state.usr && window.history.state.usr.from)
                ? window.history.state.usr.from
                : null;
              const fromState = (location && location.state && location.state.from) ? location.state.from : null;
              const backTo = fromState || from || '/orders';
              return (
                <Link to={backTo} className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  Back to Orders
                </Link>
              );
            })()}
          </div>

          {/* Header Section with Order Info and Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order {formatOrderId(order.id)}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-gray-600">{formatDate(order.created_at)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                    {displayStatus}
                  </span>
                  <span className="font-semibold text-base text-gray-900">
                    {formatCurrency(getOrderPrice(order), 'KES')}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
                
                {order.status === 'in_progress' && order.assistant && (
                  <Link 
                    to={`/orders/${orderId}/track`}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
                  >
                    Track Order
                  </Link>
                )}
                
                {order.status !== 'completed' && (
                  <Link 
                    to={`/orders/${orderId}/report-issue`}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    Report Issue
                  </Link>
                )}
                
                {(order.status === 'completed' || order.status === 'Completed') && !showReviewForm && !order.has_review && (
                  <button
                    onClick={handleAddReview}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    Rate Order
                  </button>
                )}
              </div>
            </div>
          </div>

        {/* Main Content */}
        <div className="space-y-4">
          
          {/* Order Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Basic Order Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Service Type</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{getOrderType(order)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-sm font-medium text-gray-900">{order.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(getOrderPrice(order), 'KES')}</span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Pickup Address</span>
                  <span className="text-sm font-medium text-gray-900">{order.pickup_location_display || order.pickup_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Delivery Address</span>
                  <span className="text-sm font-medium text-gray-900">{order.delivery_location_display || order.delivery_address || order.address || 'N/A'}</span>
                </div>
                {order.distance && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="text-sm font-medium text-gray-900">{order.distance} km</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Section */}
          {(hasMapCoordinates || (orderLocations && orderLocations.length > 0) || (pollingLocations && pollingLocations.length > 0) || (waypoints && waypoints.length > 0) || (pollingWaypoints && pollingWaypoints.length > 0)) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Route and Live Tracking</h2>
              <div style={{ height: '400px', width: '100%' }}>
                <GoogleMapComponent
                  pickupLocation={hasMapCoordinates ? {
                    lat: parseFloat(order.pickup_latitude),
                    lng: parseFloat(order.pickup_longitude),
                    name: order.pickup_address || order.pickup_location_display || 'Pickup Location'
                  } : null}
                  deliveryLocation={hasMapCoordinates ? {
                    lat: parseFloat(order.delivery_latitude),
                    lng: parseFloat(order.delivery_longitude),
                    name: order.delivery_address || order.delivery_location_display || order.address || 'Delivery Location'
                  } : null}
                  markers={(() => {
                      const waypointsArray = (waypoints && waypoints.length > 0 ? waypoints : pollingWaypoints) || [];
                      console.log('[OrdersDetails] Waypoints data:', {
                        waypoints: waypoints,
                        pollingWaypoints: pollingWaypoints,
                        waypointsArray: waypointsArray,
                        waypointsLength: waypointsArray.length
                      });
                      
                      // Process waypoints from backend - use geocoded coordinates if available
                      let processedWaypoints = [];
                      
                      if (waypointsArray.length > 0) {
                        const sortedWaypoints = [...waypointsArray].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                        
                        processedWaypoints = sortedWaypoints
                          .map((w, idx) => {
                            const waypointIndex = (w.order_index !== undefined && w.order_index !== null) 
                              ? Number(w.order_index) 
                              : idx;
                            
                            let lat = Number(w.latitude);
                            let lng = Number(w.longitude);
                            const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);
                            
                            // Check if coordinates match pickup/delivery (likely wrong)
                            const pickupLat = order?.pickup_latitude ? Number(order.pickup_latitude) : null;
                            const pickupLng = order?.pickup_longitude ? Number(order.pickup_longitude) : null;
                            const deliveryLat = order?.delivery_latitude ? Number(order.delivery_latitude) : null;
                            const deliveryLng = order?.delivery_longitude ? Number(order.delivery_longitude) : null;
                            
                            const matchesPickup = pickupLat && pickupLng && 
                              Math.abs(lat - pickupLat) < 0.0001 && Math.abs(lng - pickupLng) < 0.0001;
                            const matchesDelivery = deliveryLat && deliveryLng && 
                              Math.abs(lat - deliveryLat) < 0.0001 && Math.abs(lng - deliveryLng) < 0.0001;
                            
                            // If no valid coordinates OR coordinates match pickup/delivery, try geocoded
                            if (!hasValidCoords || matchesPickup || matchesDelivery) {
                              const address = w.name || w.address || w.description || '';
                              const geocoded = geocodedWaypoints.find(gw => 
                                gw.originalName === address || 
                                gw.originalIndex === idx ||
                                (gw.orderIndex === waypointIndex && gw.name === w.name) ||
                                (gw.originalWaypoint && gw.originalWaypoint === w)
                              );
                              if (geocoded) {
                                lat = geocoded.latitude;
                                lng = geocoded.longitude;
                                console.log('[OrdersDetails] Using geocoded coordinates for waypoint:', w.name, 'from', address, '->', lat, lng);
                              } else if (!hasValidCoords) {
                                // Skip waypoints without coordinates (they may still be geocoding)
                                console.log('[OrdersDetails] Skipping waypoint (no coordinates, geocoding may be in progress):', w.name);
                                return null;
                              } else {
                                // Has coordinates but they match pickup/delivery - wait for geocoding
                                console.log('[OrdersDetails] Waypoint coordinates match pickup/delivery, waiting for geocoding:', w.name);
                                return null;
                              }
                            }
                            
                            const waypointColor = '#9333ea';
                            
                            console.log('[OrdersDetails] ✓ Adding waypoint to map:', {
                              name: w.name,
                              type: w.waypoint_type,
                              order_index: w.order_index,
                              assigned_index: waypointIndex,
                              color: waypointColor,
                              lat: lat,
                              lng: lng,
                              latPrecise: lat.toFixed(7),
                              lngPrecise: lng.toFixed(7),
                              originalCoords: { lat: Number(w.latitude), lng: Number(w.longitude) },
                              usingGeocoded: !hasValidCoords || matchesPickup || matchesDelivery
                            });
                            
                            return {
                              latitude: lat,
                              longitude: lng,
                              name: w.name || `Waypoint ${waypointIndex + 1}`,
                              color: waypointColor,
                              index: waypointIndex, // CRITICAL: This marks it as a waypoint
                              popup: `<div style="text-align: center;"><strong style="color: #9333ea; font-size: 16px;">Waypoint #${waypointIndex + 1}</strong><br/><span style="color: #666;">${w.name || (w.waypoint_type ? w.waypoint_type.toUpperCase() : 'WAYPOINT')}</span>${w.description ? `<br/><small style="color: #888;">${w.description}</small>` : ''}</div>`
                            };
                          })
                          .filter(w => w !== null);
                        
                        console.log('[OrdersDetails] Processed waypoints:', processedWaypoints.length);
                      }
                      
                      // If no waypoints from backend, generate them from pickup and delivery coordinates
                      if (processedWaypoints.length === 0 && hasMapCoordinates) {
                        console.log('[OrdersDetails] No waypoints from backend, generating waypoints from pickup and delivery coordinates');
                        const generatedWaypoints = [];
                        
                        // Add pickup as waypoint 0
                        if (order.pickup_latitude && order.pickup_longitude) {
                          const pickupLat = Number(order.pickup_latitude);
                          const pickupLng = Number(order.pickup_longitude);
                          if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
                            generatedWaypoints.push({
                              latitude: pickupLat,
                              longitude: pickupLng,
                              name: order.pickup_address || order.pickup_location_display || 'Pickup Location',
                              color: '#9333ea',
                              type: 'pickup',
                              index: 0, // CRITICAL: This marks it as a waypoint
                              popup: `<div style="text-align: center;"><strong style="color: #9333ea; font-size: 16px;">Waypoint #1</strong><br/><span style="color: #666;">Pickup Location</span></div>`
                            });
                            console.log('[OrdersDetails] ✓ Added pickup as waypoint 0:', pickupLat, pickupLng);
                          }
                        }
                        
                        // Add delivery as waypoint 1
                        if (order.delivery_latitude && order.delivery_longitude) {
                          const deliveryLat = Number(order.delivery_latitude);
                          const deliveryLng = Number(order.delivery_longitude);
                          if (Number.isFinite(deliveryLat) && Number.isFinite(deliveryLng)) {
                            generatedWaypoints.push({
                              latitude: deliveryLat,
                              longitude: deliveryLng,
                              name: order.delivery_address || order.delivery_location_display || order.address || 'Delivery Location',
                              color: '#9333ea',
                              type: 'delivery',
                              index: 1, // CRITICAL: This marks it as a waypoint
                              popup: `<div style="text-align: center;"><strong style="color: #9333ea; font-size: 16px;">Waypoint #2</strong><br/><span style="color: #666;">Delivery Location</span></div>`
                            });
                            console.log('[OrdersDetails] ✓ Added delivery as waypoint 1:', deliveryLat, deliveryLng);
                          }
                        }
                        
                        processedWaypoints = generatedWaypoints;
                        console.log('[OrdersDetails] Generated waypoints from pickup/delivery coordinates:', generatedWaypoints.length);
                      }
                      
                      const allMarkers = [
                        // Note: pickup and delivery locations are passed as props to GoogleMapComponent
                        // so we don't need to add them to the markers array to avoid duplicates
                        // Add waypoints (these will be rendered with purple numbered markers and route line)
                        ...processedWaypoints,
                        // Add assistant live location markers
                        ...(() => {
                          const assistantLocations = (orderLocations && orderLocations.length > 0 ? orderLocations : pollingLocations) || [];
                          console.log('[OrdersDetails] Assistant locations data:', {
                            orderLocations: orderLocations,
                            pollingLocations: pollingLocations,
                            assistantLocations: assistantLocations,
                            assistantLocationsLength: assistantLocations.length
                          });
                          
                          const assistantMarkers = assistantLocations
                            .filter(u => {
                              const userType = (u.user_type || '').toLowerCase();
                              const isAssistant = userType === 'assistant';
                              console.log('[OrdersDetails] Checking location:', {
                                user_type: u.user_type,
                                isAssistant: isAssistant,
                                hasLat: !!u.latitude,
                                hasLng: !!u.longitude,
                                lat: u.latitude,
                                lng: u.longitude
                              });
                              return isAssistant;
                            })
                            .map(u => {
                              const lat = Number(u.latitude);
                              const lng = Number(u.longitude);
                              const isValid = Number.isFinite(lat) && Number.isFinite(lng);
                              
                              console.log('[OrdersDetails] Processing assistant location:', {
                                username: u.username,
                                user_id: u.user_id,
                                lat: lat,
                                lng: lng,
                                latPrecise: lat.toFixed(7),
                                lngPrecise: lng.toFixed(7),
                                isValid: isValid,
                                originalLatitude: u.latitude,
                                originalLongitude: u.longitude,
                                latType: typeof u.latitude,
                                lngType: typeof u.longitude
                              });
                              
                              return {
                                latitude: lat,
                                longitude: lng,
                                name: u.username || `Assistant #${u.user_id || 'Unknown'}`,
                                color: '#3b82f6',
                                popup: `<div><strong>${u.username || 'Assistant'}</strong><br/><small>Last update: ${new Date(u.last_updated || Date.now()).toLocaleTimeString()}</small></div>`,
                                isValid: isValid,
                                type: 'assistant' // Add type to help with detection
                              };
                            })
                            .filter(m => m.isValid)
                            .map(({ isValid, ...marker }) => marker); // Remove isValid property
                          
                          console.log('[OrdersDetails] Final assistant markers:', assistantMarkers.length, assistantMarkers);
                          return assistantMarkers;
                        })()
                      ];
                      
                      console.log('[OrdersDetails] Final markers array:', allMarkers);
                      console.log('[OrdersDetails] Waypoints in markers:', allMarkers.filter(m => m.index !== undefined && m.index !== null));
                      
                      allMarkers.forEach((m, i) => {
                        const lat = Number(m.latitude);
                        const lng = Number(m.longitude);
                        console.log(`[OrdersDetails] Marker ${i} (${m.name}):`, {
                          latitude: m.latitude,
                          longitude: m.longitude,
                          latNum: lat,
                          lngNum: lng,
                          latFinite: Number.isFinite(lat),
                          lngFinite: Number.isFinite(lng),
                          color: m.color,
                          type: m.type
                        });
                      });
                      
                      return allMarkers;
                    })()}
                  zoom={12}
                  height="100%"
                />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                    <span>Pickup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                    <span>Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a855f7' }}></div>
                    <span>Waypoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Assistant Location</span>
                  </div>
                </div>
                {(waypoints && waypoints.length > 0) || (pollingWaypoints && pollingWaypoints.length > 0) ? (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3">Delivery Route ({((waypoints && waypoints.length) || (pollingWaypoints && pollingWaypoints.length))} stops)</h3>
                    <div className="space-y-2">
                      {((waypoints && waypoints.length > 0 ? waypoints : pollingWaypoints) || [])
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                        .map((w, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: getWaypointColor(w.waypoint_type) }}>
                            <div 
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                              style={{ backgroundColor: getWaypointColor(w.waypoint_type) }}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium text-gray-900">{w.name || w.waypoint_type.charAt(0).toUpperCase() + w.waypoint_type.slice(1)}</p>
                              {w.description && <p className="text-sm text-gray-600 mt-1">{w.description}</p>}
                              {w.arrival_time && <p className="text-xs text-gray-500 mt-1">Arrival: {new Date(w.arrival_time).toLocaleTimeString()}</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

          {/* Service-specific Details */}
          {order.handyman_orders && order.handyman_orders.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Home-Maintenance Service Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block">Service Type</span>
                      <span className="font-medium">
                        {order.handyman_orders[0].service_type_name || 
                         (order.handyman_orders[0].service_type && order.handyman_orders[0].service_type.name) || 
                         'General Home-Maintenance Service'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Scheduled Date</span>
                      <span className="font-medium">{formatDate(order.handyman_orders[0].scheduled_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Time Slot</span>
                      <span className="font-medium">{order.handyman_orders[0].scheduled_time_slot}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">Description</span>
                    <p className="font-medium bg-gray-50 p-3 rounded">{order.handyman_orders[0].description}</p>
                  </div>
                </div>
                
                {/* Payment Information for Handyman Orders */}
                {order.handyman_orders[0].facilitation_fee && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 mb-1">Facilitation Fee</p>
                        <p className="font-medium">KSh {parseFloat(order.handyman_orders[0].facilitation_fee).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {order.handyman_orders[0].facilitation_fee_paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      
                      {order.handyman_orders[0].service_quote > 0 && (
                        <div>
                          <p className="text-gray-600 mb-1">Service Quote</p>
                          <p className="font-medium">KSh {parseFloat(order.handyman_orders[0].service_quote).toFixed(2)}</p>
                        </div>
                      )}
                      
                      {order.handyman_orders[0].approved_service_price > 0 && (
                        <div>
                          <p className="text-gray-600 mb-1">Approved Service Price</p>
                          <p className="font-medium">KSh {parseFloat(order.handyman_orders[0].approved_service_price).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {order.handyman_orders[0].final_payment_complete ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      )}
                      
                      {order.handyman_orders[0].total_price > 0 && (
                        <div>
                          <p className="text-gray-600 mb-1">Total Value</p>
                          <p className="font-medium">KSh {parseFloat(order.handyman_orders[0].total_price).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">(For record-keeping only)</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Final Payment Button */}
                    {order.handyman_orders[0].status === 'quote_approved' && 
                     order.handyman_orders[0].approved_service_price > 0 && 
                     !order.handyman_orders[0].final_payment_complete && (
                      <div className="mt-4">
                        <Link 
                          to={`/handyman-payment/${order.handyman_orders[0].id}`} 
                          className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Pay Service Fee (KSh {parseFloat(order.handyman_orders[0].approved_service_price).toFixed(2)})
                        </Link>
                        <p className="text-sm text-gray-500 mt-2">
                          You will only be charged the approved service price. The facilitation fee was already paid.
                        </p>
                      </div>
                    )}
                    
                    {/* Payment Complete Message */}
                    {order.handyman_orders[0].final_payment_complete && (
                      <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                        <p className="font-medium">✓ All payments complete</p>
                      </div>
                    )}
                    
                    {/* Payment Status Indicator for Handyman Orders */}
                    {!order.handyman_orders[0].final_payment_complete && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold mb-2">Payment Status</h4>
                        <PaymentStatusIndicator 
                          orderId={order.id}
                          onStatusChange={(paymentStatus, orderStatus) => {
                            console.log('Payment status changed:', paymentStatus, orderStatus);
                          }}
                          showDetails={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Banking Order Details */}
          {order.banking_orders && order.banking_orders.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Banking Transaction Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block">Bank</span>
                      <span className="font-medium">{order.banking_orders[0].bank_name || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Transaction Type</span>
                      <span className="font-medium">{order.banking_orders[0].transaction_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Amount</span>
                      <span className="font-medium">{formatCurrency(parseFloat(order.banking_orders[0].amount), 'KES')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Scheduled Date</span>
                      <span className="font-medium">{formatDate(order.banking_orders[0].scheduled_date)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {order.banking_orders[0].recipient_name && (
                      <div>
                        <span className="text-gray-600 block">Recipient</span>
                        <span className="font-medium">{order.banking_orders[0].recipient_name}</span>
                      </div>
                    )}
                    {order.banking_orders[0].recipient_account && (
                      <div>
                        <span className="text-gray-600 block">Recipient Account</span>
                        <span className="font-medium">{order.banking_orders[0].recipient_account}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 block">Transaction Details</span>
                      <p className="font-medium bg-gray-50 p-3 rounded">{order.banking_orders[0].transaction_details}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Order Items Table */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${item.price?.toFixed(2) || "0.00"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${(item.quantity * (item.price || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Shopping Items */}
          {Array.isArray(order.shopping_items) && order.shopping_items.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items to Pickup & Deliver</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.shopping_items.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium mb-2">{item.name}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Quantity: {item.quantity}</div>
                        {item.description && <div>Description: {item.description}</div>}
                        {item.weight && <div>Weight: {item.weight} kg</div>}
                        {item.size && <div>Size: {item.size}</div>}
                        {('price' in item && item.price) && (
                          <div className="font-medium text-gray-900">KSh {parseFloat(item.price).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments and Images */}
            {(() => {
              // Combine attachments from API and order.images
              const allImages = [];
              
              // Add images from order.images if available
              if (order.images && Array.isArray(order.images) && order.images.length > 0) {
                order.images.forEach((img, idx) => {
                  if (img) {
                    allImages.push({
                      id: img.id || `img-${idx}`,
                      signed_url: img.image_url || img.url || img.signed_url || img,
                      file_name: img.file_name || img.name || `Image ${idx + 1}`,
                      content_type: img.content_type || 'image/jpeg'
                    });
                  }
                });
              }
              
              // Add attachments from API
              if (attachments && attachments.length > 0) {
                attachments.forEach(att => {
                  // Avoid duplicates
                  if (!allImages.find(img => img.id === att.id || img.signed_url === att.signed_url)) {
                    allImages.push(att);
                  }
                });
              }
              
              if (allImages.length === 0) return null;
              
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Images & Attachments</h2>
                  {attachmentsError && (
                    <div className="bg-red-100 text-red-800 p-3 rounded mb-3">{attachmentsError}</div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {allImages.map((att, idx) => (
                      <div key={att.id || idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        {String(att.content_type || '').startsWith('image') && att.signed_url ? (
                          <a href={att.signed_url} target="_blank" rel="noreferrer">
                            <img src={att.signed_url} alt={att.file_name} className="w-full h-32 object-cover" />
                            <div className="p-2">
                              <p className="text-xs truncate" title={att.file_name}>{att.file_name}</p>
                            </div>
                          </a>
                        ) : (
                          <div className="p-3">
                            <p className="text-sm font-medium truncate" title={att.file_name}>{att.file_name}</p>
                            {att.signed_url && (
                              <a className="text-blue-600 text-sm" href={att.signed_url} target="_blank" rel="noreferrer">Open</a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* Order Tracking */}
          {order.tracking_number && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="mb-2"><span className="font-medium">Tracking Number:</span> {order.tracking_number}</p>
                    <p className="mb-4"><span className="font-medium">Estimated Delivery:</span> {order.estimated_delivery}</p>
                  </div>
                  <div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">Order Placed</div>
                        <div className="text-sm text-gray-600">In Transit</div>
                        <div className="text-sm text-gray-600">Delivered</div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: order.status === 'completed' ? '100%' : order.status === 'in_progress' ? '50%' : '25%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium">{formatOrderId(order.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${order.status === 'completed' ? 'text-green-600' : order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>
                    {displayStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{getOrderType(order)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="font-medium">{order.payment_method || 'Cash'}</span>
                </div>
                <div className="border-t border-gray-200 my-3 pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(getOrderPrice(order)), 'KES')}</span>
                  </div>
                </div>
              </div>
            </div>

          {/* Payment Status */}
          {order.payment_method && order.payment_method !== 'cash' && order.status !== 'completed' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
                <PaymentStatusIndicator 
                  orderId={order.id}
                  onStatusChange={(paymentStatus, orderStatus) => {
                    console.log('Payment status changed:', paymentStatus, orderStatus);
                  }}
                  showDetails={true}
                />
              </div>
            )}

          {/* Schedule Information */}
          {(order.scheduled_date || order.scheduled_time) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
                <div className="space-y-3">
                  {order.scheduled_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.scheduled_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time</span>
                      <span className="font-medium">{order.scheduled_time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Pricing Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Price</span>
                  <span className="font-medium">{formatCurrency(parseFloat(getOrderPrice(order)), 'KES')}</span>
                </div>
                {typeof order.assistant_items_total !== 'undefined' && order.assistant_items_total !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assistant Items Total</span>
                    <span className="font-medium">{formatCurrency(parseFloat(order.assistant_items_total || 0), 'KES')}</span>
                  </div>
                )}
                {(order.distance || order.estimated_duration) && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    {order.distance && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Distance</span>
                        <span className="font-medium">{order.distance} km</span>
                      </div>
                    )}
                    {order.estimated_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Duration</span>
                        <span className="font-medium">{order.estimated_duration} mins</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          {/* Notes */}
          {order.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{order.description}</p>
              </div>
            )}

            {/* Customer Information */}
            {(() => {
              // Get customer from various possible fields (client, user, customer)
              const customer = order.client || order.user || order.customer;
              const hasCustomerInfo = customer || order.contact_number || order.recipient_name;
              
              if (!hasCustomerInfo) return null;
              
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                  <div className="space-y-3">
                    {customer && (
                      <>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          <span className="font-medium">{customer.name || customer.username || customer.first_name || 'Customer'}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span className="font-medium text-sm">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span className="font-medium">{customer.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    {order.contact_number && (!customer || order.contact_number !== customer.phone) && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <span className="font-medium">Contact: {order.contact_number}</span>
                      </div>
                    )}
                    {order.recipient_name && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span className="font-medium text-sm">Recipient: {order.recipient_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Assistant Information */}
          {order.assistant && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assistant Information</h2>
                <div className="flex items-center mb-4">
                  {order.assistant.avatar_url ? (
                    <img 
                      className="h-10 w-10 rounded-full mr-3" 
                      src={order.assistant.avatar_url} 
                      alt={order.assistant.name} 
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{order.assistant.name}</p>
                    <p className="text-sm text-gray-600">Assistant</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.assistant.email && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      <span className="font-medium text-sm">{order.assistant.email}</span>
                    </div>
                  )}
                  {order.assistant.phone && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      <span className="font-medium">{order.assistant.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Rate Your Experience</h2>
                <p className="text-sm text-gray-600 mt-1">Please rate your experience with this order and provide any feedback.</p>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-5">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-3">Your Rating</label>
                  <div className="flex">
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <label key={index} className="cursor-pointer">
                          <input 
                            type="radio" 
                            name="rating" 
                            className="hidden" 
                            value={ratingValue} 
                            onClick={() => setRating(ratingValue)} 
                          />
                          <FaStar 
                            className="w-8 h-8 mr-1" 
                            color={ratingValue <= (hover || rating) ? "#FBBF24" : "#D1D5DB"} 
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-gray-700 font-medium mb-3">Your Comments (Optional)</label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience with this order..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || rating === 0}
                  className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${
                    submittingReview || rating === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
              </form>
          </div>
          )}

          {/* Review Success Message */}
          {reviewSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    Thank you for your feedback! Your review has been submitted successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Confirmation Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Cancel Order</h2>
              <p className="mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  No, Keep Order
                </button>
                <button 
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderDetails;