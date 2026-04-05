import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const AnalyticsDebugger = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Testing API connectivity...');
        
        // First test basic connectivity
        try {
          const healthCheck = await axios.get('/');
          console.log('✅ Backend server is reachable');
        } catch (healthErr) {
          console.warn('⚠️ Backend connectivity issue:', healthErr.message);
        }
        
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        
        console.log('🔍 Fetching analytics data...');
        const response = await axios.get('api/dashboard/overview/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout for dashboard requests
        });
        console.log('✅ Analytics API Response:', response);
        console.log('📊 Data received:', response.data);
        setData(response.data);
      } catch (err) {
        console.error('❌ Error fetching analytics:', err);
        console.log('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config,
          url: err.config?.url
        });
        
        // Enhanced error handling
        if (err.response?.status === 500) {
          console.error('Server error (500) detected. This might be related to data serialization issues.');
          
          // Try to fetch a simplified version of the data
          try {
            // Get token again to ensure it's in scope
            const authToken = localStorage.getItem('authToken');
            
            console.log('Attempting to fetch simplified metrics...');
            const simpleResponse = await axios.get('api/dashboard/live-metrics/', {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            });
            
            console.log('✅ Simplified metrics received:', simpleResponse.data);
            setData({
              total_users: simpleResponse.data.user_count || 0,
              new_users_last_30_days: simpleResponse.data.new_users || 0,
              active_users_last_30_days: simpleResponse.data.active_users || 0,
              user_growth_rate: 0,
              total_orders: simpleResponse.data.order_count || 0,
              new_orders_last_30_days: simpleResponse.data.new_orders || 0,
              completed_orders_last_30_days: simpleResponse.data.completed_orders || 0,
              order_completion_rate: 0,
              total_revenue: simpleResponse.data.revenue || 0,
              revenue_last_30_days: 0,
              revenue_growth_rate: 0,
              avg_order_value: 0,
              nps_score: 0,
              avg_rating: 0,
              avg_order_completion_time: 0,
              avg_response_time: 0
            });
            
            // Still show the error but note that we have fallback data
            err.fallbackDataLoaded = true;
          } catch (fallbackErr) {
            console.error('Failed to load fallback metrics:', fallbackErr);
          }
        }
        
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', margin: '20px' }}>
        <h3>🔄 Loading Analytics Data...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: '#fee', borderRadius: '8px', margin: '20px' }}>
        <h3>❌ Analytics API Error</h3>
        <p><strong>Message:</strong> {error.message}</p>
        <p><strong>Status:</strong> {error.response?.status}</p>
        <p><strong>URL:</strong> {error.config?.url}</p>
        
        {error.fallbackDataLoaded && (
          <div style={{ background: '#efe', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
            <p>✅ <strong>Fallback data loaded successfully.</strong> Some metrics are available.</p>
          </div>
        )}
        
        {error.response?.status === 500 && (
          <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
            <p>⚠️ <strong>Server Error (500)</strong></p>
            <p>This is likely due to a data serialization issue in the dashboard overview endpoint.</p>
            <p>The development team has been notified and is working on a fix.</p>
          </div>
        )}
        
        <details>
          <summary>Raw Error Details</summary>
          <pre>{JSON.stringify(error.response?.data, null, 2)}</pre>
        </details>
        
        {data && (
          <div style={{ marginTop: '15px' }}>
            <h4>Available Data:</h4>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f0f8f0', borderRadius: '8px', margin: '20px' }}>
      <h3>✅ Analytics Data Retrieved Successfully</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>👥 Users</h4>
          <p>Total: <strong>{data.total_users}</strong></p>
          <p>New (30d): <strong>{data.new_users_last_30_days}</strong></p>
          <p>Active (30d): <strong>{data.active_users_last_30_days}</strong></p>
          <p>Growth: <strong>{data.user_growth_rate?.toFixed(1)}%</strong></p>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>📦 Orders</h4>
          <p>Total: <strong>{data.total_orders}</strong></p>
          <p>New (30d): <strong>{data.new_orders_last_30_days}</strong></p>
          <p>Completed (30d): <strong>{data.completed_orders_last_30_days}</strong></p>
          <p>Completion Rate: <strong>{data.order_completion_rate?.toFixed(1)}%</strong></p>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>💰 Revenue</h4>
          <p>Total: <strong>KES {data.total_revenue?.toLocaleString()}</strong></p>
          <p>Last 30d: <strong>KES {data.revenue_last_30_days?.toLocaleString()}</strong></p>
          <p>Growth: <strong>{data.revenue_growth_rate?.toFixed(1)}%</strong></p>
          <p>Avg Order: <strong>KES {data.avg_order_value?.toLocaleString()}</strong></p>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>⭐ Satisfaction</h4>
          <p>NPS Score: <strong>{data.nps_score}</strong></p>
          <p>Avg Rating: <strong>{data.avg_rating}/5</strong></p>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>⚡ Performance</h4>
          <p>Completion Time: <strong>{Math.round(data.avg_order_completion_time / 3600)}h</strong></p>
          <p>Response Time: <strong>{Math.round(data.avg_response_time / 60)}min</strong></p>
        </div>
      </div>

      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', padding: '10px', background: '#e0e0e0', borderRadius: '4px' }}>
          View Raw API Response
        </summary>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default AnalyticsDebugger;