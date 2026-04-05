import React from 'react';
import { 
  FaUsers, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaStar, 
  FaClock, 
  FaArrowUp, 
  FaArrowDown 
} from 'react-icons/fa';
import './DashboardOverview.css';

const DashboardOverview = ({ data }) => {
  if (!data) {
    return <div>No data available</div>;
  }

  // Format duration (e.g., "2 hours 30 minutes")
  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    // Handle timedelta objects from Django (they come as strings like "2:30:00")
    let seconds;
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else {
      seconds = duration;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Format rating safely
  const formatRating = (rating) => {
    return (rating || 0).toFixed(1);
  };

  // Determine growth indicator
  const getGrowthIndicator = (value) => {
    if (value > 0) {
      return <FaArrowUp className="text-green-500" />;
    } else if (value < 0) {
      return <FaArrowDown className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="dashboard-overview-container">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Metrics Card */}
        <div className="bg-white rounded-lg shadow p-6 dashboard-card">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaUsers className="text-blue-500 text-xl" />
            </div>
            <h3 className="text-lg font-medium">User Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{(data.total_users || 0).toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">New Users (30d)</p>
                <p className="text-lg font-semibold">{(data.new_users_last_30_days || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Users (30d)</p>
                <p className="text-lg font-semibold">{(data.active_users_last_30_days || 0).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <p className="text-gray-500 text-sm mr-2">Growth Rate:</p>
              <p className={`font-semibold flex items-center ${(data.user_growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getGrowthIndicator(data.user_growth_rate || 0)}
                <span className="ml-1">{formatPercentage(data.user_growth_rate)}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Order Metrics Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaShoppingCart className="text-green-500 text-xl" />
            </div>
            <h3 className="text-lg font-medium">Order Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{(data.total_orders || 0).toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">New Orders (30d)</p>
                <p className="text-lg font-semibold">{(data.new_orders_last_30_days || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed Orders (30d)</p>
                <p className="text-lg font-semibold">{(data.completed_orders_last_30_days || 0).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <p className="text-gray-500 text-sm mr-2">Completion Rate:</p>
              <p className="font-semibold text-blue-600">{formatPercentage(data.order_completion_rate)}</p>
            </div>
          </div>
        </div>
        
        {/* Revenue Metrics Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaMoneyBillWave className="text-purple-500 text-xl" />
            </div>
            <h3 className="text-lg font-medium">Revenue Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</p>
            </div>
            
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Revenue (30d)</p>
                <p className="text-lg font-semibold">{formatCurrency(data.revenue_last_30_days)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg Order Value</p>
                <p className="text-lg font-semibold">{formatCurrency(data.avg_order_value)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <p className="text-gray-500 text-sm mr-2">Growth Rate:</p>
              <p className={`font-semibold flex items-center ${(data.revenue_growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getGrowthIndicator(data.revenue_growth_rate || 0)}
                <span className="ml-1">{formatPercentage(data.revenue_growth_rate)}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Customer Satisfaction Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <FaStar className="text-yellow-500 text-xl" />
            </div>
            <h3 className="text-lg font-medium">Customer Satisfaction</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">NPS Score</p>
                <p className="text-2xl font-bold">{data.nps_score || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Average Rating</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold mr-2">{formatRating(data.avg_rating)}</p>
                  <FaStar className="text-yellow-500" />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-2">NPS Classification</p>
              <div className="flex items-center">
                <div className={`h-2 flex-grow rounded-l ${(data.nps_score || 0) < 0 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-grow ${(data.nps_score || 0) >= 0 && (data.nps_score || 0) <= 30 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-grow ${(data.nps_score || 0) > 30 && (data.nps_score || 0) <= 70 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-grow rounded-r ${(data.nps_score || 0) > 70 ? 'bg-green-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Needs Improvement</span>
                <span>Good</span>
                <span>Excellent</span>
                <span>World Class</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <FaClock className="text-red-500 text-xl" />
            </div>
            <h3 className="text-lg font-medium">Performance Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Avg Order Completion Time</p>
              <p className="text-xl font-bold">{formatDuration(data.avg_order_completion_time)}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Avg Response Time</p>
              <p className="text-xl font-bold">{formatDuration(data.avg_response_time)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;