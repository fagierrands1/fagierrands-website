import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import Header from '../Common/Header';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import useOrderNotifications from '../../hooks/useOrderNotifications';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Set up headers with authentication token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Determine API endpoint based on filter
      let endpoint = '/api/orders/';
      
      if (filter !== 'all') {
        // Convert UI filter status to backend status
        const statusMap = {
          'Pending': 'pending',
          'In Progress': 'in_progress',
          'Completed': 'completed',
          'Cancelled': 'cancelled'
        };
        
        endpoint += `?status=${statusMap[filter] || filter.toLowerCase()}`;
      }
      
      const response = await axios.get(endpoint, config);
      
      // Process and normalize the orders data
      let processedOrders = [];
      
      if (Array.isArray(response.data)) {
        processedOrders = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        processedOrders = response.data.results;
      } else if (response.data?.orders && Array.isArray(response.data.orders)) {
        processedOrders = response.data.orders;
      } else {
        console.error('Unexpected orders data format:', response.data);
        processedOrders = [];
      }
      
      // Sort orders by status priority
      const sortedOrders = sortOrdersByPriority(processedOrders);
      setOrders(sortedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
      if (err.response && err.response.status === 401) {
        // Unauthorized - redirect to login
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Enable order notifications (only when viewing all orders)
  useOrderNotifications(
    filter === 'all' ? orders : [], // Only notify for all orders view
    fetchOrders,
    {
      enabled: true,
      pollInterval: 30000, // Poll every 30 seconds
      showBrowserNotification: true,
      notificationTitle: 'New Order Received',
      userRole: user?.user_type || 'client'
    }
  );

  // Function to format status for display and convert backend status to UI status
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
    // Check if it's a regular order with order_type
    if (order.order_type && order.order_type.name) {
      return order.order_type.name;
    }
    
    // Check if it's a handyman order
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      return 'Home-Maintenance Service';
    }
    
    // Check if it has a service_type property (some handyman orders)
    if (order.service_type) {
      if (typeof order.service_type === 'string') {
        return order.service_type;
      } else if (order.service_type.name) {
        return order.service_type.name;
      }
    }
    
    // Check if it's a banking order
    if (order.banking_orders && order.banking_orders.length > 0) {
      const bankingOrder = order.banking_orders[0];
      return `Banking - ${bankingOrder.transaction_type || 'Transaction'}`;
    }
    
    // Check if it has a title that indicates the type
    if (order.title) {
      if (order.title.includes('Handyman')) {
        return 'Home-Maintenance Service';
      } else if (order.title.includes('Banking')) {
        return 'Banking Service';
      }
      return order.title;
    }
    
    // Default fallback
    return 'General Service';
  };
  
  // Function to get the price from different order structures
  const getOrderPrice = (order) => {
    // Check standard price fields
    if (order.price) {
      return parseFloat(order.price).toFixed(2);
    }
    
    if (order.total_amount) {
      return parseFloat(order.total_amount).toFixed(2);
    }
    
    // Check if it's a handyman order
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      const handymanOrder = order.handyman_orders[0];
      if (handymanOrder.price) {
        return parseFloat(handymanOrder.price).toFixed(2);
      }
    }
    
    // Check if it's a banking order
    if (order.banking_orders && order.banking_orders.length > 0) {
      const bankingOrder = order.banking_orders[0];
      if (bankingOrder.amount) {
        return parseFloat(bankingOrder.amount).toFixed(2);
      }
    }
    
    // Default fallback
    return '0.00';
  };
  
  // Function to get the assistant from different order structures
  const getOrderAssistant = (order) => {
    // Check standard assistant field
    let assistant = null;
    
    // Check main order assistant
    if (order.assistant) {
      assistant = order.assistant;
    }
    
    // Check if it's a handyman order
    if (!assistant && order.handyman_orders && order.handyman_orders.length > 0) {
      const handymanOrder = order.handyman_orders[0];
      if (handymanOrder.assistant) {
        assistant = handymanOrder.assistant;
      }
    }
    
    // Check if it's a banking order with a handler
    if (!assistant && order.banking_orders && order.banking_orders.length > 0) {
      const bankingOrder = order.banking_orders[0];
      if (bankingOrder.handler) {
        assistant = bankingOrder.handler;
      }
    }
    
    // Render assistant info if available
    if (assistant) {
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            {assistant.avatar_url ? (
              <img 
                className="h-8 w-8 rounded-full" 
                src={assistant.avatar_url} 
                alt={assistant.name || assistant.username} 
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{assistant.name || assistant.username}</p>
          </div>
        </div>
      );
    }
    
    // Default fallback
    return <span className="text-gray-500">Not assigned</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <Link 
            to="/create-order" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200"
          >
            Create New Order
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'All Orders', icon: '📋' },
              { key: 'Pending', label: 'Pending', icon: '⏳' },
              { key: 'In Progress', label: 'In Progress', icon: '🔄' },
              { key: 'Completed', label: 'Completed', icon: '✅' },
              { key: 'Cancelled', label: 'Cancelled', icon: '❌' }
            ].map((tab) => {
              const count = tab.key === 'all' 
                ? orders.length 
                : orders.filter(order => {
                    const status = formatStatus(order.status);
                    return status === tab.key;
                  }).length;
              
              const isActive = filter === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-sm">{tab.key === 'In Progress' ? 'Progress' : tab.label.split(' ')[0]}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
              <Link 
                to="/create-order" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200"
              >
                Create Your First Order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assistant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{formatOrderId(order.id)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOrderType(order)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(getOrderPrice(order), 'KES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOrderAssistant(order)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/orders/${order.id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;

