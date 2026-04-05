import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Common/Header';
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import EnhancedDashboardOverview from '../components/Dashboard/EnhancedDashboardOverview';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import AnalyticsDebugger from '../components/Dashboard/AnalyticsDebugger';
import ApiDebugger from '../components/Dashboard/ApiDebugger';
import UserMetrics from '../components/Dashboard/UserMetrics';
import RevenueMetrics from '../components/Dashboard/RevenueMetrics';
import ServicePerformance from '../components/Dashboard/ServicePerformance';
import CustomerSatisfaction from '../components/Dashboard/CustomerSatisfaction';
import AdvertisementMetrics from '../components/Dashboard/AdvertisementMetrics';
import { dashboardApi } from '../services/api';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get user info
        const userResponse = await axios.get(`accounts/user/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userInfo = userResponse.data;
        setUserRole(userInfo.user_type || '');

        // Check if user is admin
        if (userInfo.user_type !== 'admin' && !userInfo.is_staff && !userInfo.is_superuser) {
          navigate('/dashboard');
          return;
        }

        try {
          // Fetch dashboard overview data using the dashboardApi service
          console.log('Fetching dashboard overview data...');
          const result = await dashboardApi.getOverview();
          
          if (result.success) {
            console.log('Dashboard data received:', result.data);
            setOverviewData(result.data);
          } else {
            throw new Error(result.message || 'Failed to fetch dashboard data');
          }
        } catch (dashboardError) {
          console.error('Error fetching dashboard data:', dashboardError);
          // Set default overview data to prevent errors in the UI
          setOverviewData({
            total_users: 0,
            new_users_last_30_days: 0,
            active_users_last_30_days: 0,
            user_growth_rate: 0,
            total_orders: 0,
            new_orders_last_30_days: 0,
            completed_orders_last_30_days: 0,
            order_completion_rate: 0,
            total_revenue: 0,
            revenue_last_30_days: 0,
            revenue_growth_rate: 0,
            avg_order_value: 0,
            nps_score: 0,
            avg_rating: 0
          });
          setError('Failed to load dashboard data. Using default values.');
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <div>
            <AnalyticsDashboard />
          </div>
        );
      case 'overview':
        return <EnhancedDashboardOverview data={overviewData} />;
      case 'classic':
        return <DashboardOverview data={overviewData} />;
      case 'users':
        return <UserMetrics />;
      case 'revenue':
        return <RevenueMetrics />;
      case 'services':
        return <ServicePerformance />;
      case 'satisfaction':
        return <CustomerSatisfaction />;
      case 'advertisements':
        return <AdvertisementMetrics />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
          <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
          <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Retry
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="ml-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/dashboard/calculate-metrics')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Calculate Metrics
            </button>
          </div>
        </div>
        
        {/* Dashboard Tabs */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'analytics' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics Dashboard
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'bg-green-50 text-green-600 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('overview')}
            >
              🚀 Enhanced Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'classic' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('classic')}
            >
              Classic Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('users')}
            >
              User Metrics
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'revenue' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('revenue')}
            >
              Revenue
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'services' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('services')}
            >
              Service Performance
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'satisfaction' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('satisfaction')}
            >
              Customer Satisfaction
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'advertisements' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('advertisements')}
            >
              Advertisements
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
