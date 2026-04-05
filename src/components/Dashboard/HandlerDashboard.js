import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import useOrderNotifications from '../../hooks/useOrderNotifications';
import './HandlerDashboard.css';
import LeafletOrderMap from '../Common/LeafletOrderMap';
import { processOrderWaypoints, isWaypointMarker } from '../../utils/helpers';

// API base URL - update this to match your backend configuration
import config from '../../config';
const API_BASE_URL = config.API_BASE_URL;

const HandlerDashboard = () => {
  // Navigation hook for redirects
  const navigate = useNavigate();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('orders');
  
  // State for order status filter
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  
  // State for orders management
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
  
  // State for assistants
  const [assistants, setAssistants] = useState([]);

  // State for live map tab
  const [assistantLocations, setAssistantLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState(null);
  
  // State for SOS tab
  const [sosAlerts, setSosAlerts] = useState([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState(null);
  
  // State for My Clients tab
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(null); // clientId for which dropdown is open
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { currentUser } = useAuth();

  // Initial authentication check on component mount
  useEffect(() => {
    // Check for auth token and user type
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (!token) {
      setError('Authentication required. Please log in.');
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Verify user is a handler
    if (userType !== 'handler') {
      setError('Access denied. This dashboard is for handlers only.');
      // Redirect to appropriate dashboard based on user type
      setTimeout(() => {
        if (userType === 'assistant') {
          navigate('/client/dashboard');
        }
      }, 2000);
      return;
    }
    
    // If authentication passes, load data for the active tab
    if (activeTab === 'orders') {
      loadOrdersData();
    } else if (activeTab === 'assistants') {
      loadAssistantsData();
    }
  }, []); // Empty dependency array to run only on mount

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch assistants' current locations (for map)
  const fetchAssistantLocations = async () => {
    try {
      setLocationsLoading(true);
      setLocationsError(null);
      console.log('[LiveMap] Fetching assistant locations...');

      const response = await axios.get('/locations/all-users/?user_type=assistant');
      console.log('[LiveMap] /locations/all-users response status:', response.status);
      console.log('[LiveMap] Raw data:', response.data);

      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      console.log(`[LiveMap] Received ${data.length} location(s)`);

      const markers = data
        .filter(item => {
          const hasLat = Number.isFinite(Number(item.latitude));
          const hasLng = Number.isFinite(Number(item.longitude));
          if (!hasLat || !hasLng) {
            console.log('[LiveMap] ⚠️ Skipping item - invalid coords:', { latitude: item.latitude, longitude: item.longitude, item });
          }
          return hasLat && hasLng;
        })
        .map(item => ({
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          name: item.username ? `Assistant: ${item.username}` : `Assistant #${item.user_id || ''}`,
          color: '#3b82f6',
          popup: `<div><strong>${item.username || 'Assistant'}</strong>` +
                 `${item.job_category ? `<br/>Category: ${item.job_category}` : ''}` +
                 `${item.phone_number ? `<br/>Phone: ${item.phone_number}` : ''}` +
                 `${item.last_updated ? `<br/>${new Date(item.last_updated).toLocaleString()}` : ''}` +
                 `${item.speed ? `<br/>Speed: ${item.speed} km/h` : ''}` +
                 `${item.accuracy ? `<br/>Acc: ${item.accuracy} m` : ''}` +
                 `</div>`
        }));

      console.log(`[LiveMap] Normalized ${markers.length} marker(s)`, markers);
      if (markers.length === 0 && data.length > 0) {
        console.warn('[LiveMap] ⚠️ All items were filtered out! Check coordinate field names. Sample item:', data[0]);
      }
      setAssistantLocations(markers);
    } catch (e) {
      console.error('[LiveMap] Failed to fetch assistant locations:', e);
      setLocationsError('Failed to load assistant locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  // SOS API
  const fetchSosAlerts = async () => {
    try {
      setSosLoading(true);
      setSosError(null);
      const res = await axios.get('orders/sos/list/');
      setSosAlerts(Array.isArray(res.data?.results) ? res.data.results : []);
    } catch (e) {
      setSosError(e.response?.data?.error || 'Failed to load SOS alerts');
    } finally {
      setSosLoading(false);
    }
  };

  const resolveSos = async (id) => {
    try {
      await axios.post(`orders/sos/${id}/resolve/`);
      await fetchSosAlerts();
      setSuccessMessage('SOS resolved');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to resolve SOS');
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Track if initial load is complete to avoid showing loading state on auto-refresh
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // Load orders data - improved implementation with pagination support
  // Must be defined before useEffects that use it
  const loadOrdersData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      // Get token from local storage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Set up axios instance with auth headers and increased timeout for large datasets
      const axiosAuth = axios.create({
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // Increase timeout to 2 minutes for large datasets
      });
      
      // Function to fetch all orders - try handler-specific endpoint first
      const fetchAllOrders = async () => {
        let allOrders = [];
        
        // First, try the new handler-specific endpoint that returns all orders without pagination
        try {
          console.log('Trying handler-specific endpoint: orders/handler/all/');
          console.log('This may take a moment for large datasets...');
          setLoadingMessage('Loading all orders... This may take a moment for large datasets.');
          
          const response = await axiosAuth.get('orders/handler/all/');
          const data = response.data;
          
          if (Array.isArray(data)) {
            allOrders = data;
            console.log(`✅ Successfully fetched ${data.length} orders from handler endpoint (non-paginated)`);
            return allOrders;
          } else {
            console.log('Handler endpoint returned unexpected format, falling back to pagination');
          }
        } catch (handlerErr) {
          console.log('Handler endpoint failed, falling back to pagination:', handlerErr.message);
          
          // If it's a timeout, let the user know
          if (handlerErr.code === 'ECONNABORTED' || handlerErr.message.includes('timeout')) {
            console.log('⚠️ Handler endpoint timed out - this usually means there are many orders. Using pagination instead.');
          }
        }
        
        // Fallback: Use pagination approach with progress tracking
        console.log('📄 Using pagination to fetch all orders...');
        setLoadingMessage('Loading orders page by page...');
        let nextUrl = 'orders/';
        let pageCount = 0;
        
        while (nextUrl) {
          try {
            pageCount++;
            console.log(`Fetching page ${pageCount} from: ${nextUrl}`);
            const response = await axiosAuth.get(nextUrl);
            const data = response.data;
            
            // Handle paginated response
            if (data.results && Array.isArray(data.results)) {
              allOrders = allOrders.concat(data.results);
              // Extract the path from the next URL if it exists
              if (data.next) {
                const nextUrlObj = new URL(data.next);
                nextUrl = nextUrlObj.pathname + nextUrlObj.search;
                // Remove the /api prefix if it exists
                nextUrl = nextUrl.replace('/api/', '');
              } else {
                nextUrl = null;
              }
              console.log(`📄 Page ${pageCount}: Fetched ${data.results.length} orders, total so far: ${allOrders.length}${data.count ? ` of ${data.count}` : ''}`);
              setLoadingMessage(`Loading orders... Page ${pageCount} (${allOrders.length}${data.count ? ` of ${data.count}` : ''} orders loaded)`);
            } 
            // Handle non-paginated response (array directly)
            else if (Array.isArray(data)) {
              allOrders = data;
              nextUrl = null;
              console.log(`Fetched ${data.length} orders (non-paginated)`);
            } 
            // Handle unexpected format
            else {
              console.error('Unexpected orders data format:', data);
              nextUrl = null;
            }
          } catch (pageErr) {
            console.error('Error fetching page:', nextUrl, pageErr);
            // If this is the first page, try alternative endpoint
            if (nextUrl === 'orders/') {
              try {
                console.log('Trying alternative endpoint: orders/list/');
                const altResponse = await axiosAuth.get('orders/list/');
                const altData = altResponse.data;
                
                if (altData.results && Array.isArray(altData.results)) {
                  allOrders = altData.results;
                  console.log(`Fetched ${altData.results.length} orders from alternative endpoint`);
                } else if (Array.isArray(altData)) {
                  allOrders = altData;
                  console.log(`Fetched ${altData.length} orders from alternative endpoint (non-paginated)`);
                }
              } catch (altErr) {
                console.error('Alternative endpoint also failed:', altErr);
                throw new Error('Could not retrieve orders from any endpoint');
              }
            }
            break;
          }
        }
        
        console.log(`✅ Pagination complete: Fetched ${allOrders.length} orders across ${pageCount} pages`);
        
        return allOrders;
      };
      
      // Fetch all orders across all pages
      const processedOrders = await fetchAllOrders();
      
      console.log(`Total orders loaded: ${processedOrders.length}`);
      setOrders(processedOrders);
      setLastRefreshTime(new Date());
      
      // Calculate statistics based on all orders
      const pendingOrders = processedOrders.filter(order => order.status === 'pending').length;
      const activeOrders = processedOrders.filter(order => 
        order.status === 'in_progress' || order.status === 'assigned'
      ).length;
      const completedOrders = processedOrders.filter(order => order.status === 'completed').length;
      const cancelledOrders = processedOrders.filter(order => order.status === 'cancelled').length;
      
      setStatistics({
        totalOrders: processedOrders.length,
        pendingOrders,
        activeOrders,
        completedOrders,
        cancelledOrders
      });

      // After loading orders, also load assistants to have them available for assignment
      loadAssistantsData(false);
      
    } catch (err) {
      console.error("Error loading orders data:", err);
      setError(err.message || err.response?.data?.error || "Failed to load orders data. Please try again.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrdersData();
    } else if (activeTab === 'assistants') {
      loadAssistantsData();
    } else if (activeTab === 'map') {
      fetchAssistantLocations();
      const mapInterval = setInterval(fetchAssistantLocations, 5000);
      return () => clearInterval(mapInterval);
    } else if (activeTab === 'sos') {
      fetchSosAlerts();
      const t = setInterval(fetchSosAlerts, 15000);
      return () => clearInterval(t);
    } else if (activeTab === 'clients') {
      loadClientsData();
    }
  }, [activeTab, loadOrdersData]);

  // Auto-refresh orders when orders tab is active
  useEffect(() => {
    if (activeTab !== 'orders') return;

    // Initial load
    if (!hasInitialLoaded) {
      loadOrdersData(true); // Show loading on initial load
      setHasInitialLoaded(true);
    }

    // Set up auto-refresh interval (every 2 minutes)
    const refreshInterval = setInterval(() => {
      console.log('[HandlerDashboard] Auto-refreshing orders...');
      setIsRefreshing(true);
      loadOrdersData(false).finally(() => {
        setIsRefreshing(false);
      });
    }, 120000); // Refresh every 2 minutes (120000ms)

    return () => {
      clearInterval(refreshInterval);
    };
  }, [activeTab, hasInitialLoaded, loadOrdersData]);

  // Reset initial load flag when switching tabs
  useEffect(() => {
    if (activeTab !== 'orders') {
      setHasInitialLoaded(false);
    }
  }, [activeTab]);

  // Order notifications for handlers (disabled temporarily)
  // const { user } = useAuth();
  // useOrderNotifications(
  //   activeTab === 'orders' ? orders : [], // Only notify when viewing orders tab
  //   loadOrdersData,
  //   {
  //     enabled: activeTab === 'orders',
  //     pollInterval: 0, // Disable polling in hook since we're handling it here
  //     showBrowserNotification: true,
  //     notificationTitle: 'New Order Received',
  //     userRole: user?.user_type || 'handler'
  //   }
  // );

  // Load clients assigned to this handler
  const loadClientsData = async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      
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
      
      // Try different possible endpoints for getting assigned clients
      let clientsData = [];
      
      try {
        // Try handler-specific clients endpoint
        const response = await axiosAuth.get('accounts/handler/clients/');
        const data = response.data;
        
        if (Array.isArray(data)) {
          clientsData = data;
        } else if (data.results && Array.isArray(data.results)) {
          clientsData = data.results;
        } else if (data.clients && Array.isArray(data.clients)) {
          clientsData = data.clients;
        }
      } catch (endpointError) {
        console.log('Handler clients endpoint not found, trying alternative...');
        
        // Fallback: Get all users and filter for clients assigned to this handler
        try {
          const response = await axiosAuth.get('accounts/user/list/');
          const data = response.data;
          
          const allUsers = Array.isArray(data) ? data : (data.results || []);
          
          // Filter for clients (user_type === 'client' or 'user')
          // and check if they have account_manager field matching current handler
          const currentHandlerId = currentUser?.id;
          
          clientsData = allUsers.filter(user => {
            const isClient = user.user_type === 'client' || user.user_type === 'user';
            const hasHandler = user.account_manager === currentHandlerId || 
                             user.assigned_handler === currentHandlerId ||
                             user.handler === currentHandlerId;
            return isClient && hasHandler;
          });
        } catch (fallbackError) {
          console.error('Error fetching clients:', fallbackError);
          throw new Error('Failed to load clients. Please ensure the backend supports client assignment.');
        }
      }
      
      setClients(clientsData);
    } catch (err) {
      console.error('Error loading clients data:', err);
      setClientsError(err.message || err.response?.data?.error || 'Failed to load clients. Please try again.');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  // Load assistants data with pagination so all assistants are shown
  const loadAssistantsData = async (setLoadingState = true) => {
    try {
      if (setLoadingState) {
        setIsLoading(true);
      }

      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create axios instance with authentication header
      const axiosAuth = axios.create({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let assistantUsers = [];

      // First try: page through the dedicated assistants list endpoint
      try {
        let nextUrl = 'accounts/user/list/';
        let page = 1;
        while (nextUrl) {
          console.log(`Fetching assistants page ${page} from: ${nextUrl}`);
          const response = await axiosAuth.get(nextUrl);
          const data = response.data;

          if (data && Array.isArray(data.results)) {
            // Paginated DRF response
            assistantUsers = assistantUsers.concat(
              data.results.filter(u => u.user_type === 'assistant')
            );
            if (data.next) {
              const nextUrlObj = new URL(data.next);
              nextUrl = nextUrlObj.pathname + nextUrlObj.search;
              // Normalize if backend includes /api prefix
              nextUrl = nextUrl.replace('/api/', '');
            } else {
              nextUrl = null;
            }
            page++;
          } else if (Array.isArray(data)) {
            // Non-paginated array
            assistantUsers = data.filter(u => u.user_type === 'assistant');
            nextUrl = null;
          } else {
            // Unexpected format
            console.warn('Unexpected assistants data format, stopping pagination');
            nextUrl = null;
          }
        }
        console.log(`Loaded ${assistantUsers.length} assistants via paginated endpoint`);
      } catch (paginatedErr) {
        console.log('Paginated assistants fetch failed, will try fallback:', paginatedErr.message);
      }

      // Fallback: fetch generic users and filter client-side
      if (assistantUsers.length === 0) {
        let response = null;
        const endpoints = [
          'accounts/user/list/',
          'accounts/user/',
          'users/',
          'accounts/users/'
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting to fetch users from: ${endpoint}`);
            response = await axiosAuth.get(endpoint);
            console.log(`Successfully fetched data from: ${endpoint}`);
            break;
          } catch (err) {
            console.log(`Failed to fetch from ${endpoint}:`, err.message);
          }
        }

        if (!response) {
          throw new Error('Failed to fetch users from any endpoint');
        }

        let allUsers = [];
        const responseData = response.data;

        if (Array.isArray(responseData)) {
          allUsers = responseData;
        } else if (responseData.results && Array.isArray(responseData.results)) {
          allUsers = responseData.results;
        } else if (responseData && typeof responseData === 'object' && responseData.id) {
          // Single user returned - try list endpoint explicitly
          try {
            const listResponse = await axiosAuth.get('accounts/user/list/');
            if (Array.isArray(listResponse.data)) {
              allUsers = listResponse.data;
            } else if (listResponse.data.results && Array.isArray(listResponse.data.results)) {
              allUsers = listResponse.data.results;
            } else {
              allUsers = [responseData];
            }
          } catch (listErr) {
            console.log('Could not fetch user list, using single user response');
            allUsers = [responseData];
          }
        }

        assistantUsers = allUsers.filter(u => u.user_type === 'assistant');
      }

      // Update state and cache
      setAssistants(assistantUsers);
      try {
        localStorage.setItem('handlerDashboardData', JSON.stringify({
          assistants: assistantUsers,
          lastUpdated: new Date().toISOString()
        }));
      } catch (storageError) {
        console.error('Error storing assistants data in localStorage:', storageError);
      }

    } catch (err) {
      console.error('Error loading assistants data:', err);
      if (setLoadingState) {
        setError(err.message || err.response?.data?.error || 'Failed to load assistants data. Please try again.');
      }
      setAssistants([]);
    } finally {
      if (setLoadingState) {
        setIsLoading(false);
      }
    }
  };



  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Set up axios instance with auth headers
      const axiosAuth = axios.create({
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await axiosAuth.patch(`orders/${orderId}/status/`, { status: newStatus });
      
      // Update local state (functional update to avoid stale state)
      setOrders(prevOrders => {
        const updated = prevOrders.map(order => (
          order.id === orderId ? { ...order, status: newStatus } : order
        ));

        // Update statistics based on updated array
        const pendingOrders = updated.filter(o => o.status === 'pending').length;
        const activeOrders = updated.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
        const completedOrders = updated.filter(o => o.status === 'completed').length;
        const cancelledOrders = updated.filter(o => o.status === 'cancelled').length;

        setStatistics({
          totalOrders: updated.length,
          pendingOrders,
          activeOrders,
          completedOrders,
          cancelledOrders
        });

        return updated;
      });
      
      setSuccessMessage(`Order status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(err.message || err.response?.data?.error || "Failed to update order status. Please try again.");
    }
  };

  // Assign order to assistant - improved with better error handling
  const handleAssignOrder = useCallback(async (orderId, assistantId) => {
    try {
      // Show loading indicator
      setIsLoading(true);
      
      console.log(`Attempting to assign order ${orderId} to assistant ${assistantId}`);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Get authentication token
      const token = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Set up axios instance with auth headers
      const axiosAuth = axios.create({
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Try the assignment with different payload formats
      try {
        console.log(`Trying PATCH to orders/${orderId}/assign/`);
        console.log('Payload:', { assistant_id: assistantId });
        
        await axiosAuth.patch(`orders/${orderId}/assign/`, { 
          assistant_id: assistantId 
        });
        
        console.log('Assignment successful with first endpoint');
      } catch (mainError) {
        console.error("Main assignment endpoint failed:", mainError);
        console.log('Error details:', {
          message: mainError.message,
          response: mainError.response?.data,
          status: mainError.response?.status
        });
        
        // Try alternative endpoint structure if first one fails
        try {
          console.log(`Trying POST to orders/${orderId}/assign-assistant/`);
          await axiosAuth.post(`orders/${orderId}/assign-assistant/`, { 
            assistant_id: assistantId 
          });
          
          console.log('Assignment successful with second endpoint');
        } catch (altError) {
          console.error("Alternative assignment endpoint failed:", altError);
          console.log('Error details:', {
            message: altError.message,
            response: altError.response?.data,
            status: altError.response?.status
          });
          
          // Try one more format
          try {
            console.log(`Trying PATCH to orders/${orderId}/`);
            await axiosAuth.patch(`orders/${orderId}/`, { 
              assistant: assistantId 
            });
            
            console.log('Assignment successful with third endpoint');
          } catch (thirdError) {
            console.error("Third assignment endpoint failed:", thirdError);
            console.log('Error details:', {
              message: thirdError.message,
              response: thirdError.response?.data,
              status: thirdError.response?.status
            });
            
            throw new Error("Order assignment failed. Please try again.");
          }
        }
      }
      
      // Find the assigned assistant from our assistants list
      const assignedAssistant = assistants.find(assistant => assistant.id === assistantId);

      // Update the local state to immediately reflect the change without waiting for a reload
      if (assignedAssistant) {
        setOrders(prevOrders => {
          const updated = prevOrders.map(order => (
            order.id === orderId ? { ...order, assistant: assignedAssistant, status: 'assigned' } : order
          ));

          // Update stats based on updated
          const pendingOrders = updated.filter(o => o.status === 'pending').length;
          const activeOrders = updated.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;

          setStatistics(prev => ({
            ...prev,
            pendingOrders,
            activeOrders
          }));

          return updated;
        });
      } else {
        // If we couldn't find the assistant in our local list, refresh all data
        loadOrdersData(false); // Don't show loading on assignment refresh
      }
      
      setSuccessMessage("Order assigned successfully to assistant.");
    } catch (err) {
      console.error("Error assigning order:", err);
      setError(err.message || err.response?.data?.error || "Failed to assign order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [assistants, loadOrdersData]);



  // Improved function to get display name for users, with multiple fallback options
  const getUserDisplayName = (user, context = 'user') => {
    // Handle null/undefined users based on context
    if (!user) {
      return context === 'assistant' ? 'Unassigned' : 'Unknown Customer';
    }
    
    // If user is just an ID (sometimes happens with nested objects)
    if (typeof user === 'string' || typeof user === 'number') {
      // Try to find the assistant in our assistants list
      const foundAssistant = assistants.find(a => a.id === user || a.id === Number(user));
      if (foundAssistant) {
        user = foundAssistant;
      } else {
        return context === 'assistant' ? 'Assistant #' + user : 'User #' + user;
      }
    }
    
    // Try different possible name field combinations
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    if (user.first_name) {
      return user.first_name;
    }
    
    if (user.last_name) {
      return user.last_name;
    }
    
    if (user.name) {
      return user.name;
    }
    
    if (user.username) {
      return user.username;
    }
    
    if (user.email) {
      // Only display part before @ for privacy
      return user.email.split('@')[0];
    }
    
    if (user.phone_number) {
      // Show masked phone number for privacy
      const phone = user.phone_number;
      if (phone.length > 4) {
        return '***' + phone.substring(phone.length - 4);
      }
      return phone;
    }
    
    // If we have an ID but no other identifying information
    if (user.id) {
      return 'User #' + user.id;
    }
    
    return 'Unknown User';
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'in_progress':
      case 'in progress':
      case 'assigned':
        return 'status-badge in-progress';
      case 'completed':
        return 'status-badge completed';
      case 'cancelled':
        return 'status-badge cancelled';
      case 'verified':
        return 'status-badge verified';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge unknown';
    }
  };

  const formatStatus = (status) => {
    // Convert snake_case to Title Case
    if (!status) return 'Unknown';
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Function to filter orders based on status
  const getFilteredOrders = () => {
    if (orderStatusFilter === 'all') {
      return orders;
    }
    
    return orders.filter(order => {
      const status = order.status?.toLowerCase();
      switch (orderStatusFilter) {
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

  // Get counts for each status tab
  const getOrderStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(order => order.status?.toLowerCase() === 'pending').length,
      in_progress: orders.filter(order => ['in_progress', 'in progress', 'assigned'].includes(order.status?.toLowerCase())).length,
      completed: orders.filter(order => order.status?.toLowerCase() === 'completed').length,
      cancelled: orders.filter(order => order.status?.toLowerCase() === 'cancelled').length,
    };
  };

  /**
   * Process order waypoints for map display using the waypoint detection logic
   * This function uses the same waypoint detection logic as LeafletOrderMap
   * 
   * @param {object} order - Order object with waypoints, pickup, and delivery locations
   * @returns {Array} Array of marker objects formatted for LeafletOrderMap
   * 
   * @example
   * // Example: How to use this for displaying order waypoints on a map
   * const order = {
   *   id: 123,
   *   pickup_latitude: -1.286389,
   *   pickup_longitude: 36.817223,
   *   delivery_latitude: -1.305000,
   *   delivery_longitude: 36.835000,
   *   waypoints: [
   *     {
   *       latitude: -1.290000,
   *       longitude: 36.820000,
   *       name: "Waypoint 1",
   *       order_index: 0
   *     },
   *     {
   *       latitude: -1.295000,
   *       longitude: 36.825000,
   *       name: "Waypoint 2",
   *       order_index: 1
   *     }
   *   ]
   * };
   * 
   * const markers = processOrderWaypointsForMap(order);
   * 
   * <LeafletOrderMap
   *   markers={markers}
   *   polyline={true}  // Enable route line
   *   height="500px"
   * />
   */
  const processOrderWaypointsForMap = (order) => {
    if (!order) return [];

    // Get waypoints from order (could be in different fields)
    const waypoints = order.waypoints || order.tracking_waypoints || order.route_waypoints || [];

    // Process waypoints using the utility function
    const markers = processOrderWaypoints(waypoints, {
      includePickup: true,
      includeDelivery: true,
      order: order,
      waypointColor: '#9333ea' // Purple color for waypoints
    });

    console.log('[HandlerDashboard] Processed waypoints for order:', order.id, {
      waypointsCount: waypoints.length,
      markersCount: markers.length,
      waypointMarkers: markers.filter(m => isWaypointMarker(m)).length
    });

    return markers;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowOrderTypeDropdown(null);
    };
    if (showOrderTypeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showOrderTypeDropdown]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>{loadingMessage}</span>
      </div>
    );
  }

  return (
    <div className="handler-dashboard">
      <div className="dashboard-header">
        <h2>Handler Dashboard</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          Orders Management
        </button>
        <button 
          className={activeTab === 'assistants' ? 'active' : ''} 
          onClick={() => setActiveTab('assistants')}
        >
          Assistants
        </button>
        <button 
          className={activeTab === 'map' ? 'active' : ''} 
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button 
          className={activeTab === 'sos' ? 'active' : ''} 
          onClick={() => setActiveTab('sos')}
        >
          🚨 SOS {sosAlerts.filter(a => a.status !== 'resolved').length > 0 && (
            <span className="badge">{sosAlerts.filter(a => a.status !== 'resolved').length}</span>
          )}
        </button>
        <button 
          className={activeTab === 'clients' ? 'active' : ''} 
          onClick={() => setActiveTab('clients')}
        >
          My Clients
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          <div className="statistics-cards">
            <div className="stat-card">
              <div className="stat-card-body">
                <div className="stat-card-title">Total Orders</div>
                <h2>{statistics.totalOrders}</h2>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-card-body">
                <div className="stat-card-title">Pending</div>
                <h2>{statistics.pendingOrders}</h2>
              </div>
            </div>
            <div className="stat-card primary">
              <div className="stat-card-body">
                <div className="stat-card-title">Active</div>
                <h2>{statistics.activeOrders}</h2>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-card-body">
                <div className="stat-card-title">Completed</div>
                <h2>{statistics.completedOrders}</h2>
              </div>
            </div>
            <div className="stat-card danger">
              <div className="stat-card-body">
                <div className="stat-card-title">Cancelled</div>
                <h2>{statistics.cancelledOrders}</h2>
              </div>
            </div>
          </div>

          {/* Order Status Filter Tabs */}
          <div className="order-status-tabs" style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '1px solid #e3e6f0'
            }}>
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map((tab) => {
                const counts = getOrderStatusCounts();
                const count = counts[tab.key] || 0;
                const isActive = orderStatusFilter === tab.key;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setOrderStatusFilter(tab.key)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                      color: isActive ? '#1976d2' : '#666',
                      borderBottom: isActive ? '3px solid #1976d2' : '3px solid transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '500',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      backgroundColor: isActive ? '#1976d2' : '#e0e0e0',
                      color: isActive ? 'white' : '#666',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="content-section">
            <h3>
              {orderStatusFilter === 'all' ? 'All Orders' : 
               orderStatusFilter === 'in_progress' ? 'In Progress Orders' :
               `${orderStatusFilter.charAt(0).toUpperCase() + orderStatusFilter.slice(1)} Orders`}
              <span style={{ color: '#666', fontSize: '16px', fontWeight: 'normal', marginLeft: '10px' }}>
                ({getFilteredOrders().length})
              </span>
            </h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Service Type</th>
                    <th>Customer</th>
                    <th>Assistant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredOrders = getFilteredOrders();
                    return filteredOrders.length > 0 ? (
                      filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>{typeof order.id === 'string' ? order.id.substring(0, 8) : order.id}</td>
                        <td>{order.order_type_name || order.order_type?.name || order.service_type || 'Standard Order'}</td>
                        <td>
                          {order.client_name || getUserDisplayName(order.user || order.customer || order.client, 'customer')}
                        </td>
                        <td>
                          <span className={order.assistant ? "text-success font-bold" : "text-muted"}>
                            {order.assistant_name || getUserDisplayName(order.assistant, 'assistant')}
                          </span>
                        </td>
                        <td>KSH {parseFloat(order.price || order.total_amount || 0).toFixed(2)}</td>
                        <td>
                          <span className={getStatusBadgeClass(order.status)}>
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="action-buttons">
                          {/* 
                            Note: When viewing order details, waypoints are automatically processed
                            using the waypoint detection logic. To process waypoints for a map display:
                            
                            const markers = processOrderWaypointsForMap(order);
                            <LeafletOrderMap markers={markers} polyline={true} height="500px" />
                            
                            The waypoint detection logic checks for:
                            1. index property (primary identifier)
                            2. Name containing "waypoint", "stop", or "intermediate"
                            3. Purple color (#9333ea, #a855f7, #8b5cf6)
                          */}
                          <Link to={`/orders/${order.id}`} state={{ from: '/handler/dashboard' }} className="btn btn-info">View</Link>
                          {order.handyman_orders && order.handyman_orders.length > 0 && 
                           order.handyman_orders[0].status === 'quote_approved' && 
                           order.handyman_orders[0].approved_service_price > 0 && 
                           !order.handyman_orders[0].final_payment_complete && (
                            <button 
                              className="btn btn-warning"
                              onClick={() => {
                                const handymanId = order.handyman_orders[0].id;
                                const paymentUrl = `${window.location.origin}/handyman-payment/${handymanId}`;
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  navigator.clipboard.writeText(paymentUrl)
                                    .then(() => setSuccessMessage('Payment link copied to clipboard.'))
                                    .catch(() => alert(`Send this link to the client: ${paymentUrl}`));
                                } else {
                                  alert(`Send this link to the client: ${paymentUrl}`);
                                }
                              }}
                            >
                              Request Payment
                            </button>
                          )}
                          
                          {order.status === 'pending' && assistants && assistants.length > 0 && (
                            <div className="select-wrapper">
                              <select 
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignOrder(order.id, e.target.value);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Assign to...</option>
                                {/* Helper: normalization via inline function */}
                                {/* Riders section — detect using multiple possible fields */}
                                {assistants.some(a => {
                                  const norm = v => String(v ?? '').trim().toLowerCase();
                                  return ['rider'].includes(norm(a.user_role))
                                    || ['rider'].includes(norm(a.assistant_type))
                                    || ['rider'].includes(norm(a.role))
                                    || ['rider'].includes(norm(a.category))
                                    || ['rider'].includes(norm(a.job_category))
                                    || ['rider'].includes(norm(a.service_type));
                                }) && (
                                  <optgroup label="Riders">
                                    {assistants
                                      .filter(a => {
                                        const norm = v => String(v ?? '').trim().toLowerCase();
                                        return ['rider'].includes(norm(a.user_role))
                                          || ['rider'].includes(norm(a.assistant_type))
                                          || ['rider'].includes(norm(a.role))
                                          || ['rider'].includes(norm(a.category))
                                          || ['rider'].includes(norm(a.job_category))
                                          || ['rider'].includes(norm(a.service_type));
                                      })
                                      .map(assistant => (
                                        <option key={assistant.id} value={assistant.id}>
                                          {`${getUserDisplayName(assistant, 'assistant')} — Rider`}
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                {/* Service Providers — Plumbers */}
                                {assistants.some(a => {
                                  const norm = v => String(v ?? '').trim().toLowerCase();
                                  const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                  return spec === 'plumber';
                                }) && (
                                  <optgroup label="Service Providers — Plumbers">
                                    {assistants
                                      .filter(a => {
                                        const norm = v => String(v ?? '').trim().toLowerCase();
                                        const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                        return spec === 'plumber';
                                      })
                                      .map(assistant => (
                                        <option key={assistant.id} value={assistant.id}>
                                          {`${getUserDisplayName(assistant, 'assistant')} — Plumber`}
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                {/* Service Providers — Electricians */}
                                {assistants.some(a => {
                                  const norm = v => String(v ?? '').trim().toLowerCase();
                                  const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                  return spec === 'electrician';
                                }) && (
                                  <optgroup label="Service Providers — Electricians">
                                    {assistants
                                      .filter(a => {
                                        const norm = v => String(v ?? '').trim().toLowerCase();
                                        const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                        return spec === 'electrician';
                                      })
                                      .map(assistant => (
                                        <option key={assistant.id} value={assistant.id}>
                                          {`${getUserDisplayName(assistant, 'assistant')} — Electrician`}
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                {/* Service Providers — Landscapers */}
                                {assistants.some(a => {
                                  const norm = v => String(v ?? '').trim().toLowerCase();
                                  const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                  return spec === 'landscaper';
                                }) && (
                                  <optgroup label="Service Providers — Landscapers">
                                    {assistants
                                      .filter(a => {
                                        const norm = v => String(v ?? '').trim().toLowerCase();
                                        const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                        return spec === 'landscaper';
                                      })
                                      .map(assistant => (
                                        <option key={assistant.id} value={assistant.id}>
                                          {`${getUserDisplayName(assistant, 'assistant')} — Landscaper`}
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                {/* Fallback: show all assistants if no groups matched */}
                                {!assistants.some(a => {
                                  const norm = v => String(v ?? '').trim().toLowerCase();
                                  const isRider = ['rider'].includes(norm(a.user_role)) || ['rider'].includes(norm(a.assistant_type)) || ['rider'].includes(norm(a.role)) || ['rider'].includes(norm(a.category)) || ['rider'].includes(norm(a.job_category)) || ['rider'].includes(norm(a.service_type));
                                  const spec = norm(a.service_type) || norm(a.specialization) || norm(a.profession) || norm(a.job_category) || norm(a.category);
                                  return isRider || ['plumber','electrician','landscaper'].includes(spec);
                                }) && (
                                  <optgroup label="All Assistants">
                                    {assistants.map(assistant => (
                                      <option key={assistant.id} value={assistant.id}>
                                        {getUserDisplayName(assistant, 'assistant')}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                            </div>
                          )}
                          
                          {order.status === 'pending' && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleStatusChange(order.id, 'in_progress')}
                            >
                              Start
                            </button>
                          )}
                          
                          {(order.status === 'in_progress' || order.status === 'assigned') && (
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleStatusChange(order.id, 'completed')}
                            >
                              Complete
                            </button>
                          )}
                          
                          {(order.status === 'pending' || order.status === 'in_progress' || order.status === 'assigned') && (
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center" style={{ padding: '40px', color: '#666' }}>
                          {orderStatusFilter === 'all' 
                            ? 'No orders found' 
                            : `No ${orderStatusFilter.replace('_', ' ')} orders found`
                          }
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'assistants' && (
        <div className="content-section">
          <h3>Riders</h3>
          {assistants.length === 0 && (
            <button className="btn btn-primary mb-4" onClick={() => loadAssistantsData()}>
              Reload Riders Data
            </button>
          )}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Area of Operation</th>
                  <th>Verification Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistants.length > 0 ? (
                  assistants.map(assistant => (
                    <tr key={assistant.id}>
                      <td>{getUserDisplayName(assistant, 'assistant')}</td>
                      <td>{assistant.email || 'N/A'}</td>
                      <td>{assistant.phone_number || assistant.phone || 'N/A'}</td>
                      <td>
                        {assistant.user_role ? 
                          (assistant.user_role === 'rider' ? 'Rider' : 'Home Maintenance') : 
                          'N/A'}
                      </td>
                      <td>{assistant.area_of_operation || assistant.address || 'N/A'}</td>
                      <td>
                        <span className={getStatusBadgeClass(assistant.is_verified ? 'verified' : 'pending')}>
                          {assistant.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/assistants/${assistant.id}`} className="btn btn-info">View Profile</Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">No assistants found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sos' && (
        <div className="content-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>SOS Alerts</h3>
            <div>
              <button className="btn btn-secondary" onClick={fetchSosAlerts} disabled={sosLoading}>
                {sosLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {sosError && (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>{sosError}</div>
          )}

          {!sosLoading && sosAlerts.length === 0 ? (
            <div className="text-center" style={{ padding: 24, color: '#666' }}>No SOS alerts.</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Assistant</th>
                    <th>Order</th>
                    <th>Message</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sosAlerts.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.assistant || a.assistant_id}</td>
                      <td>#{a.order_id}</td>
                      <td>{a.message || '—'}</td>
                      <td>{(Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude))) ? `${a.latitude}, ${a.longitude}` : '—'}</td>
                      <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                      <td>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                      <td className="action-buttons">
                        <Link to={`/orders/${a.order_id}`}>View</Link>
                        {a.status !== 'resolved' && (
                          <button className="btn btn-success" onClick={() => resolveSos(a.id)}>Resolve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="content-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Assistants Live Map</h3>
            <div>
              <button className="btn btn-secondary" onClick={fetchAssistantLocations} disabled={locationsLoading}>
                {locationsLoading ? 'Refreshing...' : 'Refresh Locations'}
              </button>
            </div>
          </div>

          {locationsError && (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>{locationsError}</div>
          )}

          <LeafletOrderMap
            markers={assistantLocations}
            height="600px"
            zoom={13}
          />
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="content-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>My Clients</h3>
            <div>
              <button className="btn btn-secondary" onClick={loadClientsData} disabled={clientsLoading}>
                {clientsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {clientsError && (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>{clientsError}</div>
          )}

          {clientsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Loading clients...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center" style={{ padding: 24, color: '#666' }}>
              No clients assigned to you yet. Clients will appear here once they are assigned to you as their account manager.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td>{getUserDisplayName(client, 'customer')}</td>
                      <td>{client.email || 'N/A'}</td>
                      <td>{client.phone_number || client.phone || 'N/A'}</td>
                      <td>
                        {/* This would need to be fetched separately or included in the API response */}
                        <span style={{ color: '#666' }}>—</span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(client.is_verified ? 'verified' : 'pending')}>
                          {client.is_verified ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <div style={{ position: 'relative', display: 'inline-block', marginRight: '8px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOrderTypeDropdown(showOrderTypeDropdown === client.id ? null : client.id);
                            }}
                          >
                            Place Order ▼
                          </button>
                          {showOrderTypeDropdown === client.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                zIndex: 1000,
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                minWidth: '200px',
                                marginTop: '4px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '10px 15px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  navigate('/services/shop', {
                                    state: {
                                      clientId: client.id,
                                      clientName: getUserDisplayName(client, 'customer'),
                                      placeOrderForClient: true
                                    }
                                  });
                                  setShowOrderTypeDropdown(null);
                                }}
                              >
                                🛒 Shopping Order
                              </button>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '10px 15px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  navigate('/pickup-delivery', {
                                    state: {
                                      clientId: client.id,
                                      clientName: getUserDisplayName(client, 'customer'),
                                      placeOrderForClient: true
                                    }
                                  });
                                  setShowOrderTypeDropdown(null);
                                }}
                              >
                                📦 Pickup & Delivery
                              </button>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '10px 15px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  navigate('/cargo-delivery', {
                                    state: {
                                      clientId: client.id,
                                      clientName: getUserDisplayName(client, 'customer'),
                                      placeOrderForClient: true
                                    }
                                  });
                                  setShowOrderTypeDropdown(null);
                                }}
                              >
                                🚚 Cargo Delivery
                              </button>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '10px 15px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  navigate('/handyman', {
                                    state: {
                                      clientId: client.id,
                                      clientName: getUserDisplayName(client, 'customer'),
                                      placeOrderForClient: true
                                    }
                                  });
                                  setShowOrderTypeDropdown(null);
                                }}
                              >
                                🔧 Home Maintenance
                              </button>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '10px 15px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  navigate('/banking', {
                                    state: {
                                      clientId: client.id,
                                      clientName: getUserDisplayName(client, 'customer'),
                                      placeOrderForClient: true
                                    }
                                  });
                                  setShowOrderTypeDropdown(null);
                                }}
                              >
                                💳 Banking Services
                              </button>
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/clients/${client.id}`} 
                          className="btn btn-info"
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
      )}

    </div>
  );
};

export default HandlerDashboard;

