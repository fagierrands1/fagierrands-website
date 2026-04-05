import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaStar, 
  FaClock, 
  FaArrowUp, 
  FaArrowDown,
  FaCircle,
  FaSync,
  FaBell,
  FaEye
} from 'react-icons/fa';
import DashboardOverview from './DashboardOverview';
import LiveMetricsWidget from './LiveMetricsWidget';
import RealTimeOrderWidget from './RealTimeOrderWidget';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useOrderNotifications from '../../hooks/useOrderNotifications';
import axios from '../../utils/axiosConfig';
import './EnhancedDashboardOverview.css';

const EnhancedDashboardOverview = ({ data }) => {
  const [showLiveMetrics, setShowLiveMetrics] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [userRole, setUserRole] = useState(null);
  
  const { connected: wsConnected, orderLocations } = useWebSocket();
  const { addRealTimeNotification } = useNotifications();
  
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get('orders/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orders = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.orders || []);
      
      setCurrentOrders(orders);
      console.log('[EnhancedDashboardOverview] Fetched orders:', orders.length);
    } catch (error) {
      console.error('[EnhancedDashboardOverview] Error fetching orders:', error.message);
    }
  };

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await axios.get('accounts/user/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserRole(response.data?.user_type || null);
      } catch (error) {
        console.error('[EnhancedDashboardOverview] Error fetching user role:', error.message);
      }
    };

    getUserRole();
    fetchOrders();
  }, []);

  // Custom hook for order notifications (disabled temporarily)
  // useOrderNotifications(currentOrders, fetchOrders, {
  //   enabled: true,
  //   pollInterval: 30000,
  //   showBrowserNotification: true,
  //   notificationTitle: 'New Order Received',
  //   userRole: userRole
  // });
  
  // Simulate recent activities (in a real app, this would come from WebSocket or API)
  useEffect(() => {
    const activities = [
      { id: 1, type: 'order', message: 'New order #1234 created', time: new Date(), icon: FaShoppingCart },
      { id: 2, type: 'user', message: 'New user registered', time: new Date(Date.now() - 300000), icon: FaUsers },
      { id: 3, type: 'payment', message: 'Payment completed for order #1233', time: new Date(Date.now() - 600000), icon: FaMoneyBillWave },
      { id: 4, type: 'order', message: 'Order #1232 completed', time: new Date(Date.now() - 900000), icon: FaShoppingCart },
    ];
    setRecentActivities(activities);
    
    // Simulate notifications
    const notifs = [
      { id: 1, type: 'info', message: 'System performance is optimal', time: new Date() },
      { id: 2, type: 'warning', message: '5 orders pending assignment', time: new Date(Date.now() - 1800000) },
    ];
    setNotificationsList(notifs);
  }, []);
  
  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };
  
  // Activity item component
  const ActivityItem = ({ activity }) => {
    const Icon = activity.icon;
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
        <div className="flex-shrink-0">
          <Icon className="text-blue-500 text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{activity.message}</p>
          <p className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</p>
        </div>
      </div>
    );
  };
  
  // Notification item component
  const NotificationItem = ({ notification }) => (
    <div className={`flex items-center justify-between p-2 rounded border-l-4 ${
      notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
      notification.type === 'error' ? 'border-red-500 bg-red-50' :
      'border-blue-500 bg-blue-50'
    }`}>
      <div className="flex items-center space-x-2">
        <FaBell className={
          notification.type === 'warning' ? 'text-yellow-500' :
          notification.type === 'error' ? 'text-red-500' :
          'text-blue-500'
        } />
        <div>
          <p className="text-sm font-medium">{notification.message}</p>
          <p className="text-xs text-gray-500">{formatTimeAgo(notification.time)}</p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="enhanced-dashboard-overview">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <FaCircle className={`text-xs ${wsConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span className={wsConnected ? 'text-green-600' : 'text-gray-500'}>
              {wsConnected ? 'Real-time updates active' : 'Real-time updates unavailable'}
            </span>
            {orderLocations.length > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{orderLocations.length} active tracking sessions</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowLiveMetrics(!showLiveMetrics)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              showLiveMetrics ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <FaEye />
            <span>Live Metrics</span>
          </button>
        </div>
      </div>
      
      {/* Live Metrics Widget */}
      {showLiveMetrics && (
        <div className="mb-6">
          <LiveMetricsWidget />
        </div>
      )}
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dashboard Overview */}
        <div className="lg:col-span-2">
          <DashboardOverview data={data} />
        </div>
        
        {/* Sidebar with Activities and Notifications */}
        <div className="space-y-6">
          {/* Real-Time Order Tracking */}
          <RealTimeOrderWidget />
          
          {/* Notifications */}
          {notificationsList.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaBell className="mr-2 text-red-500" />
                  Notifications
                </h3>
                <span className="text-sm text-gray-500">{notificationsList.length}</span>
              </div>
              <div className="space-y-2">
                {notificationsList.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}
          
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center">
                <FaCircle className="mr-2 text-blue-500 text-xs animate-pulse" />
                Recent Activities
              </h3>
              <span className="text-sm text-gray-500">{recentActivities.length}</span>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {recentActivities.length > 0 ? (
                <div className="space-y-1">
                  {recentActivities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activities</p>
              )}
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">WebSocket Connection</span>
                <div className="flex items-center space-x-1">
                  <FaCircle className={`text-xs ${wsConnected ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Tracking Sessions</span>
                <span className="text-sm font-medium">{orderLocations.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <div className="flex items-center space-x-1">
                  <FaCircle className="text-xs text-green-500" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardOverview;