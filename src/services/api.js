// api.js - Updated to match mobile app API structure
import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';

// Get API base URL from environment utility (includes /api)
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Setup auth interceptor - handles both token injection and refresh logic
const setupAuthInterceptors = () => {
  // Request interceptor - add token to requests
  api.interceptors.request.use(
    config => {
      // Check both token storage locations for backward compatibility
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor - handle 401 errors with token refresh
  api.interceptors.response.use(
    response => response,
    async error => {
      // Only handle 401 errors with refresh token
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh');
        
        if (refreshToken) {
          try {
            const res = await api.post('/accounts/token/refresh/', { refresh: refreshToken });
            // Update tokens
            const newToken = res.data.access;
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('token', newToken);
            if (res.data.refresh) {
              localStorage.setItem('refreshToken', res.data.refresh);
              localStorage.setItem('refresh', res.data.refresh);
            }
            
            // Retry original request with new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Clear auth on refresh failure
            clearAuthStorage();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token available
          clearAuthStorage();
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// Helper to clear all auth storage
const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('refresh');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('userType');
};

// Apply interceptors
setupAuthInterceptors();

// Wrapper for API calls with consistent error handling
const apiRequest = async (apiCall) => {
  try {
    const response = await apiCall();
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.error('API error:', error);
    return {
      success: false,
      status: error.response?.status || 'unknown',
      error: error.response?.status || 'unknown',
      message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Unknown error occurred'
    };
  }
};

// API endpoints mapping
export const apiEndpoints = {
  // Authentication
  login: '/accounts/login/',
  register: '/accounts/register/',
  logout: '/accounts/logout/',
  profile: '/accounts/profile/',
  user: '/accounts/user/',
  validateToken: '/accounts/validate-token/',
  changePassword: '/accounts/change-password/',
  tokenRefresh: '/accounts/token/refresh/',
  
  // Email Verification & OTP
  verifyEmail: (token) => `/accounts/verify-email/${token}/`,
  resendVerification: '/accounts/resend-verification/',
  checkEmailVerification: '/accounts/check-email-verification/',
  sendOTP: '/accounts/send-otp/',
  verifyOTP: '/accounts/verify-otp/',
  resendOTP: '/accounts/resend-otp/',
  getOTPStatus: '/accounts/otp-status/',
  
  // Orders - General
  orders: '/orders/',
  orderById: (id) => `/orders/${id}/`,
  assistantOrders: '/orders/assistant/',
  userOrders: '/orders/',  // User orders are fetched from the main orders endpoint
  orderTypes: '/orders/types/',
  orderStatus: (id) => `/orders/${id}/status/`,
  orderItems: (id) => `/orders/${id}/items/`,
  orderReview: (id) => `/orders/${id}/review/`,
  orderImages: (id) => `/orders/${id}/images/`,
  orderAttachments: (id) => `/orders/${id}/attachments/`,
  orderAttachmentUpload: (id) => `/orders/${id}/attachments/upload/`,
  orderTracking: (id) => `/orders/${id}/tracking/`,
  assignOrder: (id) => `/orders/${id}/assign/`,
  acceptOrder: (id) => `/orders/${id}/accept/`,
  
  // Service-specific Orders
  shoppingOrders: '/orders/shopping/',
  pickupDeliveryOrders: '/orders/pickup-delivery/',
  cargoDeliveryOrders: '/orders/cargo-delivery/',
  
  // Banking Orders
  bankingOrders: '/orders/banking/orders/',
  banks: '/orders/banking/banks/',
  
  // Handyman/Home-Maintenance Orders
  handymanOrders: '/orders/handyman/orders/',
  handymanServiceTypes: '/orders/handyman/service-types/',
  handymanOrderById: (id) => `/orders/handyman/orders/${id}/`,
  handymanOrderStatus: (id) => `/orders/handyman/orders/${id}/status/`,
  handymanQuote: (id) => `/orders/handyman/orders/${id}/quote/`,
  handymanFinalPayment: (id) => `/orders/handyman/orders/${id}/final-payment/`,
  
  // Quotes
  serviceProviderDashboard: '/orders/service-provider/dashboard/',
  serviceProviderQuotes: '/orders/quotes/',
  serviceProviderQuoteDetail: (id) => `/orders/quotes/${id}/`,
  submitQuote: (id) => `/orders/quotes/${id}/submit/`,
  quoteImages: (id) => `/orders/quotes/${id}/images/`,
  quoteStatusCheck: (orderId) => `/orders/quotes/status-check/${orderId}/`,
  handymanOrderQuotes: (id) => `/orders/handyman/orders/${id}/quotes/`,
  
  // Users & Assistants
  assistants: '/accounts/assistants/',
  assistantById: (id) => `/accounts/assistants/${id}/`,
  verificationRequests: '/accounts/assistant-verifications/',
  verificationStatus: '/accounts/assistant/verification-status/',
  currentUser: '/accounts/user/me/',
  
  // Notifications
  notifications: '/notifications/notifications/',
  notificationMarkAsRead: (id) => `/notifications/notifications/${id}/mark_as_read/`,
  notificationMarkAllAsRead: '/notifications/notifications/mark_all_as_read/',
  notificationUnreadCount: '/notifications/notifications/unread_count/',
  pushTokens: '/notifications/push-tokens/',
  deletePushToken: '/notifications/push-tokens/delete_token/',
  
  // Dashboard Stats
  adminStats: '/admin/stats/',
  dashboardOverview: '/dashboard/overview/',
  clientStats: '/accounts/client/stats/',
  assistantStats: '/accounts/assistant/dashboard-stats/',
  handlerStats: '/accounts/handler/stats/',
  
  // Payment endpoints
  initiatePayment: '/orders/payments/initiate/',
  paymentStatus: (id) => `/orders/payments/${id}/`,
  processPayment: (id) => `/orders/payments/${id}/process/`,
  paymentCallback: '/orders/payments/callback/',
  
  // Price calculation
  calculatePrice: '/orders/calculate-price/',
  updatePriceRealtime: (id) => `/orders/${id}/update_price_realtime/`,
  
  // Referrals
  referrals: '/referrals/',
  
  // Locations
  locations: '/locations/',
  currentLocation: '/locations/current/',
  updateCurrentLocation: '/locations/current/update/',
};

// Orders API endpoints
export const ordersApi = {
  getAll: () => apiRequest(() => api.get(apiEndpoints.orders)),
  getById: (id) => apiRequest(() => api.get(apiEndpoints.orderById(id))),
  create: (data) => apiRequest(() => api.post(apiEndpoints.orders, data)),
  update: (id, data) => apiRequest(() => api.patch(apiEndpoints.orderById(id), data)),
  delete: (id) => apiRequest(() => api.delete(apiEndpoints.orderById(id))),
  assignOrder: (id, assistantId) => apiRequest(() => api.patch(apiEndpoints.assignOrder(id), { assistant_id: assistantId })),
  updateStatus: (id, status) => apiRequest(() => api.patch(apiEndpoints.orderStatus(id), { status })),
  getAssistantOrders: () => apiRequest(() => api.get(apiEndpoints.assistantOrders)),
  getUserOrders: () => apiRequest(() => api.get(apiEndpoints.userOrders)),
  acceptOrder: (id) => apiRequest(() => api.post(apiEndpoints.acceptOrder(id), {})),
  getOrderTypes: () => apiRequest(() => api.get(apiEndpoints.orderTypes)),
  submitReview: (id, reviewData) => apiRequest(() => api.post(apiEndpoints.orderReview(id), reviewData)),
  uploadImages: (id, formData) => apiRequest(() => api.post(apiEndpoints.orderImages(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })),
  uploadAttachments: (id, formData) => apiRequest(() => api.post(apiEndpoints.orderAttachmentUpload(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })),
  getTracking: (id) => apiRequest(() => api.get(apiEndpoints.orderTracking(id))),
};

// Service-specific Orders
export const shoppingOrdersApi = {
  create: (data) => apiRequest(() => api.post(apiEndpoints.shoppingOrders, data)),
  getAll: () => apiRequest(() => api.get(apiEndpoints.shoppingOrders)),
};

export const pickupDeliveryApi = {
  create: (data) => apiRequest(() => api.post(apiEndpoints.pickupDeliveryOrders, data)),
  getAll: () => apiRequest(() => api.get(apiEndpoints.pickupDeliveryOrders)),
};

export const cargoDeliveryApi = {
  create: (data) => apiRequest(() => api.post(apiEndpoints.cargoDeliveryOrders, data)),
  getAll: () => apiRequest(() => api.get(apiEndpoints.cargoDeliveryOrders)),
};

export const bankingApi = {
  createOrder: (data) => apiRequest(() => api.post(apiEndpoints.bankingOrders, data)),
  getOrders: () => apiRequest(() => api.get(apiEndpoints.bankingOrders)),
  getBanks: () => apiRequest(() => api.get(apiEndpoints.banks)),
};

export const handymanApi = {
  createOrder: (data) => apiRequest(() => api.post(apiEndpoints.handymanOrders, data)),
  getOrders: () => apiRequest(() => api.get(apiEndpoints.handymanOrders)),
  getOrderById: (id) => apiRequest(() => api.get(apiEndpoints.handymanOrderById(id))),
  updateStatus: (id, status) => apiRequest(() => api.patch(apiEndpoints.handymanOrderStatus(id), { status })),
  submitQuote: (id, quoteData) => apiRequest(() => api.post(apiEndpoints.handymanQuote(id), quoteData)),
  processFinalPayment: (id, paymentData) => apiRequest(() => api.post(apiEndpoints.handymanFinalPayment(id), paymentData)),
  getServiceTypes: () => apiRequest(() => api.get(apiEndpoints.handymanServiceTypes)),
};

// Quotes API
export const quotesApi = {
  getAll: () => apiRequest(() => api.get(apiEndpoints.serviceProviderQuotes)),
  getById: (id) => apiRequest(() => api.get(apiEndpoints.serviceProviderQuoteDetail(id))),
  submit: (id, quoteData) => apiRequest(() => api.post(apiEndpoints.submitQuote(id), quoteData)),
  uploadImages: (id, formData) => apiRequest(() => api.post(apiEndpoints.quoteImages(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })),
  checkStatus: (orderId) => apiRequest(() => api.get(apiEndpoints.quoteStatusCheck(orderId))),
};

// Users API endpoints
export const usersApi = {
  getAllAssistants: () => apiRequest(() => api.get(apiEndpoints.assistants)),
  getAssistantById: (id) => apiRequest(() => api.get(apiEndpoints.assistantById(id))),
  getVerificationRequests: () => apiRequest(() => api.get(apiEndpoints.verificationRequests)),
  updateVerificationStatus: (id, status) => apiRequest(() => api.patch(`${apiEndpoints.verificationRequests}${id}/`, { status })),
  getCurrentUser: () => apiRequest(() => api.get(apiEndpoints.currentUser)),
  updateProfile: (data) => apiRequest(() => api.patch(apiEndpoints.profile, data)),
  getVerificationStatus: () => apiRequest(() => api.get(apiEndpoints.verificationStatus)),
};

// Auth API endpoints
export const authApi = {
  login: (email, password) => apiRequest(() => api.post(apiEndpoints.login, { email, password })),
  register: (userData) => apiRequest(() => api.post(apiEndpoints.register, userData)),
  logout: (refreshToken) => apiRequest(() => api.post(apiEndpoints.logout, { refresh: refreshToken })),
  validateToken: () => apiRequest(() => api.post(apiEndpoints.validateToken, {})),
  changePassword: (oldPassword, newPassword) => apiRequest(() => api.put(apiEndpoints.changePassword, {
    old_password: oldPassword,
    new_password: newPassword
  })),
  sendOTP: (email) => apiRequest(() => api.post(apiEndpoints.sendOTP, { email })),
  verifyOTP: (email, otpCode) => apiRequest(() => api.post(apiEndpoints.verifyOTP, { email, otp_code: otpCode })),
  resendOTP: (email) => apiRequest(() => api.post(apiEndpoints.resendOTP, { email })),
  checkEmailVerification: () => apiRequest(() => api.get(apiEndpoints.checkEmailVerification)),
  resendVerificationEmail: (email) => apiRequest(() => api.post(apiEndpoints.resendVerification, { email })),
};

// Payment API
export const paymentApi = {
  initiatePayment: (orderId, amount) => apiRequest(() => api.post(apiEndpoints.initiatePayment, { order_id: orderId, amount })),
  getPaymentStatus: (id) => apiRequest(() => api.get(apiEndpoints.paymentStatus(id))),
  processPayment: (id, paymentData) => apiRequest(() => api.post(apiEndpoints.processPayment(id), paymentData)),
  callback: (paymentData) => apiRequest(() => api.post(apiEndpoints.paymentCallback, paymentData)),
};

// Dashboard & Stats API
export const dashboardApi = {
  getOverview: () => apiRequest(() => api.get(apiEndpoints.dashboardOverview)),
  getAdminStats: () => apiRequest(() => api.get(apiEndpoints.adminStats)),
  getClientStats: () => apiRequest(() => api.get(apiEndpoints.clientStats)),
  getAssistantStats: () => apiRequest(() => api.get(apiEndpoints.assistantStats)),
  getHandlerStats: () => apiRequest(() => api.get(apiEndpoints.handlerStats)),
};

// Pricing API
export const pricingApi = {
  calculatePrice: (data) => apiRequest(() => api.post(apiEndpoints.calculatePrice, data)),
  updatePriceRealtime: (id, data) => apiRequest(() => api.patch(apiEndpoints.updatePriceRealtime(id), data)),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiRequest(() => api.get(apiEndpoints.notifications)),
  markAsRead: (id) => apiRequest(() => api.post(apiEndpoints.notificationMarkAsRead(id), {})),
  markAllAsRead: () => apiRequest(() => api.post(apiEndpoints.notificationMarkAllAsRead, {})),
  getUnreadCount: () => apiRequest(() => api.get(apiEndpoints.notificationUnreadCount)),
};

// Referrals API
export const referralsApi = {
  getAll: () => apiRequest(() => api.get(apiEndpoints.referrals)),
};

export default api;
