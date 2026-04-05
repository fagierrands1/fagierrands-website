// Updated order service without using hooks directly in service functions
import api from './api';

// Create an order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/api/orders/', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error creating order' };
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/api/orders/${orderId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching order' };
  }
};

// Get current user's orders
export const getUserOrders = async () => {
  try {
    const response = await api.get('/api/orders/user/');
    return response.data;
  } catch (error) {
    // Enhanced error handling with specific messages for auth issues
    if (error.response?.status === 401) {
      throw { message: 'You must be logged in to view your orders' };
    }
    throw error.response?.data || { message: 'Error fetching user orders' };
  }
};

// Get orders for an assistant
export const fetchAssistantOrders = async () => {
  try {
    console.log('Fetching assistant orders...');
    
    // Let the backend handle authentication checks
    const response = await api.get('/api/orders/assistant/');
    console.log('Assistant orders API response status:', response.status);
    console.log('Assistant orders API response headers:', response.headers);
    
    // Log the data structure
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log(`Received array of ${response.data.length} orders`);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        console.log(`Received paginated response with ${response.data.results.length} orders`);
      } else {
        console.log('Received data structure:', Object.keys(response.data));
      }
    }
    
    // Return the data directly
    return response.data;
  } catch (error) {
    console.error('Error in fetchAssistantOrders:', error);
    console.error('Error details:', error.response?.data);
    
    // Handle specific error responses from our updated backend
    if (error.response?.status === 401) {
      throw { message: 'Authentication required to access assistant orders' };
    } else if (error.response?.status === 403) {
      throw { message: 'Only assistants can access these orders' };
    }
    throw error.response?.data || { message: 'Error fetching assistant orders' };
  }
};

// Get all orders (admin only)
export const fetchAllOrders = async () => {
  try {
    // Let the backend handle permission checks
    const response = await api.get('/api/orders/');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw { message: 'Authentication required to access all orders' };
    } else if (error.response?.status === 403) {
      throw { message: 'Admin privileges required to view all orders' };
    }
    throw error.response?.data || { message: 'Error fetching all orders' };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/api/orders/${orderId}/status/`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating order status' };
  }
};

// Assign order to assistant
export const assignOrderToAssistant = async (orderId, assistantId) => {
  try {
    const response = await api.put(`/api/orders/${orderId}/assign/`, { assistantId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error assigning order' };
  }
};

// Add item to order
export const addOrderItem = async (orderId, item) => {
  try {
    const response = await api.post(`/api/orders/${orderId}/items/`, item);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error adding order item' };
  }
};

// Update order item
export const updateOrderItem = async (orderId, itemId, item) => {
  try {
    const response = await api.put(`/api/orders/${orderId}/items/${itemId}/`, item);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating order item' };
  }
};

// Remove order item
export const removeOrderItem = async (orderId, itemId) => {
  try {
    const response = await api.delete(`/api/orders/${orderId}/items/${itemId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error removing order item' };
  }
};

// Rate order
export const rateOrder = async (orderId, rating, review) => {
  try {
    const response = await api.post(`/api/orders/${orderId}/rating/`, { rating, review });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error submitting rating' };
  }
};

// Update order price based on pickup and delivery locations
export const updateOrderPriceRealtime = async (orderId) => {
  try {
    const response = await api.post(`/api/orders/${orderId}/update_price_realtime/`);
    return response.data;
  } catch (error) {
    console.error('Error updating order price:', error);
    throw error.response?.data || { message: 'Error updating order price' };
  }
};