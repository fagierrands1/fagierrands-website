import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaAd, FaMousePointer, FaEye, FaMoneyBillWave } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = 'https://fagierrands-server.vercel.app/api';

const AdvertisementMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days
  const [adData, setAdData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Fetch advertisement performance data
        const response = await axios.get(
          `/dashboard/advertisement-metrics/ad_performance/?days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAdData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching advertisement metrics:', err);
        setError('Failed to load advertisement metrics. Please try again later.');
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

  const prepareRevenueChartData = () => {
    if (!adData || !adData.daily_metrics || !adData.daily_metrics.length) return null;
    
    return {
      labels: adData.daily_metrics.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Ad Revenue',
          data: adData.daily_metrics.map(item => item.revenue),
          fill: false,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          tension: 0.1
        }
      ]
    };
  };

  const prepareMetricsChartData = () => {
    if (!adData || !adData.daily_metrics || !adData.daily_metrics.length) return null;
    
    return {
      labels: adData.daily_metrics.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Impressions',
          data: adData.daily_metrics.map(item => item.impressions),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 0.8)',
          borderWidth: 1
        },
        {
          label: 'Clicks',
          data: adData.daily_metrics.map(item => item.clicks),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 0.8)',
          borderWidth: 1
        }
      ]
    };
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

  const revenueChartData = prepareRevenueChartData();
  const metricsChartData = prepareMetricsChartData();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Advertisement Metrics</h2>
        
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
      
      {adData && adData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Total Impressions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaEye className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Impressions</h3>
                <p className="text-2xl font-bold">{adData.summary.total_impressions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Total Clicks Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FaMousePointer className="text-green-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Clicks</h3>
                <p className="text-2xl font-bold">{adData.summary.total_clicks.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* CTR Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FaAd className="text-yellow-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Click-Through Rate</h3>
                <p className="text-2xl font-bold">{adData.summary.overall_ctr.toFixed(2)}%</p>
              </div>
            </div>
          </div>
          
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FaMoneyBillWave className="text-purple-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Ad Revenue</h3>
                <p className="text-2xl font-bold">{formatCurrency(adData.summary.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ad Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Ad Revenue Trend</h3>
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
        
        {/* Impressions & Clicks Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Impressions & Clicks</h3>
          {metricsChartData ? (
            <div className="h-80">
              <Bar 
                data={metricsChartData} 
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
      
      {/* Ad Performance Table */}
      {adData && adData.daily_metrics && adData.daily_metrics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Daily Ad Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-right">Impressions</th>
                  <th className="px-4 py-2 text-right">Clicks</th>
                  <th className="px-4 py-2 text-right">CTR</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">CPM</th>
                </tr>
              </thead>
              <tbody>
                {adData.daily_metrics.map((day, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">{day.impressions.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{day.clicks.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{day.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(day.revenue)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(day.cpm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementMetrics;

