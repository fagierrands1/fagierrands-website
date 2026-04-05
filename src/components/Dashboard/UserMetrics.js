import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaUsers, FaUserPlus, FaUserCheck, FaCircle, FaSync } from 'react-icons/fa';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);



const UserMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days
  const [userGrowthData, setUserGrowthData] = useState(null);
  const [activeUsersData, setActiveUsersData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  
  // WebSocket integration for real-time updates
  const { connected: wsConnected, orderLocations } = useWebSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Fetch user growth data
        const userGrowthResponse = await axios.get(
          `/dashboard/daily-metrics/time_series/?metric=total_users&days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch active users data
        const activeUsersResponse = await axios.get(
          `/dashboard/daily-metrics/time_series/?metric=active_users&days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch user retention data
        const retentionResponse = await axios.get(
          `/dashboard/user-retention/cohort_analysis/?months=6`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setUserGrowthData(userGrowthResponse.data);
        setActiveUsersData(activeUsersResponse.data);
        setRetentionData(retentionResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user metrics:', err);
        setError('Failed to load user metrics. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const prepareChartData = (data, label, color) => {
    if (!data || !data.length) return null;
    
    return {
      labels: data.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: label,
          data: data.map(item => item.value),
          fill: false,
          backgroundColor: color,
          borderColor: color,
          tension: 0.1
        }
      ]
    };
  };

  const prepareRetentionHeatmap = () => {
    if (!retentionData || !retentionData.length) return null;
    
    // Sort cohorts by date (newest first)
    const sortedCohorts = [...retentionData].sort((a, b) => 
      new Date(b.cohort_date) - new Date(a.cohort_date)
    );
    
    // Take only the last 6 cohorts
    const recentCohorts = sortedCohorts.slice(0, 6);
    
    // Prepare data for heatmap
    return {
      cohorts: recentCohorts.map(cohort => ({
        date: new Date(cohort.cohort_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        size: cohort.cohort_size,
        week1: cohort.week_1,
        week2: cohort.week_2,
        week4: cohort.week_4,
        month1: cohort.month_1,
        month2: cohort.month_2,
        month3: cohort.month_3,
        month6: cohort.month_6
      }))
    };
  };

  // Get color based on retention percentage
  const getRetentionColor = (value) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 50) return 'bg-green-400';
    if (value >= 30) return 'bg-yellow-400';
    if (value >= 20) return 'bg-yellow-500';
    if (value >= 10) return 'bg-orange-400';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const userGrowthChartData = prepareChartData(userGrowthData, 'Total Users', 'rgba(59, 130, 246, 0.8)');
  const activeUsersChartData = prepareChartData(activeUsersData, 'Active Users', 'rgba(16, 185, 129, 0.8)');
  const retentionHeatmap = prepareRetentionHeatmap();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">User Metrics</h2>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <FaCircle className={`text-xs ${wsConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span className={wsConnected ? 'text-green-600' : 'text-gray-500'}>
              {wsConnected ? 'Real-time tracking active' : 'Historical data only'}
            </span>
            {orderLocations.length > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{orderLocations.length} active sessions</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 rounded ${timeRange === 7 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 rounded ${timeRange === 30 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            30 Days
          </button>
          <button 
            onClick={() => setTimeRange(90)}
            className={`px-3 py-1 rounded ${timeRange === 90 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            90 Days
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaUsers className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Total Users</h3>
              <p className="text-2xl font-bold">
                {userGrowthData && userGrowthData.length > 0 
                  ? userGrowthData[userGrowthData.length - 1].value.toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        {/* New Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaUserPlus className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">New Users (Last {timeRange} days)</h3>
              <p className="text-2xl font-bold">
                {userGrowthData && userGrowthData.length > 0 
                  ? (userGrowthData[userGrowthData.length - 1].value - userGrowthData[0].value).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Active Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaUserCheck className="text-purple-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Active Users (Last {timeRange} days)</h3>
              <p className="text-2xl font-bold">
                {activeUsersData && activeUsersData.length > 0 
                  ? activeUsersData.reduce((sum, item) => sum + item.value, 0).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">User Growth</h3>
          {userGrowthChartData ? (
            <div className="h-80">
              <Line 
                data={userGrowthChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
        
        {/* Active Users Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Daily Active Users</h3>
          {activeUsersChartData ? (
            <div className="h-80">
              <Line 
                data={activeUsersChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
      
      {/* User Retention Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">User Retention by Cohort</h3>
        {retentionHeatmap && retentionHeatmap.cohorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Cohort</th>
                  <th className="px-4 py-2 text-right">Size</th>
                  <th className="px-4 py-2 text-center">Week 1</th>
                  <th className="px-4 py-2 text-center">Week 2</th>
                  <th className="px-4 py-2 text-center">Week 4</th>
                  <th className="px-4 py-2 text-center">Month 1</th>
                  <th className="px-4 py-2 text-center">Month 2</th>
                  <th className="px-4 py-2 text-center">Month 3</th>
                  <th className="px-4 py-2 text-center">Month 6</th>
                </tr>
              </thead>
              <tbody>
                {retentionHeatmap.cohorts.map((cohort, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 font-medium">{cohort.date}</td>
                    <td className="px-4 py-2 text-right">{cohort.size.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.week1)}`}>
                        {cohort.week1.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.week2)}`}>
                        {cohort.week2.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.week4)}`}>
                        {cohort.week4.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.month1)}`}>
                        {cohort.month1.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.month2)}`}>
                        {cohort.month2.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.month3)}`}>
                        {cohort.month3.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-center text-white font-medium py-1 rounded ${getRetentionColor(cohort.month6)}`}>
                        {cohort.month6.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No retention data available</p>
        )}
      </div>
    </div>
  );
};

export default UserMetrics;

