import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import Header from '../Common/Header';
import MapComponent from '../Common/MapComponent';
import { getUserLocation } from '../../services/location';
import { ordersApi, dashboardApi } from '../../services/api';
import api from '../../services/api';
import Banking from '../../assets/banking.jpg';
import Shopping from '../../assets/shopping.jpg';
import Pickup from '../../assets/pickup.jpg';
import Cargo from '../../assets/cargo.jpg';
import HandyMan from '../../assets/handyman.jpg';
import { FaUsers, FaMapMarkerAlt, FaBell, FaUser, FaPlusCircle, FaReceipt, FaCheckCircle, FaClock, FaDollarSign, FaBolt, FaShieldAlt, FaClock as FaClockIcon } from 'react-icons/fa';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [userStats, setUserStats] = useState({
    completed: 0,
    inProgress: 0,
    totalSaved: '0'
  });
  const [clientStats, setClientStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // 1. Store tokens if coming from login redirect
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        const refreshParam = urlParams.get('refresh');

        if (tokenParam && refreshParam) {
          console.log("Storing tokens from URL parameters");
          localStorage.setItem('authToken', tokenParam);
          localStorage.setItem('refreshToken', refreshParam);

          // Clean up URL
          navigate('/client/dashboard', { replace: true });
          return; // Stop here so new page load happens
        }

        // 2. Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log("No auth token found, redirecting to login");
          navigate('/login');
          return;
        }

        // 3. Fetch user data
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        console.log("Fetching user data...");
        const response = await axios.get('/accounts/user/', config);

        if (response.data) {
          console.log("User data received:", response.data);
          setUser(response.data);

          try {
            console.log("Fetching profile data...");
            const profileResponse = await axios.get('/accounts/profile/', config);
            if (profileResponse.data) {
              console.log("Profile data received:", profileResponse.data);
              setUser(prevUser => ({ ...prevUser, ...profileResponse.data }));
            }
          } catch (profileError) {
            console.error('Error fetching profile data:', profileError);
            // Keep existing user data even if profile fails
          }
        }

        // Fetch orders and stats
        await fetchDashboardData();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error);

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log("Auth token invalid or expired, redirecting to login");
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
        } else {
          setLoading(false);
        }
      }
    };

    initDashboard();

    // Fetch user location separately
    getUserLocation()
      .then(location => {
        console.log("User location retrieved:", location);
        setUserLocation(location);
      })
      .catch(error => {
        console.error('Error getting user location:', error);
      });
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post('/accounts/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };
  
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch recent orders
      const ordersResponse = await ordersApi.getUserOrders();
      console.log('Orders API Response:', ordersResponse);
      
      if (ordersResponse.success && ordersResponse.data) {
        // Handle different response structures
        let orders = [];
        if (Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        } else if (ordersResponse.data.results && Array.isArray(ordersResponse.data.results)) {
          orders = ordersResponse.data.results;
        } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
          orders = ordersResponse.data.orders;
        }
        
        console.log('Processed orders:', orders);
        
        if (Array.isArray(orders) && orders.length > 0) {
          setRecentOrders(orders.slice(0, 3));
          
          // Calculate user stats from orders
          const completed = orders.filter((order) => order.status === 'completed').length;
          const inProgress = orders.filter((order) => 
            order.status === 'in_progress' || 
            order.status === 'pending' || 
            order.status === 'assigned' ||
            order.status === 'accepted'
          ).length;
          const totalAmount = orders.reduce((sum, order) => {
            const amount = parseFloat(order.total_amount || order.amount || order.price || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          
          setUserStats({
            completed,
            inProgress,
            totalSaved: (totalAmount && !isNaN(totalAmount)) ? totalAmount.toFixed(0) : '0'
          });
        } else {
          console.log('No orders found or orders is not an array');
          setRecentOrders([]);
          setUserStats({ completed: 0, inProgress: 0, totalSaved: '0' });
        }
      } else {
        console.log('No orders data found in response');
        setRecentOrders([]);
        setUserStats({ completed: 0, inProgress: 0, totalSaved: '0' });
      }

      // Try to fetch client stats from API
      try {
        const statsResponse = await dashboardApi.getClientStats();
        if (statsResponse.success) {
          setClientStats(statsResponse.data);
        }
      } catch (statsError) {
        console.error('Error fetching client stats:', statsError);
        // Continue with calculated stats
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRecentOrders([]);
      setUserStats({ completed: 0, inProgress: 0, totalSaved: '0' });
    }
  }, []);

  const serviceCards = [
    { id: 'shop', title: 'Shopping', description: 'Groceries & Essentials', image: Shopping, link: '/shop', icon: 'storefront-outline', gradient: ['#49AFAF', '#5FAAF5'] },
    { id: 'pickup', title: 'Pickup & Delivery', description: 'Parcel Delivery & Pickup Services', image: Pickup, link: '/pickup-delivery', icon: 'car-outline', gradient: ['#5FAAF5', '#A8DFF4'] },
    { id: 'cargo', title: 'Cargo Transport', description: 'Heavy Cargo & Freight Services', image: Cargo, link: '/cargo-delivery', icon: 'cube-outline', gradient: ['#A8DFF4', '#49AFAF'] },
    { id: 'banking', title: 'Cheque Banking', description: 'Cheque Deposit Services', image: Banking, link: '/banking', icon: 'card-outline', gradient: ['#10b981', '#059669'] },
    { id: 'handyman', title: 'Home Maintenance', description: 'Professional Home Maintainance Services', image: HandyMan, link: '/home-maintenance', icon: 'hammer-outline', gradient: ['#f59e0b', '#d97706'] },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2 className="error-title">Authentication Error</h2>
          <p className="error-message">There was a problem loading your dashboard.</p>
          <button 
            onClick={() => navigate('/login')}
            className="login-button"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] : 'Guest User';

  const benefits = [
    {
      icon: <FaBolt className="text-2xl" />,
      title: 'Fast Task Completion',
      description: 'Get errands done quickly and reliably',
      color: '#49AFAF',
    },
    {
      icon: <FaShieldAlt className="text-2xl" />,
      title: 'Trusted Service',
      description: 'Reliable help you can depend on',
      color: '#10b981',
    },
    {
      icon: <FaClockIcon className="text-2xl" />,
      title: '24/7 Support',
      description: "We're here whenever you need us",
      color: '#5FAAF5',
    },
  ];

  return (
    <div className="dashboard min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#49AFAF] to-[#A8DFF4] text-white py-6 px-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Fagi Errands</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/map" className="p-2 hover:bg-white/20 rounded-lg transition">
              <FaMapMarkerAlt className="text-xl" />
            </Link>
            <Link to="/notifications" className="p-2 hover:bg-white/20 rounded-lg transition relative">
              <FaBell className="text-xl" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </Link>
            <Link to="/profile" className="p-2 hover:bg-white/20 rounded-lg transition">
              <FaUser className="text-xl" />
            </Link>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">
            Simplify Your Day with{'\n'}Efficient Errands
          </h2>
          <p className="text-lg opacity-90 mb-4">
            Manage your tasks with ease and reliability—get more done, stress-free.
          </p>
          <p className="text-sm opacity-80">
            {user ? `Welcome back, ${displayName}!` : 'Welcome to Fagi Errands!'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/pickup-delivery"
              className="bg-gradient-to-r from-[#49AFAF] to-[#5FAAF5] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center min-h-[120px]"
            >
              <FaPlusCircle className="text-4xl mb-3" />
              <span className="text-lg font-bold">New Order</span>
            </Link>
            
            <Link
              to="/orders"
              className="bg-gradient-to-r from-[#5FAAF5] to-[#A8DFF4] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center min-h-[120px]"
            >
              <FaReceipt className="text-4xl mb-3" />
              <span className="text-lg font-bold">My Orders</span>
            </Link>
          </div>
        </div>

        {/* Featured Services */}
        <div className="mb-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Our Services</h3>
            <p className="text-gray-600">Your Personal Assistant for Every Errand</p>
          </div>
          
          {/* Shopping Service - Full Width Row */}
          <div className="mb-6">
            <Link
              to={serviceCards[0].link}
              className="block rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden min-h-[160px]"
              style={{ background: `linear-gradient(to right, ${serviceCards[0].gradient[0]}, ${serviceCards[0].gradient[1]})` }}
            >
              <div className="flex items-center">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden mr-8 flex-shrink-0">
                  <img 
                    src={serviceCards[0].image} 
                    alt={serviceCards[0].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <i className="fas fa-store text-3xl text-white"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-3xl font-bold mb-3">{serviceCards[0].title}</h4>
                  <p className="text-lg text-white/90">{serviceCards[0].description}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Pickup & Delivery and Cargo Transport - Same Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {serviceCards.slice(1, 3).map((service) => (
              <Link
                key={service.id}
                to={service.link}
                className="block rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden min-h-[200px]"
                style={{ background: `linear-gradient(to right, ${service.gradient[0]}, ${service.gradient[1]})` }}
              >
                <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <i className={`fas fa-${service.id === 'pickup' ? 'car' : 'cube'} text-2xl text-white`}></i>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                  <p className="text-base text-white/90">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Banking & Home Maintenance - Same Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceCards.slice(3).map((service) => (
              <Link
                key={service.id}
                to={service.link}
                className="block rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden min-h-[200px]"
                style={{ background: `linear-gradient(to right, ${service.gradient[0]}, ${service.gradient[1]})` }}
              >
                <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <i className={`fas fa-${service.id === 'banking' ? 'card' : 'hammer'} text-2xl text-white`}></i>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                  <p className="text-base text-white/90">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
            <Link to="/orders" className="text-primary hover:underline font-semibold">
              See All
            </Link>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <p className="text-gray-500">Loading recent activity...</p>
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-gradient-to-r from-[#5FAAF5] to-[#A8DFF4] rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1 line-clamp-2">
                        {order.title || order.service_type || `Order #${order.id}`}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span>{order.status}</span>
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {order.status === 'completed' ? (
                        <FaCheckCircle className="text-2xl text-green-300" />
                      ) : (
                        <FaClock className="text-2xl text-yellow-300" />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <i className="fas fa-document text-5xl text-gray-300 mb-4"></i>
              <h4 className="text-lg font-bold text-gray-700 mb-2">No Recent Activity</h4>
              <p className="text-gray-500">Start by creating your first order!</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#49AFAF] to-[#5FAAF5] rounded-xl p-6 text-white shadow-lg text-center">
              <p className="text-3xl font-bold mb-2">{userStats.completed}</p>
              <p className="text-sm font-semibold opacity-90">Completed</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#5FAAF5] to-[#A8DFF4] rounded-xl p-6 text-white shadow-lg text-center">
              <p className="text-3xl font-bold mb-2">{userStats.inProgress}</p>
              <p className="text-sm font-semibold opacity-90">In Progress</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#10b981] to-[#059669] rounded-xl p-6 text-white shadow-lg text-center">
              <p className="text-2xl font-bold mb-2">KSh {userStats.totalSaved}</p>
              <p className="text-sm font-semibold opacity-90">Saved</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Why Choose Fagi Errands?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md text-center hover:shadow-lg transition-all">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
                  style={{ backgroundColor: benefit.color }}
                >
                  {benefit.icon}
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{benefit.title}</h4>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default ClientDashboard;

