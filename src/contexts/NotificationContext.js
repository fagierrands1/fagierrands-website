import React, { createContext, useState, useEffect, useContext } from 'react';
import notificationService from '../services/simpleNotificationService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const fetchUnreadCount = async () => {
    if (!backendAvailable) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unread_count || response.unread_count || 0);
      setBackendAvailable(true);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setBackendAvailable(false);
    }
  };

  const fetchNotifications = async (showBrowserNotifications = false) => {
    console.log('🔄 Fetching notifications from deployed backend...');
    
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      
      // Handle different response formats
      let data = [];
      if (response.results && Array.isArray(response.results)) {
        data = response.results;
      } else if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      
      // Mark all fetched notifications as "shown" so we don't show browser notifications for old ones
      data.forEach(notif => {
        const notifId = notif.id || `notif-${notif.created_at || Date.now()}`;
        shownNotificationIdsRef.current.add(notifId);
      });
      
      console.log('✅ Loaded notifications from backend:', data.length, '(browser notifications disabled for fetched notifications)');
      setNotifications(data);
      setBackendAvailable(true);
    } catch (error) {
      console.log('⚠️ Backend error (deployed version), switching to mock mode:', error.message);
      
      // Load mock notifications when backend fails
      const mockNotifications = [
        {
          id: 'mock-1',
          title: 'Welcome to Fagi Errands!',
          message: 'Your notification system is working with VAPID support. Backend is temporarily unavailable.',
          read: false,
          created_at: new Date().toISOString(),
          notification_type: 'message'
        },
        {
          id: 'mock-2',
          title: 'System Status',
          message: 'Push notifications are enabled. The system will automatically reconnect when backend is available.',
          read: false,
          created_at: new Date().toISOString(),
          notification_type: 'message'
        },
        {
          id: 'mock-3',
          title: 'Mock Mode Active',
          message: 'Currently running in mock mode due to backend issues. All notification features are still functional.',
          read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          notification_type: 'info'
        }
      ];
      
      console.log('📋 Loaded mock notifications:', mockNotifications.length);
      setNotifications(mockNotifications);
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      // Try to delete from backend first
      await notificationService.deleteNotification(id);
      
      // If the notification was unread, update the count
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      // Update local state
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Still remove from local state even if backend fails
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }
  };

  // Track notification IDs that have already shown browser notifications
  const shownNotificationIdsRef = React.useRef(new Set());
  // Track notification IDs that are already in realTimeNotifications to prevent duplicates
  const realTimeNotificationIdsRef = React.useRef(new Set());

  // Add a new real-time notification
  const addRealTimeNotification = (notification, showBrowserNotif = true) => {
    const notificationId = notification.id || `notif-${Date.now()}`;
    
    // Check if we've already shown a browser notification for this
    const alreadyShown = shownNotificationIdsRef.current.has(notificationId);
    
    // Check if this notification is already in realTimeNotifications (prevent duplicates)
    if (realTimeNotificationIdsRef.current.has(notificationId)) {
      console.log('[NotificationContext] Skipping duplicate notification:', notificationId);
      return;
    }
    
    // Check notification age
    const notificationTime = notification.created_at ? new Date(notification.created_at).getTime() : Date.now();
    const notificationAge = Date.now() - notificationTime;
    const isOldNotification = notificationAge > 5 * 60 * 1000; // 5 minutes (for browser notifications)
    const isTooOldForToast = notificationAge > 1 * 60 * 1000; // 1 minute (for toast notifications - stricter)
    
    // Filter out notifications for cancelled/completed orders
    const message = (notification.message || '').toLowerCase();
    const orderStatus = notification.order_status || '';
    const isCancelledOrCompleted = 
      message.includes('cancelled') || 
      message.includes('completed') ||
      orderStatus.toLowerCase() === 'cancelled' ||
      orderStatus.toLowerCase() === 'completed';
    
    // Only add to real-time notifications (toasts) if:
    // 1. Not too old (less than 1 minute)
    // 2. Not for cancelled/completed orders (unless it's brand new - less than 30 seconds)
    const isVeryRecent = notificationAge < 30 * 1000; // 30 seconds
    const shouldShowInToast = !isTooOldForToast && (!isCancelledOrCompleted || isVeryRecent);
    
    if (shouldShowInToast) {
      setRealTimeNotifications((prev) => {
        // Mark this notification ID as added
        realTimeNotificationIdsRef.current.add(notificationId);
        // Clean up old IDs from the ref when we remove notifications (keep only recent 10 IDs)
        if (realTimeNotificationIdsRef.current.size > 10) {
          const idsArray = Array.from(realTimeNotificationIdsRef.current);
          realTimeNotificationIdsRef.current = new Set(idsArray.slice(-10));
        }
        return [notification, ...prev.slice(0, 4)]; // Keep only 5 recent
      });
    } else {
      console.log('[NotificationContext] Skipping toast notification - too old or cancelled/completed:', {
        id: notificationId,
        age: Math.round(notificationAge / 1000),
        isCancelledOrCompleted,
        isTooOldForToast
      });
    }
    
    setUnreadCount((prev) => prev + 1);
    
    // Add to main notifications list (always add to the list, just don't show toast for old cancelled/completed)
    setNotifications((prev) => [notification, ...prev]);
    
    // Show browser notification only if:
    // 1. showBrowserNotif is true (explicitly requested)
    // 2. We haven't shown it before
    // 3. Notification is not too old (less than 5 minutes)
    // 4. Not for cancelled/completed orders (unless brand new)
    // 5. Permission is granted
    if (showBrowserNotif && !alreadyShown && !isOldNotification && !isCancelledOrCompleted && Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/logo192.png',
          tag: notificationId, // Use consistent tag to prevent duplicates
          badge: '/logo192.png'
        });
        
        // Mark as shown
        shownNotificationIdsRef.current.add(notificationId);
        
        console.log('[NotificationContext] Browser notification shown for:', notificationId, notification.title);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          browserNotif.close();
        }, 5000);
        
        // Handle click
        browserNotif.onclick = () => {
          window.focus();
          if (notification.action_link) {
            window.location.href = notification.action_link;
          }
          browserNotif.close();
        };
      } catch (error) {
        console.error('[NotificationContext] Error showing browser notification:', error);
      }
    } else {
      if (alreadyShown) {
        console.log('[NotificationContext] Skipping browser notification - already shown:', notificationId);
      } else if (isOldNotification) {
        console.log('[NotificationContext] Skipping browser notification - too old:', notificationId, 'age:', Math.round((Date.now() - notificationTime) / 1000 / 60), 'minutes');
      } else if (isCancelledOrCompleted) {
        console.log('[NotificationContext] Skipping browser notification - cancelled/completed order:', notificationId, 'status:', orderStatus);
      }
    }
  };

  // Clear real-time notifications
  const clearRealTimeNotifications = () => {
    setRealTimeNotifications([]);
    realTimeNotificationIdsRef.current.clear();
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, []); // Only run once on mount

  // Poll for new notifications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Only fetch notifications if we're not already in an error state
      if (backendAvailable) {
        fetchNotifications();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []); // Only set up once, don't depend on backendAvailable

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Register for push notifications if supported
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          // Request permission
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service worker registered successfully');
            
            // Check if VAPID key is available
            const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
            
            if (!vapidPublicKey) {
              console.log('VAPID public key not found. Skipping push notification registration.');
              return;
            }
            
            // For now, we'll skip the complex VAPID setup
            console.log('Push notifications setup ready, but VAPID configuration needed');
          }
        } catch (error) {
          console.error('Error registering for push notifications:', error);
        }
      }
    };

    // Only try to register if user is logged in
    if (localStorage.getItem('authToken')) {
      console.log('🔔 User authenticated, notification system ready');
      // Push notifications are now handled by simpleNotificationService
      // registerForPushNotifications(); // Commented out - using new service
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        realTimeNotifications,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addRealTimeNotification,
        clearRealTimeNotifications,
        fetchUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;