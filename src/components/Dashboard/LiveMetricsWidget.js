import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axiosConfig';
import { 
  FaUsers, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaClock,
  FaCircle,
  FaSync,
  FaWifi,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useWebSocket } from '../../contexts/WebSocketContext';
import config from '../../config';
import './LiveMetricsWidget.css';

const LiveMetricsWidget = () => {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    activeOrders: 0,
    revenueToday: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const { connected: wsConnected } = useWebSocket();
  
  // Fetch live metrics from API
  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      setIsPolling(true);
      const response = await axios.get('/dashboard/live-metrics/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMetrics(response.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching live metrics:', err);
      setError('Failed to fetch metrics');
    } finally {
      setIsPolling(false);
      setLoading(false);
    }
  }, []);
  
  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };
  
  // Metric card component
  const MetricCard = ({ icon: Icon, title, value, subtitle, color, isLive }) => (
    <div className={`live-metric-card ${isLive ? 'live' : ''}`}>
      <div className="live-metric-card-header">
        <div className={`live-metric-icon-wrapper ${color}`}>
          <Icon className={`live-metric-icon ${color}`} />
        </div>
        <div className="live-metric-info">
          <h3 className="live-metric-title">{title}</h3>
          <p className="live-metric-value">{value}</p>
          {subtitle && (
            <p className="live-metric-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="live-metrics-loading">
        <div className="live-metrics-loading-spinner"></div>
        <span>Loading metrics...</span>
      </div>
    );
  }
  
  return (
    <div className="live-metrics-widget">
      {/* Header */}
      <div className="live-metrics-header">
        <div className="live-metrics-header-content">
          <div>
            <h2 className="live-metrics-title">Live Metrics</h2>
            <div className={`live-metrics-status ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? (
                <>
                  <FaWifi />
                  <span>WebSocket Connected</span>
                </>
              ) : (
                <>
                  <FaExclamationTriangle />
                  <span>Polling Mode</span>
                </>
              )}
              <span>•</span>
              <span>Updated {formatTimeAgo(lastUpdate)}</span>
            </div>
          </div>
          
          <button
            onClick={fetchMetrics}
            disabled={isPolling}
            className="live-metrics-refresh-btn"
          >
            <FaSync className={isPolling ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
        
        {error && (
          <div className="live-metrics-error">
            {error}
          </div>
        )}
      </div>
      
      {/* Metrics Grid */}
      <div className="live-metrics-grid">
        <MetricCard
          icon={FaUsers}
          title="Active Users"
          value={metrics.activeUsers?.toLocaleString() || '0'}
          subtitle="Currently online"
          color="blue"
          isLive={wsConnected}
        />
        
        <MetricCard
          icon={FaShoppingCart}
          title="Active Orders"
          value={metrics.activeOrders?.toLocaleString() || '0'}
          subtitle="In progress"
          color="green"
          isLive={wsConnected}
        />
        
        <MetricCard
          icon={FaMoneyBillWave}
          title="Revenue Today"
          value={formatCurrency(metrics.revenueToday || 0)}
          subtitle="Total earnings"
          color="purple"
          isLive={wsConnected}
        />
        
        <MetricCard
          icon={FaClock}
          title="Avg Response"
          value={metrics.avgResponseTime ? `${(metrics.avgResponseTime / 1000).toFixed(1)}s` : 'N/A'}
          subtitle="System performance"
          color="red"
          isLive={wsConnected}
        />
      </div>
      
      {/* Quick Stats */}
      <div className="live-quick-stats">
        <h3 className="live-quick-stats-title">Quick Stats</h3>
        <div className="live-quick-stats-grid">
          <div className="live-quick-stat-item">
            <p className="live-quick-stat-label">Total Users</p>
            <p className="live-quick-stat-value blue">{metrics.totalUsers || 0}</p>
          </div>
          <div className="live-quick-stat-item">
            <p className="live-quick-stat-label">Completed Today</p>
            <p className="live-quick-stat-value green">{metrics.completedToday || 0}</p>
          </div>
          <div className="live-quick-stat-item">
            <p className="live-quick-stat-label">Online Assistants</p>
            <p className="live-quick-stat-value purple">{metrics.onlineAssistants || 0}</p>
          </div>
          <div className="live-quick-stat-item">
            <p className="live-quick-stat-label">Pending Orders</p>
            <p className="live-quick-stat-value red">{metrics.pendingOrders || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMetricsWidget;

