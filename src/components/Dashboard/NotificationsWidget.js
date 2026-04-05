import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaInfoCircle, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimes,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import './NotificationsWidget.css';

const NotificationsWidget = ({ data }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Generate sample notifications based on data
    const generateNotifications = () => {
      const notifs = [];
      const now = new Date();

      // Order notifications
      if (data.total_orders > 20) {
        notifs.push({
          id: 1,
          type: 'success',
          title: 'Order Milestone Reached',
          message: `Congratulations! You've reached ${data.total_orders} total orders.`,
          time: new Date(now - 5 * 60000), // 5 minutes ago
          read: false,
          priority: 'normal'
        });
      }

      // Revenue notifications
      if (data.revenue_growth_rate > 10) {
        notifs.push({
          id: 2,
          type: 'info',
          title: 'Revenue Growth Alert',
          message: `Revenue growth is up ${data.revenue_growth_rate}% this month!`,
          time: new Date(now - 15 * 60000), // 15 minutes ago
          read: false,
          priority: 'high'
        });
      }

      // Performance warnings
      if (data.avg_response_time > 600) { // More than 10 minutes
        notifs.push({
          id: 3,
          type: 'warning',
          title: 'Response Time Alert',
          message: 'Average response time is higher than recommended.',
          time: new Date(now - 30 * 60000), // 30 minutes ago
          read: true,
          priority: 'high'
        });
      }

      // User growth
      if (data.user_growth_rate > 0) {
        notifs.push({
          id: 4,
          type: 'success',
          title: 'User Growth',
          message: `${data.new_users_last_30_days} new users joined this month.`,
          time: new Date(now - 60 * 60000), // 1 hour ago
          read: true,
          priority: 'normal'
        });
      }

      // System notifications
      notifs.push({
        id: 5,
        type: 'info',
        title: 'System Update',
        message: 'Dashboard analytics updated with latest data.',
        time: new Date(now - 2 * 60 * 60000), // 2 hours ago
        read: true,
        priority: 'low'
      });

      return notifs.sort((a, b) => b.time - a.time);
    };

    const notifs = generateNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, [data]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return FaCheckCircle;
      case 'warning': return FaExclamationTriangle;
      case 'info': return FaInfoCircle;
      default: return FaBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'info': return '#667eea';
      default: return '#6b7280';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const displayedNotifications = showAll 
    ? notifications 
    : notifications.slice(0, 3);

  return (
    <div className="notifications-widget">
      <div className="widget-header">
        <div className="header-title">
          <FaBell className="header-icon" />
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-read-btn"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <FaEye />
            </button>
          )}
          <button 
            className="toggle-btn"
            onClick={() => setShowAll(!showAll)}
            title={showAll ? "Show less" : "Show all"}
          >
            {showAll ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {displayedNotifications.length === 0 ? (
          <div className="no-notifications">
            <FaBell className="no-notif-icon" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="notifications-grid">
            {displayedNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const color = getNotificationColor(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <div 
                        className="notification-icon"
                        style={{ color }}
                      >
                        <IconComponent />
                      </div>
                      <div className="notification-meta">
                        <h4 className="notification-title">{notification.title}</h4>
                        <span className="notification-time">
                          {formatTime(notification.time)}
                        </span>
                      </div>
                      {notification.priority === 'high' && (
                        <div className="priority-indicator high"></div>
                      )}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 3 && (
        <div className="widget-footer">
          <button 
            className="show-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? `Show less` : `Show ${notifications.length - 3} more`}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsWidget;