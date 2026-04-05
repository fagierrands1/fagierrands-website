import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import './AssistantProfilePage.css';

const API_BASE_URL = config.API_BASE_URL;

const AssistantProfilePage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    cancelledOrders: 0
  });
  const [debugInfo, setDebugInfo] = useState({
    orderStructure: '',
    filteringAttempts: 0,
    matchesFound: 0,
    directQueryResults: 0,
    verifiedDirectResults: 0
  });

  useEffect(() => {
    const fetchAssistantData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Create axios instance with auth headers
        const axiosAuth = axios.create({
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Try multiple approaches to get the assistant data
        let assistantData = null;
        
        try {
          // First approach: Try to get directly from the user by ID endpoint (new endpoint)
          const userResponse = await axiosAuth.get(`accounts/user/${id}/`);
          if (userResponse.data) {
            assistantData = userResponse.data;
            console.log('Successfully fetched assistant data from user by ID endpoint');
          }
        } catch (directError) {
          console.error('Error fetching from user by ID endpoint:', directError);
          // Continue to next approach
        }
        
        // Second approach: Try to get from the assistant list endpoint
        if (!assistantData) {
          try {
            const assistantListResponse = await axiosAuth.get(`accounts/user/list/`);
            
            // Find the specific assistant by ID
            if (Array.isArray(assistantListResponse.data)) {
              assistantData = assistantListResponse.data.find(assistant => 
                assistant.id === parseInt(id) || assistant.id === id
              );
            } else if (assistantListResponse.data.results && Array.isArray(assistantListResponse.data.results)) {
              assistantData = assistantListResponse.data.results.find(assistant => 
                assistant.id === parseInt(id) || assistant.id === id
              );
            }
            
            if (assistantData) {
              console.log('Successfully fetched assistant data from list endpoint');
            }
          } catch (listError) {
            console.error('Error fetching from assistant list:', listError);
            // Continue to next approach
          }
        }
        
        // Third approach: Try to get from orders if previous approaches failed
        if (!assistantData) {
          try {
            const ordersResponse = await axiosAuth.get(`orders/`);
            let allOrders = [];
            
            if (Array.isArray(ordersResponse.data)) {
              allOrders = ordersResponse.data;
            } else if (ordersResponse.data.results && Array.isArray(ordersResponse.data.results)) {
              allOrders = ordersResponse.data.results;
            }
            
            // Find an order with this assistant
            const orderWithAssistant = allOrders.find(order => 
              order.assistant && (order.assistant.id === parseInt(id) || order.assistant.id === id)
            );
            
            if (orderWithAssistant && orderWithAssistant.assistant) {
              assistantData = orderWithAssistant.assistant;
              console.log('Successfully fetched assistant data from orders');
            }
          } catch (ordersError) {
            console.error('Error fetching from orders:', ordersError);
            // Continue to next approach
          }
        }
        
        // Fourth approach: Try to get from the handler dashboard data in localStorage
        if (!assistantData) {
          try {
            // This assumes you have the assistant data in localStorage from the handler dashboard
            const handlerDashboardData = localStorage.getItem('handlerDashboardData');
            if (handlerDashboardData) {
              const parsedData = JSON.parse(handlerDashboardData);
              if (parsedData.assistants && Array.isArray(parsedData.assistants)) {
                assistantData = parsedData.assistants.find(assistant => 
                  assistant.id === parseInt(id) || assistant.id === id
                );
                
                if (assistantData) {
                  console.log('Successfully fetched assistant data from localStorage');
                }
              }
            }
          } catch (localStorageError) {
            console.error('Error fetching from localStorage:', localStorageError);
            // Continue to final check
          }
        }
        
        if (!assistantData) {
          throw new Error('Assistant not found. Please try again later.');
        }
        
        // Try to fetch verification data if available
        try {
          // If we have access to the verification endpoint
          const verificationResponse = await axiosAuth.get(`accounts/assistant/verification-status/`);
          
          if (verificationResponse.data && verificationResponse.data.verification) {
            // Merge verification data with assistant data
            assistantData = {
              ...assistantData,
              verification: verificationResponse.data.verification,
              user_role: verificationResponse.data.verification.user_role,
              area_of_operation: verificationResponse.data.verification.area_of_operation
            };
            console.log('Successfully merged verification data with assistant data');
          }
        } catch (verificationError) {
          console.error('Error fetching verification data:', verificationError);
          // Continue without verification data
        }
        
        setAssistant(assistantData);
        
        // Fetch orders assigned to this assistant
        try {
          console.log(`Fetching orders for assistant ID: ${id}`);
          
          // Try to get orders directly with the assistant query parameter
          let directOrders = [];
          try {
            const directOrdersResponse = await axiosAuth.get(`orders/?assistant=${id}`);
            console.log('Direct query response:', directOrdersResponse.status);
            
            if (Array.isArray(directOrdersResponse.data)) {
              directOrders = directOrdersResponse.data;
            } else if (directOrdersResponse.data.results && Array.isArray(directOrdersResponse.data.results)) {
              directOrders = directOrdersResponse.data.results;
            }
            
            console.log(`Direct query found ${directOrders.length} orders`);
          } catch (directErr) {
            console.error('Error with direct query:', directErr);
          }
          
          // Get all orders as a fallback
          const allOrdersResponse = await axiosAuth.get(`/orders/`);
          let allOrders = [];
          
          if (Array.isArray(allOrdersResponse.data)) {
            allOrders = allOrdersResponse.data;
          } else if (allOrdersResponse.data.results && Array.isArray(allOrdersResponse.data.results)) {
            allOrders = allOrdersResponse.data.results;
          }
          
          console.log(`Total orders fetched: ${allOrders.length}`);
          
          // Strictly filter orders to only include those assigned to this assistant
          const assistantOrders = allOrders.filter(order => {
            const numericId = parseInt(id);
            
            // Log each order for debugging
            console.log(`Checking order ${order.id}:`, 
              order.assistant ? 
                (typeof order.assistant === 'object' ? 
                  `assistant.id=${order.assistant.id}` : 
                  `assistant=${order.assistant}`) : 
                'no assistant');
            
            // Check if order has an assistant property that's an object
            if (order.assistant && typeof order.assistant === 'object') {
              const assistantId = order.assistant.id;
              const isMatch = assistantId === numericId || assistantId === id;
              if (isMatch) console.log(`Match found: order ${order.id} has assistant.id=${assistantId}`);
              return isMatch;
            }
            
            // Check if order has an assistant_id property
            if (order.assistant_id !== undefined) {
              const isMatch = order.assistant_id === numericId || order.assistant_id === id;
              if (isMatch) console.log(`Match found: order ${order.id} has assistant_id=${order.assistant_id}`);
              return isMatch;
            }
            
            // Check if order has an assistant property that's a primitive (like an ID)
            if (order.assistant !== undefined && typeof order.assistant !== 'object') {
              const isMatch = order.assistant === numericId || order.assistant === id;
              if (isMatch) console.log(`Match found: order ${order.id} has assistant=${order.assistant}`);
              return isMatch;
            }
            
            return false;
          });
          
          console.log(`Filtered orders for assistant ID ${id}: ${assistantOrders.length}`);
          
          // Log the first few orders for debugging
          if (allOrders.length > 0) {
            const sampleOrder = allOrders[0];
            console.log('Sample order structure:', JSON.stringify(sampleOrder, null, 2));
            
            // Set debug info
            setDebugInfo({
              orderStructure: JSON.stringify({
                id: sampleOrder.id,
                assistant: sampleOrder.assistant,
                assistant_id: sampleOrder.assistant_id,
                status: sampleOrder.status
              }, null, 2),
              filteringAttempts: allOrders.length,
              matchesFound: assistantOrders.length
            });
          }
          
          // Double-check filtering with a more direct approach
          const doubleCheckedOrders = allOrders.filter(order => {
            // Try to extract assistant ID in any format
            let orderAssistantId = null;
            
            if (order.assistant && typeof order.assistant === 'object' && order.assistant.id) {
              orderAssistantId = order.assistant.id;
            } else if (order.assistant_id) {
              orderAssistantId = order.assistant_id;
            } else if (order.assistant && typeof order.assistant !== 'object') {
              orderAssistantId = order.assistant;
            }
            
            // Convert both to strings for comparison to avoid type issues
            const isMatch = orderAssistantId && String(orderAssistantId) === String(id);
            
            // If we found a match, log it
            if (isMatch) {
              console.log(`Match found in double-check: order ${order.id} has assistant ID ${orderAssistantId}`);
            }
            
            return isMatch;
          });
          
          // Try a third approach - check if the order has a client field that matches the assistant ID
          // This is a fallback in case the data structure is different than expected
          const thirdCheckOrders = allOrders.filter(order => {
            // Check client field if it exists
            if (order.client && typeof order.client === 'object' && order.client.id) {
              const isMatch = String(order.client.id) === String(id);
              if (isMatch) {
                console.log(`Match found in third-check: order ${order.id} has client.id=${order.client.id}`);
              }
              return isMatch;
            }
            
            // Check client_id field if it exists
            if (order.client_id) {
              const isMatch = String(order.client_id) === String(id);
              if (isMatch) {
                console.log(`Match found in third-check: order ${order.id} has client_id=${order.client_id}`);
              }
              return isMatch;
            }
            
            return false;
          });
          
          console.log(`Double-checked filtering found ${doubleCheckedOrders.length} orders`);
          console.log(`Third-check filtering found ${thirdCheckOrders.length} orders`);
          
          // Update debug info with direct query results
          setDebugInfo(prev => ({
            ...prev,
            directQueryResults: directOrders.length
          }));
          
          // Even if direct query found orders, we need to double-check them
          // because the API might return all orders regardless of the query parameter
          if (directOrders.length > 0) {
            console.log(`Direct query returned ${directOrders.length} orders, verifying them`);
            
            // Strictly filter the direct query results to ensure they belong to this assistant
            const verifiedDirectOrders = directOrders.filter(order => {
              const numericId = parseInt(id);
              
              // Check if order has an assistant property that's an object
              if (order.assistant && typeof order.assistant === 'object') {
                return order.assistant.id === numericId || order.assistant.id === id;
              }
              
              // Check if order has an assistant_id property
              if (order.assistant_id !== undefined) {
                return order.assistant_id === numericId || order.assistant_id === id;
              }
              
              // Check if order has an assistant property that's a primitive
              if (order.assistant !== undefined && typeof order.assistant !== 'object') {
                return order.assistant === numericId || order.assistant === id;
              }
              
              return false;
            });
            
            console.log(`Verified direct orders: ${verifiedDirectOrders.length} out of ${directOrders.length}`);
            
            // Update debug info with verified direct results
            setDebugInfo(prev => ({
              ...prev,
              verifiedDirectResults: verifiedDirectOrders.length
            }));
            
            if (verifiedDirectOrders.length > 0) {
              setOrders(verifiedDirectOrders);
              
              // Calculate statistics
              const completedOrders = verifiedDirectOrders.filter(order => order.status === 'completed').length;
              const inProgressOrders = verifiedDirectOrders.filter(order => 
                order.status === 'in_progress' || order.status === 'assigned'
              ).length;
              const cancelledOrders = verifiedDirectOrders.filter(order => order.status === 'cancelled').length;
              
              setStatistics({
                totalOrders: verifiedDirectOrders.length,
                completedOrders,
                inProgressOrders,
                cancelledOrders
              });
              
              return; // Exit early since we found verified orders
            }
          }
          
          // Combine all unique orders from the three approaches
          const allFoundOrders = [...assistantOrders];
          
          // Add orders from double-check that aren't already included
          doubleCheckedOrders.forEach(order => {
            if (!allFoundOrders.some(o => o.id === order.id)) {
              allFoundOrders.push(order);
            }
          });
          
          // Add orders from third-check that aren't already included
          thirdCheckOrders.forEach(order => {
            if (!allFoundOrders.some(o => o.id === order.id)) {
              allFoundOrders.push(order);
            }
          });
          
          console.log(`Combined unique orders: ${allFoundOrders.length}`);
          
          // Final verification step - make absolutely sure we're only showing orders for this assistant
          const finalOrders = allFoundOrders.filter(order => {
            // Convert the assistant ID to a string for comparison
            const assistantIdStr = String(id);
            
            // Check all possible ways an order might be associated with an assistant
            let isAssigned = false;
            
            // Check assistant object
            if (order.assistant && typeof order.assistant === 'object' && order.assistant.id) {
              isAssigned = String(order.assistant.id) === assistantIdStr;
            }
            
            // Check assistant_id field
            if (!isAssigned && order.assistant_id !== undefined) {
              isAssigned = String(order.assistant_id) === assistantIdStr;
            }
            
            // Check assistant field as primitive
            if (!isAssigned && order.assistant !== undefined && typeof order.assistant !== 'object') {
              isAssigned = String(order.assistant) === assistantIdStr;
            }
            
            return isAssigned;
          });
          
          console.log(`Final verified orders count: ${finalOrders.length}`);
          setOrders(finalOrders);
          
          // Calculate statistics
          const completedOrders = assistantOrders.filter(order => order.status === 'completed').length;
          const inProgressOrders = assistantOrders.filter(order => 
            order.status === 'in_progress' || order.status === 'assigned'
          ).length;
          const cancelledOrders = assistantOrders.filter(order => order.status === 'cancelled').length;
          
          setStatistics({
            totalOrders: assistantOrders.length,
            completedOrders,
            inProgressOrders,
            cancelledOrders
          });
        } catch (orderErr) {
          console.error('Error fetching assistant orders:', orderErr);
          // Continue even if orders fetch fails
        }
        
      } catch (err) {
        console.error('Error fetching assistant data:', err);
        setError(err.message || 'Failed to load assistant data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssistantData();
  }, [id]);

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return 'Unknown';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    if (user.verification && user.verification.full_name) {
      return user.verification.full_name;
    }
    
    if (user.first_name) {
      return user.first_name;
    }
    
    if (user.username) {
      return user.username;
    }
    
    return 'Unknown';
  };
  
  // Helper function to get a field value from multiple possible locations
  const getAssistantField = (user, fieldName, defaultValue = 'Not specified') => {
    if (!user) return defaultValue;
    
    // Direct field on user object
    if (user[fieldName] !== undefined && user[fieldName] !== null) {
      return user[fieldName];
    }
    
    // Check in verification object
    if (user.verification && user.verification[fieldName] !== undefined && user.verification[fieldName] !== null) {
      return user.verification[fieldName];
    }
    
    // Special case for area_of_operation which might be in address
    if (fieldName === 'area_of_operation' && user.address) {
      return user.address;
    }
    
    return defaultValue;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get status badge class
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading assistant profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link to="/handler/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Assistant Not Found</h2>
          <p>The assistant you're looking for doesn't exist or you don't have permission to view their profile.</p>
          <Link to="/handler/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Assistant Profile</h1>
          <Link to="/handler/dashboard" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto md:mx-0 flex items-center justify-center text-gray-500">
                  {assistant.profile_picture_url ? (
                    <img 
                      src={assistant.profile_picture_url} 
                      alt={getDisplayName(assistant)} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-xl font-bold mb-2">{getDisplayName(assistant)}</h2>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={getStatusBadgeClass(assistant.is_verified ? 'verified' : 'pending')}>
                    {assistant.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                  
                  <span className="status-badge assistant-type">
                    {getAssistantField(assistant, 'user_role') === 'rider' ? 'Rider' : 
                     getAssistantField(assistant, 'user_role') === 'service_provider' ? 'Service Provider' :
                     getAssistantField(assistant, 'assistant_type', 'Assistant')}
                  </span>
                  
                  {assistant.rating && (
                    <span className="status-badge rating">
                      <span role="img" aria-label="star">⭐</span> {assistant.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Username</p>
                    <p className="font-medium">{assistant.username}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Email</p>
                    <p className="font-medium">{assistant.email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Phone Number</p>
                    <p className="font-medium">{assistant.phone_number || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Joined</p>
                    <p className="font-medium">{formatDate(assistant.date_joined)}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Assistant Type</p>
                    <p className="font-medium">
                      {getAssistantField(assistant, 'user_role') === 'rider' ? 'Rider' : 
                       getAssistantField(assistant, 'user_role') === 'service_provider' ? 'Service Provider' :
                       getAssistantField(assistant, 'assistant_type', 'Standard Assistant')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Area of Operation</p>
                    <p className="font-medium">
                      {getAssistantField(assistant, 'area_of_operation')}
                    </p>
                  </div>
                  
                  {assistant.specialization && (
                    <div className="col-span-2">
                      <p className="text-gray-600 text-sm">Specialization</p>
                      <p className="font-medium">{assistant.specialization}</p>
                    </div>
                  )}
                  
                  {assistant.bio && (
                    <div className="col-span-2">
                      <p className="text-gray-600 text-sm">Bio</p>
                      <p className="font-medium">{assistant.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Assistant Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">Performance Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{statistics.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{statistics.completedOrders}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-600">{statistics.inProgressOrders}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{statistics.cancelledOrders}</p>
                <p className="text-sm text-gray-600">Cancelled</p>
              </div>
            </div>
            
            {statistics.completedOrders > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Completion Rate: 
                  <span className="font-medium ml-1">
                    {Math.round((statistics.completedOrders / statistics.totalOrders) * 100)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info - Only visible in development */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-yellow-800 mb-2">Debug Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-yellow-700"><strong>Assistant ID:</strong> {id}</p>
              <p className="text-sm text-yellow-700"><strong>Total Orders Found:</strong> {orders.length}</p>
              <p className="text-sm text-yellow-700">
                <strong>Assistant Type:</strong> {getAssistantField(assistant, 'user_role', 'Not specified')}
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Area of Operation:</strong> {getAssistantField(assistant, 'area_of_operation', 'Not specified')}
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Filtering Attempts:</strong> {debugInfo.filteringAttempts}
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Matches Found:</strong> {debugInfo.matchesFound}
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Direct Query Results:</strong> {debugInfo.directQueryResults}
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Verified Direct Results:</strong> {debugInfo.verifiedDirectResults}
              </p>
            </div>
            <div>
              <p className="text-sm text-yellow-700"><strong>Sample Order Structure:</strong></p>
              <pre className="text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-40">
                {debugInfo.orderStructure || 'No orders found'}
              </pre>
            </div>
          </div>
        </div>
        
        {/* Assistant's Orders */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Orders Assigned to {getDisplayName(assistant)}</h3>
              <div className="text-sm text-gray-500">
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {typeof order.id === 'string' ? order.id.substring(0, 8) : order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.order_type?.name || order.service_type || 'Standard Order'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeClass(order.status)}>
                            {order.status ? order.status.split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ') : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 italic">No orders have been assigned to this assistant yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantProfilePage;
