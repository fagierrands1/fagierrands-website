/**
 * Utility functions for handling notifications
 */

// Request permission for browser notifications
export const requestNotificationPermission = async () => {
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
};

// Show a browser notification
export const showBrowserNotification = (title, options = {}) => {
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
};

// Map notification types to icons and colors
export const getNotificationTypeInfo = (type) => {
  switch (type) {
    case 'order_created':
      return { 
        icon: 'shopping-bag', 
        color: 'blue',
        title: 'New Order'
      };
    case 'order_assigned':
      return { 
        icon: 'user-check', 
        color: 'green',
        title: 'Order Assigned'
      };
    case 'order_started':
      return { 
        icon: 'play-circle', 
        color: 'indigo',
        title: 'Order Started'
      };
    case 'order_completed':
      return { 
        icon: 'check-circle', 
        color: 'green',
        title: 'Order Completed'
      };
    case 'order_cancelled':
      return { 
        icon: 'x-circle', 
        color: 'red',
        title: 'Order Cancelled'
      };
    case 'verification_approved':
      return { 
        icon: 'badge-check', 
        color: 'green',
        title: 'Verification Approved'
      };
    case 'verification_rejected':
      return { 
        icon: 'exclamation-circle', 
        color: 'red',
        title: 'Verification Rejected'
      };
    case 'message':
      return { 
        icon: 'chat', 
        color: 'blue',
        title: 'New Message'
      };
    case 'review':
      return { 
        icon: 'star', 
        color: 'yellow',
        title: 'New Review'
      };
    default:
      return { 
        icon: 'bell', 
        color: 'gray',
        title: 'Notification'
      };
  }
};