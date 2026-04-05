import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FaMapMarkerAlt, FaStar, FaExclamationTriangle, FaShoppingBag } from 'react-icons/fa';
import useOrderNotifications from '../hooks/useOrderNotifications';
import config from '../config';
import { ordersApi, apiEndpoints } from '../services/api';

// API base URL from config
const API_BASE_URL = config.API_BASE_URL;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Function to fetch orders
  const fetchOrdersData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      let result = { success: false, data: [] };
      
      if (user?.user_type === 'assistant') {
        result = await ordersApi.getAssistantOrders();
      } else if (user?.user_type === 'handler' || user?.user_type === 'admin') {
        result = await ordersApi.getAll();
      } else {
        result = await ordersApi.getUserOrders();
      }

      let processedOrders = [];
      if (result.success) {
        if (Array.isArray(result.data)) {
          processedOrders = result.data;
        } else if (result.data?.results && Array.isArray(result.data.results)) {
          processedOrders = result.data.results;
        } else if (result.data?.orders && Array.isArray(result.data.orders)) {
          processedOrders = result.data.orders;
        }
      }

      const sortedOrders = sortOrdersByPriority(processedOrders);
      setOrders(sortedOrders);
      console.log('[OrdersPage] Orders fetched:', sortedOrders.length);
    } catch (err) {
      console.error('[OrdersPage] Error fetching orders:', err.message);
    }
  };

  // Function to sort orders by status priority and creation date
  const sortOrdersByPriority = (ordersArray) => {
    const statusPriority = {
      'pending': 1,
      'in_progress': 2,
      'in progress': 2,
      'assigned': 2,
      'completed': 3,
      'cancelled': 4
    };

    return ordersArray.sort((a, b) => {
      // First sort by status priority
      const aPriority = statusPriority[a.status?.toLowerCase()] || 5;
      const bPriority = statusPriority[b.status?.toLowerCase()] || 5;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same status, sort by creation date (newest first)
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    });
  };

  // Function to filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') {
      return orders;
    }
    
    return orders.filter(order => {
      const status = order.status?.toLowerCase();
      switch (activeTab) {
        case 'pending':
          return status === 'pending';
        case 'in_progress':
          return ['in_progress', 'in progress', 'assigned'].includes(status);
        case 'completed':
          return status === 'completed';
        case 'cancelled':
          return status === 'cancelled';
        default:
          return true;
      }
    });
  };

  // Get counts for each tab
  const getTabCounts = () => {
    const counts = {
      all: orders.length,
      pending: orders.filter(order => order.status?.toLowerCase() === 'pending').length,
      in_progress: orders.filter(order => ['in_progress', 'in progress', 'assigned'].includes(order.status?.toLowerCase())).length,
      completed: orders.filter(order => order.status?.toLowerCase() === 'completed').length,
      cancelled: orders.filter(order => order.status?.toLowerCase() === 'cancelled').length,
    };
    return counts;
  };

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const axiosAuth = axios.create({
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const userResponse = await axiosAuth.get('accounts/user/');
        setUser(userResponse.data);
        console.log('[OrdersPage] User data fetched:', userResponse.data);
        localStorage.setItem('userData', JSON.stringify(userResponse.data));
        localStorage.setItem('userType', userResponse.data?.user_type);
        
      } catch (err) {
        console.error('[OrdersPage] Error fetching user data:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndOrders().then(() => fetchOrdersData());
  }, []);

  // Hook disabled temporarily - frontend polling removed for handler notifications
  // useOrderNotifications(orders, fetchOrdersData, {
  //   enabled: true,
  //   pollInterval: 30000,
  //   showBrowserNotification: true,
  //   notificationTitle: 'New Order Received',
  //   userRole: user?.user_type
  // });

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    // Convert snake_case to Title Case
    if (!status) return 'Unknown';
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleConfirmCompletion = async (orderId) => {
    try {
      const result = await ordersApi.updateStatus(orderId, 'completed');
      
      if (result.success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'completed' } : order
        ));
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Completed', {
            body: `Order #${orderId} has been marked as completed.`,
            icon: '/logo192.png'
          });
        }
        
        alert('Order has been marked as completed!');
      } else {
        alert('Failed to update order status. ' + (result.message || 'Please try again.'));
      }
      
    } catch (err) {
      console.error('Error confirming order completion:', err);
      alert('Failed to update order status. Please try again.');
    }
  };
  
  // Handle initiating payment for an order
  const handleInitiatePayment = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Get user info from local storage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // Format phone number for M-Pesa
      let phoneNumber = userInfo.phone_number || '';
      
      // Format phone number if needed (ensure it starts with 254)
      if (phoneNumber) {
        // Remove leading 0 if present
        if (phoneNumber.startsWith('0')) {
          phoneNumber = phoneNumber.substring(1);
        }
        // Add country code if not present
        if (!phoneNumber.startsWith('254')) {
          phoneNumber = '254' + phoneNumber;
        }
      }
      
      console.log(`Initiating payment for order ${orderId} with phone number ${phoneNumber}`);
      
      // Create a payment order via API only if phone number exists
      let response = null;
      if (phoneNumber) {
        response = await axios.post(
          `orders/payments/initiate/`,
          { 
            order: orderId, 
            payment_method: 'mpesa',
            phone_number: phoneNumber
          },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log('Payment initiated:', response.data);
      }
      
      // Redirect to payment page with the payment ID if available, else fallback
      if (response && response.data && response.data.payment_id) {
        window.location.href = `/payment/${response.data.payment_id}`;
      } else {
        window.location.href = `/payment?orderId=${orderId}`;
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      console.error('Error details:', err.response?.data);
      
      // Show a more detailed error message
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = `Error: ${err.response.data.error}`;
        } else if (err.response.data.phone_number) {
          errorMessage = `Phone number error: ${err.response.data.phone_number}`;
        } else if (err.response.data.order) {
          errorMessage = `Order error: ${err.response.data.order}`;
        } else if (err.response.data.payment_method) {
          errorMessage = `Payment method error: ${err.response.data.payment_method}`;
        } else {
          // Try to extract error message from the response data
          errorMessage = `API Error: ${JSON.stringify(err.response.data)}`;
        }
      }
      
      alert(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded transition duration-200">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">View and manage all your orders</p>
        </div>
        
        {/* Order Status Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { key: 'all', label: 'All', icon: '📋' },
                { key: 'pending', label: 'Pending', icon: '⏳' },
                { key: 'in_progress', label: 'Active', icon: '🔄' },
                { key: 'completed', label: 'Completed', icon: '✅' },
                { key: 'cancelled', label: 'Cancelled', icon: '❌' }
              ].map((tab) => {
                const counts = getTabCounts();
                const count = counts[tab.key] || 0;
                const isActive = activeTab === tab.key;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-shrink-0 py-3 px-4 text-center font-medium transition-colors duration-200 border-b-2 ${
                      isActive 
                        ? 'text-blue-600 border-blue-600 bg-blue-50' 
                        : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-base">{tab.icon}</span>
                      <span className="text-sm font-medium">{tab.label}</span>
                      {count > 0 && (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="space-y-4">
          {(() => {
            const filteredOrders = getFilteredOrders();
            return filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <FaShoppingBag className="w-4 h-4 text-gray-400 mr-2" />
                          <h3 className="font-semibold text-gray-900">
                            Order #{typeof order.id === 'string' ? order.id.substring(0, 8) : order.id}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.order_type?.name || order.service_type || 'Standard Order'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    
                    {/* Order Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Date:</span>
                        <span>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                      </div>
                      {order.assistant && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">Assistant:</span>
                          <span>{order.assistant.name || order.assistant.email || 'Assigned'}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="font-semibold text-gray-900 mr-2">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          KES {parseFloat(order.price || order.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {/* Show rating if available */}
                      {order.review && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 mr-2">Rating:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <FaStar 
                                key={star} 
                                className={star <= order.review.rating ? "text-yellow-400 w-3.5 h-3.5" : "text-gray-300 w-3.5 h-3.5"} 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Link 
                        to={`/orders/${order.id}`} 
                        className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                      >
                        View Details
                      </Link>
                      
                      {/* Track Order Button - only for in-progress orders */}
                      {(order.status === 'in_progress' || order.status === 'In Progress' || order.status === 'assigned') && order.assistant && (
                        <Link 
                          to={`/orders/${order.id}/track`}
                          className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          <FaMapMarkerAlt className="mr-1.5" />
                          Track
                        </Link>
                      )}
                      
                      {/* Report Issue Button - only for non-completed orders */}
                      {['in_progress', 'In Progress', 'assigned', 'pending'].includes(order.status) && order.status !== 'completed' && (
                        <Link 
                          to={`/report-issue/${order.id}`}
                          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          <FaExclamationTriangle className="mr-1.5" />
                          Report
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FaShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {activeTab === 'all' ? 'No Orders Yet' : `No ${activeTab.replace('_', ' ')} Orders`}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {activeTab === 'all' 
                      ? "You haven't placed any orders yet. Start by creating your first order!" 
                      : `No orders found with ${activeTab.replace('_', ' ')} status.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Link 
                      to="/dashboard" 
                      className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-6 rounded-md font-medium transition-colors"
                    >
                      <FaShoppingBag className="mr-2" />
                      Browse Services
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
