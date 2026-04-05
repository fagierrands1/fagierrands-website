import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const Notification = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications();
  
  const [error, setError] = useState('');
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  // Filter to only show unread notifications in this component
  useEffect(() => {
    if (notifications) {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      setVisibleNotifications(unreadNotifications);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []); // Remove fetchNotifications dependency to prevent infinite loop

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to update notification status.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to update notifications status.');
    }
  };

  if (!visibleNotifications.length) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-80 z-50 space-y-2 bg-white shadow-lg rounded-md p-2">
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Notifications</h3>
        <button
          onClick={handleMarkAllAsRead}
          className="text-sm text-blue-600 hover:underline"
          aria-label="Mark all notifications as read"
        >
          Mark all as read
        </button>
      </div>
      {visibleNotifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-3 rounded border ${
            notif.type === 'error'
              ? 'border-red-400 bg-red-100 text-red-800'
              : notif.type === 'success'
              ? 'border-green-400 bg-green-100 text-green-800'
              : 'border-gray-300 bg-gray-100 text-gray-800'
          } flex justify-between items-center`}
        >
          <div>{notif.message}</div>
          <button
            onClick={() => handleMarkAsRead(notif.id)}
            className="ml-4 font-bold text-gray-600 hover:text-gray-900"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
