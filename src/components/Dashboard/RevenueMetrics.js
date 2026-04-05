import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaMoneyBillWave, FaChartLine, FaPercentage, FaCircle, FaSync } from 'react-icons/fa';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = 'https://fagierrands-server.vercel.app/api';

const RevenueMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days
  const [revenueData, setRevenueData] = useState(null);
  const [platformFeeData, setPlatformFeeData] = useState(null);
  const [adRevenueData, setAdRevenueData] = useState(null);
  const [serviceComparisonData, setServiceComparisonData] = useState(null);
  
  // WebSocket integration for real-time updates
  const { connected: wsConnected, orderLocations } = useWebSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        
        // Create a function to safely fetch data with error handling
        const safelyFetchData = async (url, errorMessage) => {
          try {
            const response = await axios.get(
              url,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
          } catch (err) {
            console.error(errorMessage, err);
            // Return empty array instead of throwing error
            return [];
          }
        };
        
        // Fetch all data in parallel with individual error handling
        const [revenueData, platformFeeData, adRevenueData, serviceComparisonData] = await Promise.all([
          safelyFetchData(
            `/dashboard/daily-metrics/time_series/?metric=total_revenue&days=${timeRange}`,
            'Error fetching total revenue data:'
          ),
          safelyFetchData(
            `/dashboard/daily-metrics/time_series/?metric=platform_fee_revenue&days=${timeRange}`,
            'Error fetching platform fee data:'
          ),
          safelyFetchData(
            `/dashboard/daily-metrics/time_series/?metric=ad_revenue&days=${timeRange}`,
            'Error fetching ad revenue data:'
          ),
          safelyFetchData(
            `/dashboard/service-performance/service_comparison/?days=${timeRange}`,
            'Error fetching service comparison data:'
          )
        ]);
        
        // Set data even if some requests failed
        setRevenueData(revenueData);
        setPlatformFeeData(platformFeeData);
        setAdRevenueData(adRevenueData);
        setServiceComparisonData(serviceComparisonData);
        
        // Show warning if any data is missing
        if (!revenueData.length || !platformFeeData.length || !adRevenueData.length || !serviceComparisonData.length) {
          setError('Some metrics could not be loaded. The dashboard may show incomplete data.');
        }
        
      } catch (err) {
        console.error('Error fetching revenue metrics:', err);
        setError('Failed to load revenue metrics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const prepareChartData = (data, label, color) => {
    // If no data is available, return a chart with empty data
    if (!data || !data.length) {
      // Create a chart with the last 7 days and zero values
      const emptyData = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        emptyData.unshift({
          date: date.toISOString().split('T')[0],
          value: 0
        });
      }
      
      return {
        labels: emptyData.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
          {
            label: `${label} (No Data)`,
            data: emptyData.map(item => item.value),
            fill: false,
            backgroundColor: 'rgba(209, 213, 219, 0.8)', // Gray color for empty data
            borderColor: 'rgba(209, 213, 219, 0.8)',
            tension: 0.1
          }
        ]
      };
    }
    
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

  const prepareServiceComparisonChart = () => {
    if (!serviceComparisonData || !serviceComparisonData.length) {
      // Create default service types if no data is available
      const defaultServices = [
        'Shopping', 
        'Pickup & Delivery', 
        'Cargo Delivery', 
        'Handyman', 
        'Banking'
      ];
      
      return {
        labels: defaultServices,
        datasets: [
          {
            label: 'Revenue (No Data)',
            data: defaultServices.map(() => 0),
            backgroundColor: 'rgba(209, 213, 219, 0.8)', // Gray color for empty data
          },
          {
            label: 'Average Order Value (No Data)',
            data: defaultServices.map(() => 0),
            backgroundColor: 'rgba(209, 213, 219, 0.5)', // Lighter gray
          }
        ]
      };
    }
    
    const serviceLabels = serviceComparisonData.map(item => {
      // Convert service_type to readable format (e.g., "pickup_delivery" -> "Pickup & Delivery")
      const label = item.service_type.replace(/_/g, ' ');
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
    
    return {
      labels: serviceLabels,
      datasets: [
        {
          label: 'Revenue',
          data: serviceComparisonData.map(item => item.total_revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Average Order Value',
          data: serviceComparisonData.map(item => item.avg_order_value),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    };
  };

  const calculateTotalRevenue = () => {
    if (!revenueData || !revenueData.length) return 0;
    
    // Ensure all values are numbers before summing
    return revenueData.reduce((sum, item) => {
      const value = parseFloat(item.value) || 0;
      return sum + value;
    }, 0);
  };

  const calculateAverageRevenue = () => {
    if (!revenueData || !revenueData.length) return 0;
    const total = calculateTotalRevenue();
    return total / revenueData.length;
  };

  const calculateGrowthRate = () => {
    if (!revenueData || revenueData.length < 2) return 0;
    
    try {
      // Split the data into two equal periods
      const halfIndex = Math.floor(revenueData.length / 2);
      const firstHalf = revenueData.slice(0, halfIndex);
      const secondHalf = revenueData.slice(halfIndex);
      
      // Ensure all values are numbers before summing
      const firstHalfTotal = firstHalf.reduce((sum, item) => {
        const value = parseFloat(item.value) || 0;
        return sum + value;
      }, 0);
      
      const secondHalfTotal = secondHalf.reduce((sum, item) => {
        const value = parseFloat(item.value) || 0;
        return sum + value;
      }, 0);
      
      if (firstHalfTotal === 0) return 0;
      return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    } catch (err) {
      console.error('Error calculating growth rate:', err);
      return 0;
    }
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

  // Show error as a banner but continue rendering the component
  const ErrorBanner = () => {
    if (!error) return null;
    
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
        <strong className="font-bold">Warning: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  };

  const revenueChartData = prepareChartData(revenueData, 'Total Revenue', 'rgba(59, 130, 246, 0.8)');
  const platformFeeChartData = prepareChartData(platformFeeData, 'Platform Fee Revenue', 'rgba(16, 185, 129, 0.8)');
  const adRevenueChartData = prepareChartData(adRevenueData, 'Ad Revenue', 'rgba(245, 158, 11, 0.8)');
  const serviceComparisonChartData = prepareServiceComparisonChart();

  return (
    <div>
      <ErrorBanner />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Revenue Metrics</h2>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <FaCircle className={`text-xs ${wsConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span className={wsConnected ? 'text-green-600' : 'text-gray-500'}>
              {wsConnected ? 'Real-time revenue tracking' : 'Historical data only'}
            </span>
            {orderLocations.length > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{orderLocations.length} orders being tracked</span>
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
        {/* Total Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaMoneyBillWave className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Total Revenue (Last {timeRange} days)</h3>
              <p className="text-2xl font-bold">{formatCurrency(calculateTotalRevenue())}</p>
            </div>
          </div>
        </div>
        
        {/* Average Daily Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaChartLine className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Average Daily Revenue</h3>
              <p className="text-2xl font-bold">{formatCurrency(calculateAverageRevenue())}</p>
            </div>
          </div>
        </div>
        
        {/* Growth Rate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaPercentage className="text-purple-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Growth Rate</h3>
              <p className={`text-2xl font-bold ${calculateGrowthRate() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateGrowthRate().toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
          {revenueChartData ? (
            <div className="h-80">
              <Line 
                data={revenueChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'KES ' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
        
        {/* Revenue Breakdown Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Revenue Breakdown</h3>
          {platformFeeChartData && adRevenueChartData ? (
            <div className="h-80">
              <Line 
                data={{
                  labels: platformFeeChartData.labels,
                  datasets: [
                    platformFeeChartData.datasets[0],
                    adRevenueChartData.datasets[0]
                  ]
                }} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'KES ' + value.toLocaleString();
                        }
                      }
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
      
      {/* Service Revenue Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Revenue by Service Type</h3>
        {serviceComparisonChartData ? (
          <div className="h-80">
            <Bar 
              data={serviceComparisonChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'KES ' + value.toLocaleString();
                      }
                    }
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
  );
};

export default RevenueMetrics;

