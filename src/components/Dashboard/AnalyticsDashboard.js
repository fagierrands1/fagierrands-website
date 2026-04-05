import React, { useState, useEffect } from 'react';
import { FaCircle, FaArrowUp, FaUsers, FaShoppingCart, FaChartLine, FaBell, FaEye, FaCalendarAlt } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import { dashboardApi } from '../../services/dashboardApi';
import KPISection from './KPISection';
import RevenueMetricsSection from './RevenueMetricsSection';
import UserMetricsSection from './UserMetricsSection';
import PerformanceMetricsSection from './PerformanceMetricsSection';
import OrderAnalyticsSection from './OrderAnalyticsSection';
import NotificationsWidget from './NotificationsWidget';
import LiveMetricsWidget from './LiveMetricsWidget';
import QuickActionsWidget from './QuickActionsWidget';
import CustomDatePicker from './CustomDatePicker';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [activeTimeRange, setActiveTimeRange] = useState('30D');
  const [isLive, setIsLive] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDateLabel, setCustomDateLabel] = useState('');

  // Fetch analytics data from backend
  const fetchAnalyticsData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data using dashboardApi service...');
      
      // Prepare query parameters based on selected time range
      let queryParams = {};
      if (activeTimeRange === 'Custom' && customStartDate && customEndDate) {
        queryParams = {
          start_date: customStartDate,
          end_date: customEndDate
        };
      } else if (activeTimeRange !== 'Custom') {
        queryParams = {
          time_range: activeTimeRange
        };
      }
      
      const result = await dashboardApi.getOverview(queryParams);
      
      if (result.success) {
        console.log('Analytics API Response:', result.data);
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin permissions required.');
      } else if (err.response?.status === 404) {
        setError('Analytics API endpoint not found.');
      } else if (err.response?.status === 500) {
        setError('Server error. The analytics service is currently unavailable.');
        
        // Retry logic for 500 errors (server errors)
        if (retryCount < 2) { // Try up to 2 more times
          console.log(`Retrying dashboard request (${retryCount + 1}/2)...`);
          setTimeout(() => fetchAnalyticsData(retryCount + 1), 3000); // Wait 3 seconds before retry
          return; // Exit early to prevent setting fallback data
        }
      } else {
        setError(err.response?.data?.detail || err.message);
      }
      
      // Try to get live metrics as fallback
      try {
        console.log('Attempting to fetch live metrics as fallback...');
        const liveMetricsResult = await dashboardApi.getLiveMetrics();
        
        if (liveMetricsResult.success) {
          console.log('Live metrics received as fallback:', liveMetricsResult.data);
          
          // Create a minimal dashboard data object from live metrics
          setData({
            total_users: liveMetricsResult.data.user_count || 0,
            total_orders: liveMetricsResult.data.order_count || 0,
            total_revenue: liveMetricsResult.data.revenue || 0,
            new_users_last_30_days: liveMetricsResult.data.new_users || 0,
            active_users_last_30_days: liveMetricsResult.data.active_users || 0,
            completed_orders_last_30_days: liveMetricsResult.data.completed_orders || 0,
            revenue_last_30_days: 0,
            revenue_growth_rate: 0,
            user_growth_rate: 0,
            avg_order_value: 0,
            nps_score: 0,
            avg_rating: 0,
            avg_order_completion_time: 0,
            avg_response_time: 0
          });
          
          // Still show error but note that we have fallback data
          setError('Using limited data. Some metrics may not be available.');
        } else {
          // Fallback to mock data if all API calls fail
          setData({
            total_users: 0,
            total_orders: 0,
            total_revenue: 0,
            new_users_last_30_days: 0,
            active_users_last_30_days: 0,
            completed_orders_last_30_days: 0,
            revenue_last_30_days: 0,
            revenue_growth_rate: 0,
            user_growth_rate: 0,
            avg_order_value: 0,
            nps_score: 0,
            avg_rating: 0,
            avg_order_completion_time: 0,
            avg_response_time: 0
          });
        }
      } catch (fallbackErr) {
        console.error('Failed to load fallback metrics:', fallbackErr);
        
        // Fallback to mock data if all API calls fail
        setData({
          total_users: 0,
          total_orders: 0,
          total_revenue: 0,
          new_users_last_30_days: 0,
          active_users_last_30_days: 0,
          completed_orders_last_30_days: 0,
          revenue_last_30_days: 0,
          revenue_growth_rate: 0,
          user_growth_rate: 0,
          avg_order_value: 0,
          nps_score: 0,
          avg_rating: 0,
          avg_order_completion_time: 0,
          avg_response_time: 0
        });
      }
    } finally {
      if (retryCount === 0 || retryCount >= 2) { // Only set loading to false if not retrying or after final retry
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Refetch data when time range changes
  useEffect(() => {
    if (data) {
      fetchAnalyticsData();
    }
  }, [activeTimeRange, customStartDate, customEndDate]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Simulate live indicator animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="analytics-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="analytics-dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load analytics</h3>
        <p>{error}</p>
        <button onClick={fetchAnalyticsData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  const timeRangeOptions = ['7D', '30D', '90D', 'Custom'];

  // Handle custom date range selection
  const handleCustomDateRange = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setActiveTimeRange('Custom');
    
    // Create a readable label for the custom range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    setCustomDateLabel(label);
    
    // Fetch data with new range
    fetchAnalyticsData();
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    if (range === 'Custom') {
      setIsCustomDatePickerOpen(true);
    } else {
      setActiveTimeRange(range);
      setCustomStartDate('');
      setCustomEndDate('');
      setCustomDateLabel('');
    }
  };

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="header-title">Analytics Dashboard</h1>
          
          {/* Header Controls */}
          <div className="header-controls">
            {/* Time Range Filter */}
            <div className="time-range-filter">
              <span className="filter-label">Time Range:</span>
              <div className="time-range-buttons">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option}
                    className={`time-range-btn ${activeTimeRange === option ? 'active' : ''}`}
                    onClick={() => handleTimeRangeChange(option)}
                  >
                    {option === 'Custom' && customDateLabel ? (
                      <span className="custom-date-label">
                        <FaCalendarAlt className="custom-date-icon" />
                        {customDateLabel}
                      </span>
                    ) : (
                      option
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Indicator */}
            <div className="live-indicator">
              <FaCircle 
                className={`live-dot ${isLive ? 'animate' : ''}`}
              />
              <span className="live-text">LIVE</span>
            </div>

            {/* Header Icons */}
            <div className="header-icons">
              <div className="header-icon"></div>
              <div className="header-icon"></div>
              <div className="header-icon"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="analytics-container">
        {/* Full Width Horizontal Widgets */}
        <div className="horizontal-widgets-section">
          <div className="horizontal-widget-container">
            <QuickActionsWidget data={data} />
          </div>

          <div className="horizontal-widget-container">
            <LiveMetricsWidget />
          </div>
        </div>

        {/* Full Width KPI Section */}
        <div className="horizontal-widget-container">
          <KPISection 
            data={data} 
            timeRange={activeTimeRange}
          />
        </div>

        {/* Full Width Notifications Section */}
        <div className="horizontal-widget-container">
          <NotificationsWidget data={data} />
        </div>

        {/* Full Width Metrics Sections */}
        <div className="horizontal-widget-container">
          <RevenueMetricsSection 
            data={data} 
            timeRange={activeTimeRange}
          />
        </div>

        <div className="horizontal-widget-container">
          <UserMetricsSection 
            data={data} 
            timeRange={activeTimeRange}
          />
        </div>

        <div className="horizontal-widget-container">
          <PerformanceMetricsSection 
            data={data} 
            timeRange={activeTimeRange}
          />
        </div>

        <div className="horizontal-widget-container">
          <OrderAnalyticsSection 
            data={data} 
            timeRange={activeTimeRange}
          />
        </div>

        
      </div>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker
        isOpen={isCustomDatePickerOpen}
        onClose={() => setIsCustomDatePickerOpen(false)}
        onApply={handleCustomDateRange}
        initialStartDate={customStartDate}
        initialEndDate={customEndDate}
      />
    </div>
  );
};

export default AnalyticsDashboard;