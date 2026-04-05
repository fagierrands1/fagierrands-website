import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';

// Get API base URL from environment utility
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
const authService = {
  login: (credentials) => apiClient.post('/accounts/login/', credentials),
  register: (userData) => apiClient.post('/accounts/register/', userData),
  getUser: () => apiClient.get('/accounts/user/'),
  logout: () => apiClient.post('/accounts/logout/'),
  sendOTP: (email) => apiClient.post('/accounts/send-otp/', { email }),
  verifyOTP: (email, otpCode) => apiClient.post('/accounts/verify-otp/', { email, otp_code: otpCode }),
  resendOTP: (email) => apiClient.post('/accounts/resend-otp/', { email }),
  checkEmailVerification: () => apiClient.get('/accounts/check-email-verification/'),
  resendVerificationEmail: (email) => apiClient.post('/accounts/resend-verification/', { email }),
};

// Order services
const orderService = {
  getOrderTypes: () => apiClient.get('/orders/types/'),
  getUserOrders: () => apiClient.get('/orders/'),
  getOrderDetails: (orderId) => apiClient.get(`/orders/${orderId}/`),
  getOrderItems: (orderId) => apiClient.get(`/orders/${orderId}/items/`),
  createShoppingOrder: (orderData) => apiClient.post('/orders/shopping/', orderData),
  createHomeMaintenanceOrder: (orderData) => apiClient.post('/orders/handyman/orders/', orderData),
  createPickupDeliveryOrder: (orderData) => apiClient.post('/orders/pickup-delivery/', orderData),
  createCargoDeliveryOrder: (orderData) => apiClient.post('/orders/cargo-delivery/', orderData),
  updateOrderStatus: (orderId, status) => apiClient.patch(`/orders/${orderId}/status/`, { status }),
  cancelOrder: (orderId) => apiClient.patch(`/orders/${orderId}/status/`, { status: 'cancelled' }),
  completeOrder: (orderId) => apiClient.patch(`/orders/${orderId}/status/`, { status: 'completed' }),
  submitReview: (orderId, reviewData) => apiClient.post(`/orders/${orderId}/review/`, reviewData),
  uploadOrderImage: (orderId, formData) => {
    return apiClient.post(`/orders/${orderId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getOrderTracking: (orderId) => apiClient.get(`/orders/${orderId}/tracking/`),
  acceptOrder: (orderId) => apiClient.post(`/orders/${orderId}/accept/`),
};

// Banking services (for the banking module in your URLs)
const bankingService = {
  getBanks: () => apiClient.get('/orders/banking/banks/'),
  getBankingOrders: () => apiClient.get('/orders/banking/orders/'),
  createBankingOrder: (orderData) => apiClient.post('/orders/banking/orders/', orderData),
};

// Home-Maintenance services
const handymanService = {
  getServiceTypes: () => apiClient.get('/orders/handyman/service-types/'), 
  getOrders: () => apiClient.get('/orders/handyman/orders/'),
  getOrderDetails: (orderId) => apiClient.get(`/orders/handyman/orders/${orderId}/`),
  createOrder: (orderData) => apiClient.post('/orders/handyman/orders/', orderData),
  updateOrderStatus: (orderId, status) => apiClient.patch(`/orders/handyman/orders/${orderId}/status/`, { status }),
  submitQuote: (orderId, quoteData) => apiClient.post(`/orders/handyman/orders/${orderId}/quote/`, quoteData),
  processFinalPayment: (orderId, paymentData) => apiClient.post(`/orders/handyman/orders/${orderId}/final-payment/`, paymentData),
};

// Dashboard services
const dashboardService = {
  getOverview: () => apiClient.get('/dashboard/overview/'),
  getAdminStats: () => apiClient.get('/admin/stats/'),
  getClientStats: () => apiClient.get('/accounts/client/stats/'),
  getAssistantStats: () => apiClient.get('/accounts/assistant/dashboard-stats/'),
  getHandlerStats: () => apiClient.get('/accounts/handler/stats/'),
};

// Payment services
const paymentService = {
  initiatePayment: (orderId, amount) => apiClient.post('/orders/payments/initiate/', { order_id: orderId, amount }),
  getPaymentStatus: (paymentId) => apiClient.get(`/orders/payments/${paymentId}/`),
  processPayment: (paymentId, paymentData) => apiClient.post(`/orders/payments/${paymentId}/process/`, paymentData),
};

// Pricing services
const pricingService = {
  calculatePrice: (data) => apiClient.post('/orders/calculate-price/', data),
  updatePriceRealtime: (orderId, data) => apiClient.patch(`/orders/${orderId}/update_price_realtime/`, data),
};

// Notification services
const notificationService = {
  getNotifications: () => apiClient.get('/notifications/notifications/'),
  markAsRead: (notificationId) => apiClient.post(`/notifications/notifications/${notificationId}/mark_as_read/`),
  markAllAsRead: () => apiClient.post('/notifications/notifications/mark_all_as_read/'),
  getUnreadCount: () => apiClient.get('/notifications/notifications/unread_count/'),
};

// User services
const userService = {
  getProfile: () => apiClient.get('/accounts/profile/'),
  updateProfile: (data) => apiClient.patch('/accounts/profile/', data),
  getVerificationStatus: () => apiClient.get('/accounts/assistant/verification-status/'),
  getAllAssistants: () => apiClient.get('/accounts/assistants/'),
  getAssistantById: (id) => apiClient.get(`/accounts/assistants/${id}/`),
};

// Referral services
const referralService = {
  getReferrals: () => apiClient.get('/referrals/'),
};

export {
  apiClient,
  authService,
  orderService,
  bankingService,
  handymanService as homeMaintenanceService,
  dashboardService,
  paymentService,
  pricingService,
  notificationService,
  userService,
  referralService,
};
