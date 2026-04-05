// src/components/Common/NotificationToast.js
import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfo, FaBell } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationService from '../../services/simpleNotificationService';

/**
 * Toast Notification Component
 * Shows real-time notifications as toast messages
 */
const NotificationToast = ({ 
  notification, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300); // Animation duration
  };

  const getToastIcon = (type) => {
    const typeInfo = notificationService.getNotificationTypeInfo(type);
    const iconMap = {
      'order_created': FaBell,
      'order_completed': FaCheck,
      'order_cancelled': FaExclamationTriangle,
      'payment_received': FaCheck,
      'payment_failed': FaExclamationTriangle,
      'verification_approved': FaCheck,
      'verification_rejected': FaExclamationTriangle,
      'system': FaInfo,
      'default': FaBell
    };

    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getToastColors = (type) => {
    const typeInfo = notificationService.getNotificationTypeInfo(type);
    const colorMap = {
      blue: 'bg-blue-500 border-blue-600',
      green: 'bg-green-500 border-green-600',
      red: 'bg-red-500 border-red-600',
      yellow: 'bg-yellow-500 border-yellow-600',
      purple: 'bg-purple-500 border-purple-600',
      indigo: 'bg-indigo-500 border-indigo-600',
      gray: 'bg-gray-500 border-gray-600'
    };

    return colorMap[typeInfo.color] || colorMap.gray;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 
        ${getToastColors(notification.type)}
        transform transition-all duration-300 ease-in-out
        ${isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${getToastColors(notification.type).split(' ')[0].replace('bg-', 'text-')}`}>
            {getToastIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {notification.title || notificationService.getNotificationTypeInfo(notification.type).title}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            {notification.action_link && (
              <a
                href={notification.action_link}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                View Details →
              </a>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {autoClose && (
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full ${getToastColors(notification.type).split(' ')[0]} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

/**
 * Toast Container Component
 * Manages multiple toast notifications
 */
export const NotificationToastContainer = () => {
  const { realTimeNotifications, clearRealTimeNotifications } = useNotifications();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (realTimeNotifications.length > 0) {
      // Filter out notifications for cancelled/completed orders and old notifications
      const filteredNotifications = realTimeNotifications.filter(notif => {
        const message = (notif.message || '').toLowerCase();
        const orderStatus = (notif.order_status || '').toLowerCase();
        const isCancelledOrCompleted = 
          message.includes('status: cancelled') || 
          message.includes('status: completed') ||
          message.includes('cancelled.') ||
          message.includes('completed.') ||
          orderStatus === 'cancelled' ||
          orderStatus === 'completed';
        
        // Check if notification is old (more than 1 minute for toasts)
        const notificationTime = notif.created_at ? new Date(notif.created_at).getTime() : Date.now();
        const notificationAge = Date.now() - notificationTime;
        const isTooOldForToast = notificationAge > 1 * 60 * 1000; // 1 minute
        const isVeryRecent = notificationAge < 30 * 1000; // 30 seconds
        
        // Don't show if:
        // 1. It's too old (more than 1 minute)
        // 2. It's a cancelled/completed order notification (unless it's very recent - less than 30 seconds)
        if (isTooOldForToast) {
          console.log('[NotificationToast] Filtering out old notification:', notif.id, 'age:', Math.round(notificationAge / 1000), 'seconds');
          return false;
        }
        
        if (isCancelledOrCompleted && !isVeryRecent) {
          console.log('[NotificationToast] Filtering out cancelled/completed order notification:', notif.id, 'status:', orderStatus);
          return false;
        }
        
        return true;
      });
      
      setToasts(filteredNotifications);
    } else {
      setToasts([]);
    }
  }, [realTimeNotifications]);

  const removeToast = (index) => {
    setToasts(prev => prev.filter((_, i) => i !== index));
    
    // If this was the last toast, clear real-time notifications
    if (toasts.length === 1) {
      clearRealTimeNotifications();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((notification, index) => (
        <NotificationToast
          key={`${notification.id}-${index}`}
          notification={notification}
          onClose={() => removeToast(index)}
          autoClose={true}
          duration={5000}
        />
      ))}
    </div>
  );
};

/**
 * Success Toast Component
 */
export const SuccessToast = ({ message, onClose, autoClose = true }) => {
  return (
    <NotificationToast
      notification={{
        type: 'order_completed',
        title: 'Success',
        message
      }}
      onClose={onClose}
      autoClose={autoClose}
    />
  );
};

/**
 * Error Toast Component
 */
export const ErrorToast = ({ message, onClose, autoClose = true }) => {
  return (
    <NotificationToast
      notification={{
        type: 'order_cancelled',
        title: 'Error',
        message
      }}
      onClose={onClose}
      autoClose={autoClose}
    />
  );
};

/**
 * Info Toast Component
 */
export const InfoToast = ({ message, onClose, autoClose = true }) => {
  return (
    <NotificationToast
      notification={{
        type: 'system',
        title: 'Information',
        message
      }}
      onClose={onClose}
      autoClose={autoClose}
    />
  );
};

/**
 * Warning Toast Component
 */
export const WarningToast = ({ message, onClose, autoClose = true }) => {
  return (
    <NotificationToast
      notification={{
        type: 'payment_failed',
        title: 'Warning',
        message
      }}
      onClose={onClose}
      autoClose={autoClose}
    />
  );
};

export default NotificationToast;