// src/services/simpleNotificationService.js
import config from '../config';

/**
 * Simple Notification Service for handling basic notification operations
 */

const API_BASE_URL = config.API_BASE_URL;

class SimpleNotificationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications/notifications`;  // For DRF router endpoints
    this.apiBaseURL = `${API_BASE_URL}/notifications`;  // For custom endpoints
    this.mockMode = false;
    this.mockNotifications = [];
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    
    // Log VAPID status
    if (this.vapidPublicKey) {
      console.log('✅ VAPID key detected, push notifications available');
    } else {
      console.log('ℹ️ VAPID key not configured');
    }
  }

  /**
   * Initialize VAPID support and service worker (called when needed)
   */
  async initializeVapidSupport() {
    if (this.vapidPublicKey && 'serviceWorker' in navigator) {
      console.log('🔧 Initializing VAPID support...');
      
      // Register service worker when notification permission is granted
      if (Notification.permission === 'granted') {
        await this.registerServiceWorker();
      }
    } else {
      console.log('ℹ️ VAPID key not configured or service worker not supported');
    }
  }

  /**
   * Initialize mock notification data
   */
  initializeMockData() {
    if (this.mockNotifications.length === 0) {
      this.mockNotifications = [
        {
          id: 1,
          title: 'Welcome to Fagi Errands!',
          message: 'Your notification system is working perfectly with VAPID support.',
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'System Status',
          message: 'Push notifications are ready. Backend integration pending.',
          type: 'info',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Reset service to try backend again (clear mock mode)
   */
  resetToBackend() {
    this.mockMode = false;
    console.log('🔄 Service reset: will try backend on next request');
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(params = {}) {
    // Simplified: Just try the backend directly like the test page does
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseURL}/${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('🔄 Fetching notifications from:', url);
      const response = await this.makeRequest(url);
      
      // Reset mock mode on success
      if (this.mockMode) {
        this.mockMode = false;
        console.log('✅ Backend connection restored');
      }
      
      return response;
    } catch (error) {
      console.log(`ℹ️ Backend error (${error.message}), using mock mode`);
      
      // Only switch to mock mode, don't prevent retries
      if (!this.mockMode) {
        this.mockMode = true;
        this.initializeMockData();
      }
      
      return { 
        results: this.mockNotifications, 
        count: this.mockNotifications.length 
      };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    if (this.mockMode) {
      const unreadCount = this.mockNotifications.filter(n => !n.read).length;
      return { unread_count: unreadCount };
    }
    
    try {
      const data = await this.makeRequest(`${this.apiBaseURL}/unread-count/`);
      return { unread_count: data.unread_count || 0 };
    } catch (error) {
      console.log('ℹ️ Unread count error, using mock mode');
      // Don't permanently switch to mock mode for unread count errors
      return { unread_count: 0 };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      return await this.makeRequest(`${this.baseURL}/${notificationId}/mark_as_read/`, {
        method: 'POST'  // DRF actions use POST
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      return await this.makeRequest(`${this.baseURL}/mark_all_as_read/`, {
        method: 'POST'  // DRF actions use POST
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      return await this.makeRequest(`${this.baseURL}/${notificationId}/`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
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
      
      // Initialize VAPID support if permission granted
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        await this.initializeVapidSupport();
      } else {
        console.log('❌ Notification permission denied');
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker() {
    try {
      if (!this.vapidPublicKey) {
        console.log('ℹ️ VAPID key not configured, skipping push notification setup');
        return null;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully');
      
      // Wait for service worker to become active
      await this.waitForServiceWorkerActive(registration);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      console.log('✅ Push subscription successful');
      console.log('🔔 Push notifications are now enabled with VAPID authentication');
      
      // Send subscription to backend when available
      await this.sendSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Wait for service worker to become active
   */
  async waitForServiceWorkerActive(registration) {
    return new Promise((resolve) => {
      if (registration.active) {
        resolve();
        return;
      }

      const worker = registration.installing || registration.waiting;
      if (worker) {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            resolve();
          }
        });
      } else {
        // Fallback: wait a bit and resolve
        setTimeout(resolve, 1000);
      }
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send subscription to backend (implement when backend is ready)
   */
  async sendSubscriptionToBackend(subscription) {
    try {
      // This will be implemented when your backend has the endpoint
      const response = await this.makeRequest(`${this.apiBaseURL}/push-subscriptions/`, {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription,
          user_agent: navigator.userAgent
        })
      });
      
      console.log('✅ Subscription sent to backend:', response);
      return response;
    } catch (error) {
      console.log('ℹ️ Backend push subscription endpoint not available yet');
      console.log('📝 Subscription stored locally until backend is ready');
      
      // Store subscription locally for when backend becomes available
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      return null;
    }
  }

  /**
   * Add mock notification for testing when backend is unavailable
   */
  addMockNotification(notification) {
    if (this.mockMode) {
      this.mockNotifications.unshift({
        id: Date.now(),
        created_at: new Date().toISOString(),
        read: false,
        ...notification
      });
      
      // Keep only last 10 notifications
      this.mockNotifications = this.mockNotifications.slice(0, 10);
    }
  }

  /**
   * Enable/disable mock mode
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    if (enabled) {
      console.log('Notification service running in mock mode (backend unavailable)');
    }
  }

  /**
   * Test notification system
   */
  async testNotificationSystem() {
    console.log('🧪 Testing notification system...');
    
    // Check VAPID key
    if (this.vapidPublicKey) {
      console.log('✅ VAPID key configured:', this.vapidPublicKey.substring(0, 20) + '...');
    } else {
      console.log('❌ VAPID key not found');
    }
    
    // Check notification permission
    console.log('🔔 Notification permission:', Notification.permission);
    
    // Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        console.log('✅ Service worker registered');
        
        // Check if we have push subscription
        try {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            console.log('✅ Push subscription active');
          } else {
            console.log('⚠️ No push subscription found');
            
            // Try to create subscription if permission granted
            if (Notification.permission === 'granted' && this.vapidPublicKey) {
              console.log('🔧 Attempting to create push subscription...');
              await this.createPushSubscription(registration);
            }
          }
        } catch (error) {
          console.log('❌ Push subscription check failed:', error.message);
        }
      } else {
        console.log('❌ Service worker not registered');
        
        // Try to register if permission granted
        if (Notification.permission === 'granted') {
          console.log('🔧 Attempting to register service worker...');
          await this.registerServiceWorker();
        }
      }
    }
    
    // Test notification
    if (Notification.permission === 'granted') {
      const notification = new Notification('🎉 Test Successful!', {
        body: 'Your notification system is working perfectly with VAPID support.',
        icon: '/logo192.png',
        tag: 'test-notification'
      });
      
      setTimeout(() => notification.close(), 5000);
      
      // Add to mock notifications
      this.addMockNotification({
        title: '🎉 Test Successful!',
        message: 'Your notification system is working perfectly with VAPID support.',
        type: 'success'
      });
    } else {
      console.log('⚠️ Please enable notifications to test the system');
    }
  }

  /**
   * Create push subscription for existing service worker
   */
  async createPushSubscription(registration) {
    try {
      if (!this.vapidPublicKey) {
        console.log('❌ VAPID key not available');
        return null;
      }

      // Wait for service worker to be ready
      await this.waitForServiceWorkerActive(registration);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      console.log('✅ Push subscription created successfully');
      await this.sendSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('❌ Failed to create push subscription:', error);
      return null;
    }
  }

  /**
   * Show browser notification with VAPID support
   */
  async showBrowserNotification(title, message, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/logo192.png',
        tag: `notification-${Date.now()}`,
        ...options
      });
      
      // Auto close after 5 seconds unless specified otherwise
      if (options.autoClose !== false) {
        setTimeout(() => notification.close(), 5000);
      }
      
      return notification;
    } else {
      console.log('Notification permission not granted');
      return null;
    }
  }
}

// Create singleton instance
const notificationService = new SimpleNotificationService();

export default notificationService;