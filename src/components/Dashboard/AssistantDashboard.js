import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi, usersApi, dashboardApi } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MapComponent from '../Common/MapComponent';
import VerificationForm from './VerificationForm';
import HandymanQuoteForm from './HandymanQuoteForm';
import fileUploadService from '../../services/fileUploadService';
import { FaTools, FaMoneyBillWave, FaFileAlt, FaUpload, FaImage, FaCheckCircle, FaPlay, FaStop } from 'react-icons/fa';

const AssistantDashboard = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [stats, setStats] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [orderAttachments, setOrderAttachments] = useState({});
  const [loadingAttachments, setLoadingAttachments] = useState({});
  const [processingOrders, setProcessingOrders] = useState(new Set());
  const [shoppingTotals, setShoppingTotals] = useState({});
  const [spDashboard, setSpDashboard] = useState(null);
  const { user, isAuthenticated, isAssistant } = useAuth();
  const navigate = useNavigate();

  // Function to fetch orders directly from the backend
  const fetchOrdersDirectly = async () => {
    try {
      console.log("Fetching orders directly from backend...");
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        console.error("No authentication token found");
        return [];
      }
      
      // Create a direct axios request with auth token
      const response = await api.get('/api/orders/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Direct orders response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching orders directly:", error);
      return [];
    }
  };

  const loadOrders = useCallback(async () => {
    if (!hasInitialLoaded) setIsLoading(true);
    setError('');

    try {
      // Get orders assigned to the current assistant
      const response = await ordersApi.getAssistantOrders();
      console.log("Assistant orders response:", response);
      
      // Also try to fetch all orders to see if we can find any that should be assigned to this assistant
      let allOrders = [];
      try {
        const allOrdersResponse = await api.get('/api/orders/');
        console.log("All orders response:", allOrdersResponse.data);
        
        if (allOrdersResponse.data && Array.isArray(allOrdersResponse.data)) {
          allOrders = allOrdersResponse.data;
        } else if (allOrdersResponse.data && allOrdersResponse.data.results && Array.isArray(allOrdersResponse.data.results)) {
          allOrders = allOrdersResponse.data.results;
        }
        
        // Check if there are any orders assigned to this assistant that weren't returned by the assistant endpoint
        const assignedOrders = allOrders.filter(order => {
          const userId = String(user?.id);
          return (
            (order.assistant && String(order.assistant.id) === userId) ||
            (order.assistant_id !== undefined && String(order.assistant_id) === userId) ||
            (order.assistant !== undefined && typeof order.assistant !== 'object' && String(order.assistant) === userId)
          );
        });
        
        console.log(`Found ${assignedOrders.length} orders assigned to this assistant in the all orders endpoint`);
        console.log("Assigned orders from all orders endpoint:", assignedOrders);
      } catch (allOrdersError) {
        console.error("Error fetching all orders:", allOrdersError);
      }
      
      // Handle different response formats
      let assistantOrders = [];
      if (Array.isArray(response)) {
        assistantOrders = response;
      } else if (response?.data && Array.isArray(response.data)) {
        assistantOrders = response.data;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        assistantOrders = response.data.results;
      } else if (response?.success && response?.data && Array.isArray(response.data)) {
        assistantOrders = response.data;
      }
      
      console.log("Parsed assistant orders:", assistantOrders);
      
      // Merge orders from both endpoints
      const mergedOrders = [...assistantOrders];
      
      // Add orders from the all orders endpoint that aren't already in the assistant orders
      if (allOrders.length > 0) {
        const assistantOrderIds = new Set(assistantOrders.map(order => order.id));
        
        allOrders.forEach(order => {
          // Only add if not already in the list
          if (!assistantOrderIds.has(order.id)) {
            const userId = String(user?.id);
            const isAssignedToUser = (
              (order.assistant && String(order.assistant.id) === userId) ||
              (order.assistant_id !== undefined && String(order.assistant_id) === userId) ||
              (order.assistant !== undefined && typeof order.assistant !== 'object' && String(order.assistant) === userId)
            );
            
            if (isAssignedToUser) {
              console.log(`Adding order ${order.id} from all orders endpoint that was missing from assistant orders`);
              mergedOrders.push(order);
            }
          }
        });
      }
      
      console.log(`Total merged orders: ${mergedOrders.length}`);

      if (mergedOrders.length > 0) {
        // Log each order to debug
        mergedOrders.forEach((order, index) => {
          console.log(`Order ${index + 1} (ID: ${order.id}):`);
          console.log(`- Status: ${order.status}`);
          console.log(`- Assistant: ${JSON.stringify(order.assistant)}`);
          console.log(`- Assistant ID: ${order.assistant_id}`);
          
          // Check if this order would be considered assigned to the current user
          const isAssignedToUser = (
            (order.assistant && order.assistant.id === user?.id) ||
            (order.assistant_id === user?.id) ||
            (typeof order.assistant === 'number' && order.assistant === user?.id)
          );
          
          console.log(`- Assigned to current user (${user?.id})? ${isAssignedToUser}`);
        });

        // More flexible filtering to catch all possible assigned orders
        const active = mergedOrders.filter(order => {
          // Convert IDs to strings for comparison to avoid type issues
          const userId = String(user?.id);
          
          // Check all possible ways an order could be assigned to this assistant
          const isAssigned = (
            // Check if assistant is an object with id
            (order.assistant && String(order.assistant.id) === userId) ||
            // Check if assistant_id exists
            (order.assistant_id !== undefined && String(order.assistant_id) === userId) ||
            // Check if assistant is a primitive value
            (order.assistant !== undefined && typeof order.assistant !== 'object' && String(order.assistant) === userId)
          );
          
          // Check if status is active - be more inclusive with statuses
          const isActive = ['pending', 'assigned', 'in_progress', 'accepted'].includes(order.status);
          
          // Log the decision for each order
          if (isAssigned) {
            console.log(`Order ${order.id} is assigned to user ${userId}`);
            if (!isActive) {
              console.log(`Order ${order.id} is not active (status: ${order.status})`);
            }
          }
          
          return isAssigned && isActive;
        });

        // For available orders, we'll look for pending orders that aren't assigned
        const available = mergedOrders.filter(order => {
          return order.status === 'pending' && 
                 !order.assistant && 
                 !order.assistant_id;
        });
        
        console.log(`Found ${active.length} active orders and ${available.length} available orders`);
        
        setActiveOrders(active);
        setAvailableOrders(available);
      } else {
        console.log("No orders found or invalid response format");
        setActiveOrders([]);
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setError(error.response?.data?.message || error.message || 'Failed to load orders');
      setActiveOrders([]);
      setAvailableOrders([]);
    } finally {
      setIsLoading(false);
      setHasInitialLoaded(true);
    }
  }, [user?.id, hasInitialLoaded]);

  const checkVerificationStatus = useCallback(async () => {
    try {
      const response = await usersApi.getVerificationStatus();
      setVerificationStatus(response?.data?.status || 'unverified');
    } catch (error) {
      console.error("Error checking verification status:", error);
      setVerificationStatus('unverified');
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await dashboardApi.getAssistantStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  const loadServiceProviderDashboard = useCallback(async () => {
    try {
      const response = await api.get('/orders/service-provider/dashboard/');
      if (response.data) {
        setSpDashboard(response.data);
      }
    } catch (error) {
      console.error("Error loading service provider dashboard:", error);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      // Check if availability endpoint exists
      const response = await api.get('/accounts/assistant/availability/');
      if (response.data) {
        setIsOnline(response.data.is_online || false);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  }, []);

  const toggleAvailability = async () => {
    try {
      const response = await api.patch('/accounts/assistant/availability/', { is_online: !isOnline });
      if (response.data) {
        setIsOnline(response.data.is_online || false);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      setError('Failed to update availability');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      if (!isAssistant) {
        navigate('/dashboard');
        return;
      }

      await loadOrders();
      await checkVerificationStatus();
      await loadStats();
      await loadAvailability();
      await loadServiceProviderDashboard();
    };

    init();

    const intervalId = setInterval(() => {
      if (isMounted) loadOrders();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, isAssistant, loadOrders, checkVerificationStatus, navigate]);

  // Function to check for missing orders by ID
  const checkForMissingOrders = async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return;
    
    try {
      console.log(`Checking for ${orderIds.length} potentially missing orders...`);
      
      // Create a set of existing order IDs
      const existingIds = new Set(activeOrders.map(o => o.id));
      
      // Track which orders we need to fetch
      const missingOrderIds = orderIds.filter(id => !existingIds.has(id));
      
      if (missingOrderIds.length === 0) {
        console.log("No missing orders to fetch");
        return;
      }
      
      console.log(`Found ${missingOrderIds.length} missing orders to fetch`);
      
      // Fetch each missing order
      const newOrders = [];
      for (const orderId of missingOrderIds) {
        try {
          const response = await api.get(`/api/orders/${orderId}/`);
          if (response.data) {
            console.log(`Successfully fetched missing order ${orderId}:`, response.data);
            newOrders.push(response.data);
          }
        } catch (err) {
          console.error(`Error fetching order ${orderId}:`, err);
        }
      }
      
      if (newOrders.length > 0) {
        console.log(`Adding ${newOrders.length} missing orders to the display`);
        setActiveOrders(prev => [...prev, ...newOrders]);
      }
    } catch (error) {
      console.error("Error checking for missing orders:", error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      setError('');
      // Use the assignOrder method from the API
      const response = await ordersApi.assignOrder(orderId, user.id);
      console.log("Order assignment response:", response);

      // Update the local state
      const updatedAvailable = availableOrders.filter(order => order.id !== orderId);
      const acceptedOrder = availableOrders.find(order => order.id === orderId);

      if (acceptedOrder) {
        // Update the order with the new status and assistant
        acceptedOrder.assistant = user;
        acceptedOrder.assistant_id = user.id;
        acceptedOrder.status = 'assigned';

        setAvailableOrders(updatedAvailable);
        setActiveOrders([...activeOrders, acceptedOrder]);
      }
      
      // Reload orders, stats, and quotes to get the updated data from the server
      await loadOrders();
      await loadStats();
      await loadServiceProviderDashboard();
    } catch (error) {
      console.error("Error accepting order:", error);
      setError(error.response?.data?.message || error.message || 'Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId, status, extra = {}) => {
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      setError('');
      
      const response = await ordersApi.updateStatus(orderId, status);
      if (response.success) {
        // If status is in_progress and we have extra data (like shopping total), update the order
        if (extra && Object.keys(extra).length > 0) {
          await ordersApi.update(orderId, extra);
        }
        
        // Reload orders, stats, and quotes
        await loadOrders();
        await loadStats();
        await loadServiceProviderDashboard();
      } else {
        setError(response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(error.response?.data?.message || error.message || 'Failed to update order status');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
        // Load attachments when expanding
        loadOrderAttachments(orderId);
      }
      return newSet;
    });
  };

  const loadOrderAttachments = async (orderId) => {
    if (loadingAttachments[orderId] || orderAttachments[orderId]) return;
    
    setLoadingAttachments(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fileUploadService.getOrderAttachments(orderId);
      if (response.success) {
        const attachments = Array.isArray(response.data?.results) 
          ? response.data.results 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        setOrderAttachments(prev => ({ ...prev, [orderId]: attachments }));
      }
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setLoadingAttachments(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleFileUpload = async (orderId, file) => {
    try {
      const validation = fileUploadService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setLoadingAttachments(prev => ({ ...prev, [orderId]: true }));
      const response = await fileUploadService.uploadOrderAttachment(orderId, file);
      
      if (response.success) {
        // Reload attachments
        await loadOrderAttachments(orderId);
        // Reload orders to get updated data
        await loadOrders();
      } else {
        setError(response.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError('Failed to upload file');
    } finally {
      setLoadingAttachments(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const isShoppingOrder = (order) => {
    return order.order_type?.name?.toLowerCase().includes('shop') || 
           order.order_type?.name?.toLowerCase().includes('shopping');
  };
  
  // Function to handle opening the quote form modal
  const handleOpenQuoteForm = (order) => {
    setSelectedOrder(order);
    setShowQuoteModal(true);
  };
  
  // Function to handle closing the quote form modal
  const handleCloseQuoteForm = () => {
    setShowQuoteModal(false);
    setSelectedOrder(null);
  };
  
  // Function to handle quote submission success
  const handleQuoteSubmitted = async () => {
    setShowQuoteModal(false);
    setSelectedOrder(null);
    // Reload orders, stats, and quotes to get the updated data
    await loadOrders();
    await loadStats();
    await loadServiceProviderDashboard();
  };
  
  // Function to check if an order is a handyman order
  const isHandymanOrder = (order) => {
    // Check if it has handyman_orders array
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      return true;
    }
    
    // Check if the order type name contains "handyman"
    if (order.order_type && order.order_type.name && 
        order.order_type.name.toLowerCase().includes('handyman')) {
      return true;
    }
    
    // Check if the service_type name contains "handyman"
    if (order.service_type && order.service_type.name && 
        order.service_type.name.toLowerCase().includes('handyman')) {
      return true;
    }
    
    return false;
  };
  
  // Function to check if a handyman order needs a quote
  const needsQuote = (order) => {
    if (!isHandymanOrder(order)) {
      return false;
    }
    
    // Check if the order has handyman_orders and if the service_quote is not set
    if (order.handyman_orders && order.handyman_orders.length > 0) {
      const handymanOrder = order.handyman_orders[0];
      return !handymanOrder.service_quote || handymanOrder.service_quote <= 0;
    }
    
    return false;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning text-white ml-2">
            <i className="fas fa-clock mr-1"></i> Pending
          </span>
        );
      case 'assigned': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info text-white ml-2">
            <i className="fas fa-user-check mr-1"></i> Assigned
          </span>
        );
      case 'in_progress': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info text-white ml-2">
            <i className="fas fa-spinner mr-1"></i> In Progress
          </span>
        );
      case 'completed': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white ml-2">
            <i className="fas fa-check-circle mr-1"></i> Completed
          </span>
        );
      case 'cancelled': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger text-white ml-2">
            <i className="fas fa-times-circle mr-1"></i> Cancelled
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white ml-2">
            <i className="fas fa-question-circle mr-1"></i> Unknown
          </span>
        );
    }
  };

  const handleVerificationClick = () => {
    if (verificationStatus === 'unverified') {
      setShowVerificationModal(true);
    }
  };

  const handleVerificationSubmit = async (formData) => {
    try {
      await usersApi.updateProfile({
        ...formData,
        verification_requested: true
      });
      setVerificationStatus('pending');
      setShowVerificationModal(false);
    } catch (error) {
      console.error("Error submitting verification:", error);
      setError(error.response?.data?.message || error.message || 'Failed to submit verification');
    }
  };

  const renderVerificationButton = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <button disabled className="bg-success text-white font-medium py-2 px-5 rounded-full flex items-center opacity-90 cursor-not-allowed">
            <i className="fas fa-check-circle mr-2"></i> Verified Assistant
          </button>
        );
      case 'pending':
        return (
          <button disabled className="bg-warning text-white font-medium py-2 px-5 rounded-full flex items-center opacity-90 cursor-not-allowed">
            <i className="fas fa-clock mr-2"></i> Verification Pending
          </button>
        );
      default:
        return (
          <Link to="/verify-assistant">
            <button className="bg-secondary hover:bg-secondary-dark text-white font-medium py-2 px-5 rounded-full flex items-center transition duration-300">
              <i className="fas fa-user-check mr-2"></i> Start Verification
            </button>
          </Link>
        );
    }
  };

  if (isLoading && !hasInitialLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-background-light">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-background to-background-light min-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-8 bg-white bg-opacity-90 p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center m-0">
          <i className="fas fa-tachometer-alt text-primary mr-3"></i> Assistant Dashboard
        </h1>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            onClick={async () => {
              setIsLoading(true);
              await Promise.all([
                loadOrders(),
                loadStats(),
                loadServiceProviderDashboard(),
                checkVerificationStatus()
              ]);
              setIsLoading(false);
            }}
            className="flex items-center px-4 py-2 rounded-lg font-medium transition duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700"
            title="Refresh Dashboard"
          >
            <i className="fas fa-sync-alt mr-2"></i> Refresh
          </button>
          
          {/* Availability Toggle */}
          <button
            onClick={toggleAvailability}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition duration-200 ${
              isOnline
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {isOnline ? (
              <>
                <FaPlay className="mr-2" /> Online
              </>
            ) : (
              <>
                <FaStop className="mr-2" /> Offline
              </>
            )}
          </button>
          <div>{renderVerificationButton()}</div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.total_orders || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <i className="fas fa-clipboard-list text-blue-500 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.completed_orders || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <i className="fas fa-check-circle text-green-500 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.in_progress_orders || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <i className="fas fa-spinner text-yellow-500 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Assigned</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.assigned_orders || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <i className="fas fa-user-check text-orange-500 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  KSh {stats.total_earnings ? parseFloat(stats.total_earnings).toLocaleString() : '0'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <i className="fas fa-money-bill-wave text-purple-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Rate Card */}
      {stats && (
        <div className="bg-white rounded-xl p-6 shadow-md mb-8 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.completion_rate ? `${parseFloat(stats.completion_rate).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="bg-indigo-100 p-4 rounded-full">
              <i className="fas fa-star text-indigo-500 text-2xl"></i>
            </div>
          </div>
        </div>
      )}

      {/* Quotes Section */}
      <div className="bg-white rounded-xl p-6 shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-l-4 border-primary pl-3">
          <i className="fas fa-file-invoice-dollar text-primary mr-3"></i> Quotes
        </h2>
        {spDashboard ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Orders Needing Quotes</h3>
              {spDashboard.orders_needing_quotes && spDashboard.orders_needing_quotes.length > 0 ? (
                <div className="space-y-3">
                  {spDashboard.orders_needing_quotes.map((order) => (
                    <div key={order.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">Order #{order.id}</span>
                        <button
                          onClick={() => handleOpenQuoteForm(order)}
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm transition duration-200 flex items-center"
                        >
                          <FaMoneyBillWave className="mr-2" /> Create Quote
                        </button>
                      </div>
                      {order.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{order.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No orders need quotes right now.</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700 mb-2">Pending Quotes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {spDashboard.statistics?.pending_quotes || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700 mb-2">Approved Quotes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {spDashboard.statistics?.approved_quotes || 0}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">Loading quotes summary...</p>
        )}
      </div>

      {error && (
        <div className="bg-danger-light bg-opacity-20 text-danger-dark p-4 rounded-xl mb-5 border border-danger-light">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}
      
      {showDebug && (
        <div className="bg-gray-100 p-4 rounded-xl mb-6 border border-gray-300">
          <h5 className="text-lg font-semibold mb-3 flex items-center text-gray-700">
            <i className="fas fa-bug mr-2 text-primary"></i> Debug Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h6 className="font-medium text-gray-700 mb-2">User Info:</h6>
              <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-32 border border-gray-200">
                {JSON.stringify({ id: user?.id, type: user?.user_type }, null, 2)}
              </pre>
            </div>
            <div>
              <h6 className="font-medium text-gray-700 mb-2">Orders Count:</h6>
              <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-32 border border-gray-200">
                {JSON.stringify({ 
                  active: activeOrders.length, 
                  available: availableOrders.length 
                }, null, 2)}
              </pre>
            </div>
          </div>
          <div className="mb-4">
            <h6 className="font-medium text-gray-700 mb-2">Active Orders IDs:</h6>
            <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-48 border border-gray-200">
              {JSON.stringify(activeOrders.map(o => ({ 
                id: o.id, 
                status: o.status,
                assistant: o.assistant?.id || o.assistant_id || o.assistant
              })), null, 2)}
            </pre>
          </div>
          <div className="mb-4">
            <h6 className="font-medium text-gray-700 mb-2">Check Specific Order IDs:</h6>
            <div className="flex">
              <input 
                type="text" 
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Enter order IDs (comma separated)" 
                id="orderIdsInput"
              />
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 text-sm rounded-r-lg transition duration-200"
                onClick={() => {
                  const input = document.getElementById('orderIdsInput');
                  if (input && input.value) {
                    const orderIds = input.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    if (orderIds.length > 0) {
                      checkForMissingOrders(orderIds);
                    }
                  }
                }}
              >
                <i className="fas fa-search mr-1"></i> Check
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              className="bg-primary hover:bg-primary-dark text-white px-3 py-2 text-sm rounded-lg transition duration-200 flex items-center"
              onClick={loadOrders}
            >
              <i className="fas fa-sync-alt mr-1"></i> Refresh Orders
            </button>
            <button 
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-2 text-sm rounded-lg transition duration-200 flex items-center"
              onClick={async () => {
                const directOrders = await fetchOrdersDirectly();
                console.log("Direct orders:", directOrders);
                
                // Filter for orders assigned to this assistant
                const userId = String(user?.id);
                const assignedOrders = directOrders.filter(order => {
                  return (
                    (order.assistant && String(order.assistant.id) === userId) ||
                    (order.assistant_id !== undefined && String(order.assistant_id) === userId) ||
                    (order.assistant !== undefined && typeof order.assistant !== 'object' && String(order.assistant) === userId)
                  );
                });
                
                console.log(`Found ${assignedOrders.length} orders assigned to this assistant directly`);
                
                if (assignedOrders.length > 0) {
                  // Update active orders with these directly fetched orders
                  setActiveOrders(prev => {
                    // Create a set of existing order IDs
                    const existingIds = new Set(prev.map(o => o.id));
                    
                    // Add new orders that aren't already in the list
                    const newOrders = [...prev];
                    assignedOrders.forEach(order => {
                      if (!existingIds.has(order.id)) {
                        newOrders.push(order);
                      }
                    });
                    
                    return newOrders;
                  });
                }
              }}
            >
              <i className="fas fa-search mr-1"></i> Fetch All Orders
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 mb-8 shadow-md relative overflow-hidden">
        {/* Left border accent */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-primary-light"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-shield-alt text-primary mr-3"></i> Verification Status
            </h4>
            <p className="mt-3">
              {verificationStatus === 'verified' ? (
                <span className="flex items-center">
                  <i className="fas fa-check-circle text-success-dark mr-2"></i> 
                  Your account is verified and you can accept orders.
                </span>
              ) : verificationStatus === 'pending' ? (
                <span className="flex items-center">
                  <i className="fas fa-clock text-warning-dark mr-2"></i> 
                  Your verification is being reviewed.
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-danger-dark mr-2"></i> 
                  Please verify your account to start accepting orders.
                </span>
              )}
            </p>
            {verificationStatus === 'unverified' && (
              <Link to="/verify-assistant" className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg mt-3 transition duration-300">
                <i className="fas fa-user-check mr-2"></i>
                Go to Verification Page
              </Link>
            )}
          </div>
          <div className="md:col-span-4 flex justify-end items-center">
            {verificationStatus !== 'verified' && (
              <div className="bg-info-light bg-opacity-20 text-info-dark px-4 py-2 rounded-full text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                Verification increases your trust rating
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="md:col-span-8">
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-l-4 border-primary pl-3">
              <i className="fas fa-tasks text-primary mr-3"></i> Your Active Orders
            </h2>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg text-gray-600 italic">
                <i className="fas fa-info-circle mr-2"></i> You don't have any active orders.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1">
                    <div className="p-5">
                      <div className="font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2 mb-3">
                        <i className="fas fa-clipboard-list text-primary mr-2"></i>
                        Order #{order.id}
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600">{order.order_type?.name || 'General Order'}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                        {order.pickup_location && (
                          <div className="flex">
                            <div className="font-medium text-gray-600 w-20">From:</div>
                            <div className="flex-1 break-words">{order.pickup_location}</div>
                          </div>
                        )}
                        {order.delivery_location && (
                          <div className="flex">
                            <div className="font-medium text-gray-600 w-20">To:</div>
                            <div className="flex-1 break-words">{order.delivery_location}</div>
                          </div>
                        )}
                        {order.title && (
                          <div className="flex">
                            <div className="font-medium text-gray-600 w-20">Title:</div>
                            <div className="flex-1 break-words">{order.title}</div>
                          </div>
                        )}
                        {order.description && (
                          <div className="flex">
                            <div className="font-medium text-gray-600 w-20">Details:</div>
                            <div className="flex-1 break-words">
                              {order.description.length > 100 
                                ? `${order.description.substring(0, 100)}...` 
                                : order.description}
                            </div>
                          </div>
                        )}
                        {order.shopping_items && order.shopping_items.length > 0 && (
                          <div className="flex">
                            <div className="font-medium text-gray-600 w-20">Items:</div>
                            <div className="flex-1 break-words">{order.shopping_items.length}</div>
                          </div>
                        )}
                      </div>
                      {/* Expandable Details */}
                      {expandedOrders.has(order.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          {/* Full Description */}
                          {order.description && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">Description:</p>
                              <p className="text-sm text-gray-700">{order.description}</p>
                            </div>
                          )}
                          
                          {/* Client Info */}
                          {order.client && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">Client:</p>
                              <p className="text-sm text-gray-700">
                                {order.client.first_name} {order.client.last_name}
                                {order.client.phone_number && ` - ${order.client.phone_number}`}
                              </p>
                            </div>
                          )}
                          
                          {/* Shopping Order - Final Items Total */}
                          {isShoppingOrder(order) && order.status === 'in_progress' && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">Final Items Total (KES):</p>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter final total"
                                value={shoppingTotals[order.id] || order.assistant_items_total || ''}
                                onChange={(e) => setShoppingTotals(prev => ({ ...prev, [order.id]: e.target.value }))}
                              />
                            </div>
                          )}
                          
                          {/* Attachments Section */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-600">Attachments:</p>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleFileUpload(order.id, file);
                                  }}
                                />
                                <span className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark flex items-center">
                                  <FaUpload className="mr-1" /> Upload
                                </span>
                              </label>
                            </div>
                            {loadingAttachments[order.id] ? (
                              <p className="text-xs text-gray-500">Loading attachments...</p>
                            ) : orderAttachments[order.id] && orderAttachments[order.id].length > 0 ? (
                              <div className="space-y-2">
                                {orderAttachments[order.id].map((att, idx) => (
                                  <div key={att.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center">
                                      {att.content_type?.startsWith('image/') ? (
                                        <FaImage className="mr-2 text-blue-500" />
                                      ) : (
                                        <FaFileAlt className="mr-2 text-gray-500" />
                                      )}
                                      <span className="text-xs text-gray-700">
                                        {att.file_name || 'Attachment'} 
                                        {att.file_size && ` (${Math.round(att.file_size / 1024)} KB)`}
                                      </span>
                                    </div>
                                    {att.signed_url || att.url || att.file_url ? (
                                      <a
                                        href={att.signed_url || att.url || att.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                      >
                                        View
                                      </a>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">No attachments</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center"
                          >
                            <i className={`fas fa-chevron-${expandedOrders.has(order.id) ? 'up' : 'down'} mr-1`}></i>
                            {expandedOrders.has(order.id) ? 'Less' : 'More'}
                          </button>
                          
                          <Link to={`/orders/${order.id}`}>
                            <button className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center">
                              <i className="fas fa-eye mr-1"></i> View Details
                            </button>
                          </Link>
                          
                          {/* Submit Quote button for handyman orders */}
                          {isHandymanOrder(order) && needsQuote(order) && (
                            <button 
                              onClick={() => handleOpenQuoteForm(order)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center"
                            >
                              <FaMoneyBillWave className="mr-1" /> Submit Quote
                            </button>
                          )}
                        </div>
                        
                        {/* Order Status Actions */}
                        <div className="flex items-center gap-2">
                          {order.status === 'assigned' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'in_progress')}
                              disabled={processingOrders.has(order.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center disabled:opacity-50"
                            >
                              <FaPlay className="mr-1" /> {processingOrders.has(order.id) ? 'Starting...' : 'Start'}
                            </button>
                          )}
                          
                          {order.status === 'in_progress' && (
                            <button
                              onClick={async () => {
                                const extra = {};
                                if (isShoppingOrder(order)) {
                                  const total = shoppingTotals[order.id] || order.assistant_items_total;
                                  if (!total) {
                                    setError('Please enter the final items total');
                                    return;
                                  }
                                  extra.assistant_items_total = parseFloat(total);
                                }
                                await updateOrderStatus(order.id, 'completed', extra);
                              }}
                              disabled={processingOrders.has(order.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center disabled:opacity-50"
                            >
                              <FaCheckCircle className="mr-1" /> {processingOrders.has(order.id) ? 'Completing...' : 'Mark Completed'}
                            </button>
                          )}
                          
                          {order.created_at && (
                            <div className="text-xs text-gray-500 italic">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-md h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-l-4 border-primary pl-3">
              <i className="fas fa-map-marker-alt text-primary mr-3"></i> My Location
            </h3>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <MapComponent showCurrentLocation={true} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-l-4 border-primary pl-3">
          <i className="fas fa-clipboard-list text-primary mr-3"></i> Available Orders
        </h2>
        {availableOrders.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg text-gray-600 italic">
            <i className="fas fa-info-circle mr-2"></i> No available orders at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {availableOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1">
                <div className="p-5">
                  <div className="font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2 mb-3">
                    <i className="fas fa-clipboard-check text-primary mr-2"></i>
                    Order #{order.id}
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">{order.order_type?.name || 'General Order'}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    {order.pickup_location && (
                      <div className="flex">
                        <div className="font-medium text-gray-600 w-20">From:</div>
                        <div className="flex-1 break-words">{order.pickup_location}</div>
                      </div>
                    )}
                    {order.delivery_location && (
                      <div className="flex">
                        <div className="font-medium text-gray-600 w-20">To:</div>
                        <div className="flex-1 break-words">{order.delivery_location}</div>
                      </div>
                    )}
                    {order.title && (
                      <div className="flex">
                        <div className="font-medium text-gray-600 w-20">Title:</div>
                        <div className="flex-1 break-words">{order.title}</div>
                      </div>
                    )}
                    {order.description && (
                      <div className="flex">
                        <div className="font-medium text-gray-600 w-20">Details:</div>
                        <div className="flex-1 break-words">
                          {order.description.length > 80 
                            ? `${order.description.substring(0, 80)}...` 
                            : order.description}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center mt-4 pt-3 border-t border-gray-100">
                    <button
                      className={`w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                        verificationStatus === 'verified' 
                          ? 'bg-success hover:bg-success-dark cursor-pointer' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => verificationStatus === 'verified' && acceptOrder(order.id)}
                      disabled={verificationStatus !== 'verified'}
                    >
                      <i className="fas fa-check-circle mr-1"></i> Accept Order
                    </button>
                    {order.price && (
                      <div className="font-semibold text-success-dark text-lg mt-2">
                        ${parseFloat(order.price).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      <Modal
        show={showVerificationModal}
        onHide={() => setShowVerificationModal(false)}
        centered
        size="lg"
        className="rounded-xl overflow-hidden"
      >
        <Modal.Header closeButton className="bg-primary bg-opacity-10 border-b border-primary-light">
          <Modal.Title className="text-primary font-bold">Assistant Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <VerificationForm onVerificationSubmit={handleVerificationSubmit} />
        </Modal.Body>
      </Modal>

      {/* Quote Modal */}
      <Modal
        show={showQuoteModal}
        onHide={handleCloseQuoteForm}
        centered
        size="lg"
        className="rounded-xl overflow-hidden"
      >
        <Modal.Header closeButton className="bg-green-600 bg-opacity-10 border-b border-green-600">
          <Modal.Title className="text-green-600 font-bold">Submit Quote</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <HandymanQuoteForm
              order={selectedOrder}
              onSuccess={handleQuoteSubmitted}
              onCancel={handleCloseQuoteForm}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AssistantDashboard;
