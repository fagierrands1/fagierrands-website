// src/hooks/useNotificationActions.js
import { useNotifications } from '../contexts/NotificationContext';
import notificationService from '../services/simpleNotificationService';

/**
 * Hook for notification actions and utilities
 */
export const useNotificationActions = () => {
  const { addRealTimeNotification } = useNotifications();

  /**
   * Show a success notification
   */
  const showSuccess = (message, options = {}) => {
    const notification = {
      id: Date.now(),
      type: 'order_completed',
      title: 'Success',
      message,
      created_at: new Date().toISOString(),
      read: false,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification('Success', {
      body: message,
      ...options
    });
  };

  /**
   * Show an error notification
   */
  const showError = (message, options = {}) => {
    const notification = {
      id: Date.now(),
      type: 'order_cancelled',
      title: 'Error',
      message,
      created_at: new Date().toISOString(),
      read: false,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification('Error', {
      body: message,
      ...options
    });
  };

  /**
   * Show an info notification
   */
  const showInfo = (message, options = {}) => {
    const notification = {
      id: Date.now(),
      type: 'system',
      title: 'Information',
      message,
      created_at: new Date().toISOString(),
      read: false,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification('Information', {
      body: message,
      ...options
    });
  };

  /**
   * Show a warning notification
   */
  const showWarning = (message, options = {}) => {
    const notification = {
      id: Date.now(),
      type: 'payment_failed',
      title: 'Warning',
      message,
      created_at: new Date().toISOString(),
      read: false,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification('Warning', {
      body: message,
      ...options
    });
  };

  /**
   * Show an order notification
   */
  const showOrderNotification = (type, message, orderId = null, options = {}) => {
    const notification = {
      id: Date.now(),
      type,
      title: notificationService.getNotificationTypeInfo(type).title,
      message,
      created_at: new Date().toISOString(),
      read: false,
      action_link: orderId ? `/orders/${orderId}` : null,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification(notification.title, {
      body: message,
      ...options
    });
  };

  /**
   * Show a payment notification
   */
  const showPaymentNotification = (success, message, options = {}) => {
    const type = success ? 'payment_received' : 'payment_failed';
    const notification = {
      id: Date.now(),
      type,
      title: success ? 'Payment Successful' : 'Payment Failed',
      message,
      created_at: new Date().toISOString(),
      read: false,
      ...options
    };

    addRealTimeNotification(notification);
    
    // Add to mock notifications if in mock mode
    notificationService.addMockNotification(notification);
    
    // Also show browser notification if permission granted
    notificationService.showBrowserNotification(notification.title, {
      body: message,
      ...options
    });
  };

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    return await notificationService.requestNotificationPermission();
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showOrderNotification,
    showPaymentNotification,
    requestPermission
  };
};

export default useNotificationActions;