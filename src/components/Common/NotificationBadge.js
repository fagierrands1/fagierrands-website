import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { FaBell } from 'react-icons/fa';

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();

  return (
    <Link to="/notifications" className="relative inline-block">
      <FaBell className="w-6 h-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBadge;