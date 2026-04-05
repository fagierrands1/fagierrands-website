import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { FaStar, FaSmile, FaMeh, FaFrown } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const API_BASE_URL = 'https://fagierrands-server.vercel.app/api';

const CustomerSatisfaction = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(90); // Default to 90 days for NPS
  const [npsData, setNpsData] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Fetch NPS trend data
        const npsResponse = await axios.get(
          `/dashboard/customer-satisfaction/nps_trend/?days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch rating distribution data
        const ratingResponse = await axios.get(
          `/dashboard/customer-satisfaction/rating_distribution/?days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setNpsData(npsResponse.data);
        setRatingDistribution(ratingResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching customer satisfaction data:', err);
        setError('Failed to load customer satisfaction data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const prepareNpsChartData = () => {
    if (!npsData || !npsData.length) return null;
    
    return {
      labels: npsData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'NPS Score',
          data: npsData.map(item => item.value),
          fill: false,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          tension: 0.1
        }
      ]
    };
  };

  const prepareRatingDistributionChart = () => {
    if (!ratingDistribution) return null;
    
    const labels = Object.keys(ratingDistribution).map(key => `${key} Star`);
    const data = Object.values(ratingDistribution);
    
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // 1 star - red
            'rgba(249, 115, 22, 0.8)',  // 2 star - orange
            'rgba(245, 158, 11, 0.8)',  // 3 star - amber
            'rgba(16, 185, 129, 0.8)',  // 4 star - green
            'rgba(59, 130, 246, 0.8)'   // 5 star - blue
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const calculateAverageNps = () => {
    if (!npsData || !npsData.length) return 0;
    const sum = npsData.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / npsData.length);
  };

  const calculateAverageRating = () => {
    if (!ratingDistribution) return 0;
    
    let totalRatings = 0;
    let weightedSum = 0;
    
    Object.entries(ratingDistribution).forEach(([rating, count]) => {
      totalRatings += count;
      weightedSum += parseInt(rating) * count;
    });
    
    return totalRatings > 0 ? (weightedSum / totalRatings).toFixed(1) : 0;
  };

  const getNpsCategory = (score) => {
    if (score < 0) return { text: 'Needs Improvement', color: 'text-red-500' };
    if (score < 30) return { text: 'Good', color: 'text-yellow-500' };
    if (score < 70) return { text: 'Excellent', color: 'text-green-500' };
    return { text: 'World Class', color: 'text-green-700' };
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

  const npsChartData = prepareNpsChartData();
  const ratingDistributionChartData = prepareRatingDistributionChart();
  const avgNps = calculateAverageNps();
  const npsCategory = getNpsCategory(avgNps);
  const avgRating = calculateAverageRating();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Customer Satisfaction</h2>
        
        <div className="flex space-x-2">
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
          <button 
            onClick={() => setTimeRange(180)}
            className={`px-3 py-1 rounded ${timeRange === 180 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            180 Days
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* NPS Score Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaSmile className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Net Promoter Score</h3>
              <p className="text-2xl font-bold">{avgNps}</p>
              <p className={`text-sm ${npsCategory.color}`}>{npsCategory.text}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <div className={`h-2 flex-grow rounded-l ${avgNps < 0 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
              <div className={`h-2 flex-grow ${avgNps >= 0 && avgNps <= 30 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
              <div className={`h-2 flex-grow ${avgNps > 30 && avgNps <= 70 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`h-2 flex-grow rounded-r ${avgNps > 70 ? 'bg-green-700' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-100</span>
              <span>0</span>
              <span>30</span>
              <span>70</span>
              <span>100</span>
            </div>
          </div>
        </div>
        
        {/* Average Rating Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <FaStar className="text-yellow-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Average Rating</h3>
              <div className="flex items-center">
                <p className="text-2xl font-bold mr-2">{avgRating}</p>
                <FaStar className="text-yellow-500" />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <div className="h-2 w-1/5 bg-red-500 rounded-l"></div>
              <div className="h-2 w-1/5 bg-orange-500"></div>
              <div className="h-2 w-1/5 bg-yellow-500"></div>
              <div className="h-2 w-1/5 bg-green-500"></div>
              <div className="h-2 w-1/5 bg-blue-500 rounded-r"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>
        
        {/* Total Reviews Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaSmile className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Total Reviews</h3>
              <p className="text-2xl font-bold">
                {ratingDistribution 
                  ? Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0).toLocaleString()
                  : 0}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between">
              <div className="text-center">
                <FaSmile className="text-green-500 text-xl mx-auto" />
                <p className="text-sm mt-1">Positive</p>
                <p className="font-bold">
                  {ratingDistribution 
                    ? (ratingDistribution[4] || 0) + (ratingDistribution[5] || 0)
                    : 0}
                </p>
              </div>
              <div className="text-center">
                <FaMeh className="text-yellow-500 text-xl mx-auto" />
                <p className="text-sm mt-1">Neutral</p>
                <p className="font-bold">
                  {ratingDistribution ? (ratingDistribution[3] || 0) : 0}
                </p>
              </div>
              <div className="text-center">
                <FaFrown className="text-red-500 text-xl mx-auto" />
                <p className="text-sm mt-1">Negative</p>
                <p className="font-bold">
                  {ratingDistribution 
                    ? (ratingDistribution[1] || 0) + (ratingDistribution[2] || 0)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* NPS Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">NPS Trend</h3>
          {npsChartData ? (
            <div className="h-80">
              <Line 
                data={npsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      min: -100,
                      max: 100,
                      ticks: {
                        stepSize: 25
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
        
        {/* Rating Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Rating Distribution</h3>
          {ratingDistributionChartData ? (
            <div className="h-80">
              <Pie 
                data={ratingDistributionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
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
    </div>
  );
};

export default CustomerSatisfaction;

