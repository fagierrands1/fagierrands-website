import axios from '../utils/axiosConfig';
import { getApiServerUrl } from '../utils/environment';

// Get API base URL from environment utility
const API_BASE_URL = getApiServerUrl();

// Dashboard API endpoints
export const dashboardApi = {
  // Get dashboard overview data
  getOverview: async (queryParams = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build query string from parameters
      const queryString = Object.keys(queryParams).length > 0 
        ? '?' + new URLSearchParams(queryParams).toString()
        : '';
      
      // Try different URL patterns to find the working one
      const urls = [
        `${API_BASE_URL}/api/dashboard/overview/${queryString}`,
        `${API_BASE_URL}/dashboard/overview/${queryString}`,
        `api/dashboard/overview/${queryString}`,
        `/api/dashboard/overview/${queryString}`
      ];
      
      let lastError = null;
      
      // Try each URL pattern
      for (const url of urls) {
        try {
          console.log(`Trying dashboard URL: ${url}`);
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          });
          
          console.log(`Success with URL: ${url}`);
          
          // Format the data
          const formattedData = {
            ...response.data,
            total_revenue: parseFloat(response.data.total_revenue || 0),
            revenue_last_30_days: parseFloat(response.data.revenue_last_30_days || 0),
            revenue_growth_rate: parseFloat(response.data.revenue_growth_rate || 0),
            user_growth_rate: parseFloat(response.data.user_growth_rate || 0),
            avg_order_value: parseFloat(response.data.avg_order_value || 0),
            avg_rating: parseFloat(response.data.avg_rating || 0),
            avg_order_completion_time: parseFloat(response.data.avg_order_completion_time || 0),
            avg_response_time: parseFloat(response.data.avg_response_time || 0)
          };
          
          return { success: true, data: formattedData };
        } catch (err) {
          console.log(`Failed with URL: ${url}`, err);
          lastError = err;
        }
      }
      
      // If all URLs failed, throw the last error
      throw lastError || new Error('All dashboard URL patterns failed');
    } catch (error) {
      console.error('Dashboard API error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.message || 'Unknown error occurred'
      };
    }
  },
  
  // Get live metrics data
  getLiveMetrics: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/live-metrics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Live metrics API error:', error);
      return {
        success: false,
        error: error.response?.status || 'unknown',
        message: error.response?.data?.detail || error.message || 'Unknown error occurred'
      };
    }
  }
};

export default dashboardApi;