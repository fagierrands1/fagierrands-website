// src/services/notificationService.js
import axios from 'axios';

// Fallback axios configuration if axiosConfig is not available
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with basic configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Notification Service for handling all notification-related API calls
 */
class NotificationService {
  constructor() {
    this.baseURL = '/api/notifications';
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseURL}/${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axiosInstance.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw this.handleError(error, 'Failed to fetch notifications');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/unread-count/`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw this.handleError(error, 'Failed to fetch unread count');
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(`${this.baseURL}/${notificationId}/read/`, {}, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw this.handleError(error, 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(`${this.baseURL}/mark-all-read/`, {}, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw this.handleError(error, 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${notificationId}/`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw this.handleError(error, 'Failed to delete notification');
    }
  }

  /**
   * Create a new notification (admin only)
   */
  async createNotification(notificationData) {
    try {
      const response = await axios.post(`${this.baseURL}/`, notificationData, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw this.handleError(error, 'Failed to create notification');
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await axios.get(`${this.baseURL}/preferences/`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw this.handleError(error, 'Failed to fetch notification preferences');
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await axios.patch(`${this.baseURL}/preferences/`, preferences, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw this.handleError(error, 'Failed to update notification preferences');
    }
  }

  /**
   * Register push notification token
   */
  async registerPushToken(token, platform = 'web') {
    try {
      const response = await axios.post(`${this.baseURL}/register-push-token/`, {
        token,
        platform
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw this.handleError(error, 'Failed to register push token');
    }
  }

  /**
   * Send test notification (admin only)
   */
  async sendTestNotification(userId, message) {
    try {
      const response = await axios.post(`${this.baseURL}/test/`, {
        user_id: userId,
        message
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw this.handleError(error, 'Failed to send test notification');
    }
  }

  /**
   * Get notification statistics (admin only)
   */
  async getNotificationStats(dateRange = {}) {
    try {
      const queryParams = new URLSearchParams(dateRange).toString();
      const url = `${this.baseURL}/stats/${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw this.handleError(error, 'Failed to fetch notification statistics');
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error, defaultMessage) {
    const message = error.response?.data?.message || 
                   error.response?.data?.detail || 
                   error.message || 
                   defaultMessage;
    
    console.error('Notification Service Error:', {
      message,
      status: error.response?.status,
      data: error.response?.data
    });

    return new Error(message);
  }

  /**
   * Format notification for display
   */
  formatNotification(notification) {
    return {
      ...notification,
      timeAgo: this.getTimeAgo(notification.created_at),
      typeInfo: this.getNotificationTypeInfo(notification.type)
    };
  }

  /**
   * Get time ago string
   */
  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get notification type information
   */
  getNotificationTypeInfo(type) {
    const typeMap = {
      'order_created': {
        icon: '🛍️',
        color: 'blue',
        title: 'New Order',
        priority: 'medium'
      },
      'order_assigned': {
        icon: '👤',
        color: 'green',
        title: 'Order Assigned',
        priority: 'medium'
      },
      'order_started': {
        icon: '▶️',
        color: 'indigo',
        title: 'Order Started',
        priority: 'medium'
      },
      'order_completed': {
        icon: '✅',
        color: 'green',
        title: 'Order Completed',
        priority: 'high'
      },
      'order_cancelled': {
        icon: '❌',
        color: 'red',
        title: 'Order Cancelled',
        priority: 'high'
      },
      'payment_received': {
        icon: '💰',
        color: 'green',
        title: 'Payment Received',
        priority: 'high'
      },
      'payment_failed': {
        icon: '💳',
        color: 'red',
        title: 'Payment Failed',
        priority: 'high'
      },
      'verification_approved': {
        icon: '✅',
        color: 'green',
        title: 'Verification Approved',
        priority: 'high'
      },
      'verification_rejected': {
        icon: '❌',
        color: 'red',
        title: 'Verification Rejected',
        priority: 'high'
      },
      'message': {
        icon: '💬',
        color: 'blue',
        title: 'New Message',
        priority: 'medium'
      },
      'review': {
        icon: '⭐',
        color: 'yellow',
        title: 'New Review',
        priority: 'low'
      },
      'system': {
        icon: '⚙️',
        color: 'gray',
        title: 'System Notification',
        priority: 'low'
      },
      'promotion': {
        icon: '🎉',
        color: 'purple',
        title: 'Promotion',
        priority: 'low'
      }
    };

    return typeMap[type] || {
      icon: '🔔',
      color: 'gray',
      title: 'Notification',
      priority: 'low'
    };
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
      
      if (options.onClick) {
        notification.onclick = options.onClick;
      }
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      return notification;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export individual methods for convenience
export const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushToken,
  sendTestNotification,
  getNotificationStats,
  formatNotification,
  getTimeAgo,
  getNotificationTypeInfo,
  showBrowserNotification,
  requestNotificationPermission
} = notificationService;

export { notificationService };
export default notificationService;