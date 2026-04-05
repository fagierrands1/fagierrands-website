import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Custom hook to detect and notify about new orders
 * @param {Array} currentOrders - Current list of orders
 * @param {Function} fetchOrders - Function to fetch orders
 * @param {Object} options - Configuration options
 */
const useOrderNotifications = (currentOrders = [], fetchOrders, options = {}) => {
  const { addRealTimeNotification } = useNotifications();
  const previousOrdersRef = useRef([]);
  const previousOrderIdsRef = useRef(new Set()); // Track all previously seen order IDs
  const notificationCooldownRef = useRef(new Set()); // Track notified order IDs
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const {
    enabled = true,
    pollInterval = 30000, // 30 seconds
    showBrowserNotification = true,
    notificationTitle = 'New Order Received',
    userRole = null // 'client', 'assistant', 'handler', 'admin'
  } = options;

  // Request notification permission
  useEffect(() => {
    if (enabled && showBrowserNotification && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('[OrderNotifications] Permission:', permission);
        });
      }
    }
  }, [enabled, showBrowserNotification]);

  // Detect new orders
  useEffect(() => {
    if (!enabled || !currentOrders) {
      return;
    }

    if (currentOrders.length === 0) {
      // On initial load with no orders, just set the reference
      if (isInitialLoadRef.current) {
        previousOrdersRef.current = [];
        isInitialLoadRef.current = false;
      }
      return;
    }

    // Skip notifications on initial load - only notify about orders that appear after the first load
    if (isInitialLoadRef.current) {
      console.log('[OrderNotifications] Initial load detected, skipping notifications for existing orders');
      // Store all order IDs from initial load so we don't notify about them later
      const initialOrderIds = new Set(currentOrders.map(o => o.id).filter(id => id));
      previousOrderIdsRef.current = initialOrderIds;
      previousOrdersRef.current = currentOrders;
      isInitialLoadRef.current = false;
      console.log('[OrderNotifications] Stored', initialOrderIds.size, 'order IDs from initial load');
      return;
    }

    // Use the persistent set of seen order IDs instead of just comparing arrays
    const previousOrderIds = previousOrderIdsRef.current;
    const currentOrderIds = new Set(currentOrders.map(o => o.id).filter(id => id));

    // Find truly new orders (orders that we've never seen before OR were just created)
    const newOrders = currentOrders.filter(order => {
      const orderId = order.id;
      const inPreviousSet = previousOrderIds.has(orderId);
      const inCooldown = notificationCooldownRef.current.has(orderId);
      
      // Check if order was recently created (within last 2 minutes)
      let isRecentlyCreated = false;
      if (order.created_at) {
        const createdTime = new Date(order.created_at).getTime();
        const ageMs = Date.now() - createdTime;
        const ageMinutes = ageMs / (1000 * 60);
        isRecentlyCreated = ageMinutes < 2;
      }
      
      // Order is new if:
      // 1. We haven't seen it before AND it's not in cooldown, OR
      // 2. It was just created (within last 2 minutes) and not in cooldown
      const isNew = (!inPreviousSet && !inCooldown) || (isRecentlyCreated && !inCooldown);
      
      if (isNew) {
        console.log('[OrderNotifications] ✅ Found NEW order:', {
          id: orderId,
          title: order.title,
          status: order.status,
          created_at: order.created_at,
          isRecentlyCreated,
          wasPreviouslySeen: inPreviousSet
        });
      }
      return isNew;
    });
    
    // Debug: Show sample of previously seen IDs
    if (previousOrderIds.size > 0) {
      const sampleIds = Array.from(previousOrderIds).slice(0, 3);
      console.debug('[OrderNotifications] Sample of previously seen IDs:', sampleIds, `(${previousOrderIds.size} total)`);
    }

    // Update the seen order IDs set with all current orders
    currentOrderIds.forEach(id => {
      if (id) {
        previousOrderIdsRef.current.add(id);
      }
    });

    // Notify about new orders
    newOrders.forEach(order => {
      const orderId = order.id;
      const orderStatus = (order.status || '').toLowerCase();
      
      // Skip notifications for cancelled orders, but allow pending and other statuses
      if (orderStatus === 'cancelled') {
        console.log('[OrderNotifications] Skipping notification for cancelled order:', orderId, 'status:', orderStatus);
        return; // Skip this order
      }
      
      // Add to cooldown to prevent duplicate notifications
      notificationCooldownRef.current.add(orderId);
      
      // Remove from cooldown after 5 minutes
      setTimeout(() => {
        notificationCooldownRef.current.delete(orderId);
      }, 5 * 60 * 1000);

      // Determine notification message based on user role
      let message = '';
      let actionLink = `/orders/${orderId}`;
      
      if (userRole === 'client') {
        message = `Your order "${order.title || `#${orderId}`}" has been created and is ${order.status || 'pending'}.`;
      } else if (userRole === 'assistant') {
        message = `New order "${order.title || `#${orderId}`}" has been assigned to you.`;
      } else if (userRole === 'handler' || userRole === 'admin') {
        message = `New order "${order.title || `#${orderId}`}" has been created. Status: ${order.status || 'pending'}.`;
      } else {
        message = `New order "${order.title || `#${orderId}`}" has been created.`;
      }

      // Add price info if available
      if (order.price) {
        message += ` Amount: ${typeof order.price === 'number' ? `$${order.price.toFixed(2)}` : order.price}`;
      }

      // Create notification
      const notification = {
        id: `order-${orderId}-${Date.now()}`,
        type: 'order',
        title: notificationTitle,
        message: message,
        created_at: new Date().toISOString(),
        read: false,
        action_link: actionLink,
        order_id: orderId,
        order_status: order.status
      };

      // Add to notification system (this will handle browser notification if needed)
      // Pass showBrowserNotif flag to control whether to show browser notification
      addRealTimeNotification(notification, showBrowserNotification);
      
      // Note: Browser notification is now handled by addRealTimeNotification to prevent duplicates

      console.log('[OrderNotifications] New order detected:', {
        id: orderId,
        title: order.title,
        status: order.status
      });
    });

    // Update previous orders reference (for other comparisons if needed)
    previousOrdersRef.current = currentOrders;
    
    if (newOrders.length === 0 && currentOrders.length > 0) {
      console.log('[OrderNotifications] ⚠️  No new orders detected', {
        totalOrders: currentOrders.length,
        previouslySeenCount: previousOrderIds.size,
        cooldownCount: notificationCooldownRef.current.size,
        note: 'All orders have already been seen'
      });
    } else if (newOrders.length > 0) {
      console.log('[OrderNotifications] ✅ Processed', newOrders.length, 'NEW orders out of', currentOrders.length, 'total');
    } else {
      console.log('[OrderNotifications] Processing orders, total:', currentOrders.length);
    }
  }, [currentOrders, enabled, showBrowserNotification, userRole, addRealTimeNotification, notificationTitle]);

  // Polling for new orders (only if pollInterval > 0)
  useEffect(() => {
    if (!enabled || !fetchOrders || pollInterval <= 0) return;

    const intervalId = setInterval(() => {
      console.log('[OrderNotifications] Polling for new orders...');
      fetchOrders();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [enabled, fetchOrders, pollInterval]);

  // Trigger refresh when new orders are detected (only for truly new orders)
  useEffect(() => {
    if (!enabled || !fetchOrders || isInitialLoadRef.current) return;

    const previousOrderIds = previousOrderIdsRef.current;
    const currentOrderIds = new Set((currentOrders || []).map(o => o.id));

    // Check if there are truly new orders (not just array reference changes)
    const hasNewOrders = Array.from(currentOrderIds).some(id => !previousOrderIds.has(id));

    if (hasNewOrders && previousOrdersRef.current.length > 0) {
      // New orders detected - trigger a refresh to get latest data
      console.log('[OrderNotifications] New orders detected, triggering refresh...');
      // Small delay to ensure backend has processed the new order
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    }
  }, [currentOrders, enabled, fetchOrders]);

  return {
    enabled,
    pollInterval
  };
};

export default useOrderNotifications;

