import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend);



const ServicePerformance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days
  const [serviceData, setServiceData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Fetch service comparison data
        const response = await axios.get(
          `/dashboard/service-performance/service_comparison/?days=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setServiceData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service performance data:', err);
        setError('Failed to load service performance data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const prepareBarChartData = () => {
    if (!serviceData || !serviceData.length) return null;
    
    const serviceLabels = serviceData.map(item => {
      // Convert service_type to readable format (e.g., "pickup_delivery" -> "Pickup & Delivery")
      const label = item.service_type.replace(/_/g, ' ');
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
    
    return {
      labels: serviceLabels,
      datasets: [
        {
          label: 'Total Orders',
          data: serviceData.map(item => item.total_orders),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        }
      ]
    };
  };

  const prepareRadarChartData = () => {
    if (!serviceData || !serviceData.length) return null;
    
    const serviceLabels = serviceData.map(item => {
      const label = item.service_type.replace(/_/g, ' ');
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
    
    return {
      labels: serviceLabels,
      datasets: [
        {
          label: 'Average Rating',
          data: serviceData.map(item => item.avg_rating),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
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

  const barChartData = prepareBarChartData();
  const radarChartData = prepareRadarChartData();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Service Performance</h2>
        
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Orders by Service Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Orders by Service Type</h3>
          {barChartData ? (
            <div className="h-80">
              <Bar 
                data={barChartData} 
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
        
        {/* Service Ratings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Service Ratings</h3>
          {radarChartData ? (
            <div className="h-80">
              <Radar 
                data={radarChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 5,
                      min: 0,
                      ticks: {
                        stepSize: 1
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
      
      {/* Service Performance Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Service Performance Details</h3>
        {serviceData && serviceData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Service Type</th>
                  <th className="px-4 py-2 text-right">Total Orders</th>
                  <th className="px-4 py-2 text-right">Completed Orders</th>
                  <th className="px-4 py-2 text-right">Cancelled Orders</th>
                  <th className="px-4 py-2 text-right">Avg Order Value</th>
                  <th className="px-4 py-2 text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {serviceData.map((service, index) => {
                  const serviceName = service.service_type.replace(/_/g, ' ');
                  const formattedServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 font-medium">{formattedServiceName}</td>
                      <td className="px-4 py-2 text-right">{service.total_orders.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{service.completed_orders?.toLocaleString() || 'N/A'}</td>
                      <td className="px-4 py-2 text-right">{service.cancelled_orders?.toLocaleString() || 'N/A'}</td>
                      <td className="px-4 py-2 text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(service.avg_order_value)}
                      </td>
                      <td className="px-4 py-2 text-right">{service.avg_rating.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No service performance data available</p>
        )}
      </div>
    </div>
  );
};

export default ServicePerformance;

