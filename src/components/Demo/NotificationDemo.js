// src/components/Demo/NotificationDemo.js
import React from 'react';
import { FaBell, FaCheck, FaExclamationTriangle, FaInfo, FaShoppingBag } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import useNotificationActions from '../../hooks/useNotificationActions';
import NotificationBell from '../Common/NotificationBell';
import { DetailedNotificationStatus } from '../Common/NotificationStatus';

/**
 * Demo component to showcase notification functionality
 * This can be added to any dashboard for testing
 */
const NotificationDemo = () => {
  const { unreadCount, notifications } = useNotifications();
  const { 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning, 
    showOrderNotification, 
    showPaymentNotification,
    requestPermission 
  } = useNotificationActions();

  const handleTestNotifications = () => {
    // Test different types of notifications
    setTimeout(() => showSuccess('Order completed successfully!'), 500);
    setTimeout(() => showInfo('New message from customer'), 1000);
    setTimeout(() => showWarning('Payment verification pending'), 1500);
    setTimeout(() => showError('Failed to update order status'), 2000);
    setTimeout(() => showOrderNotification('order_created', 'New shopping order received', '12345'), 2500);
    setTimeout(() => showPaymentNotification(true, 'Payment of KES 1,500 received'), 3000);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      showSuccess('Browser notifications enabled!');
    } else {
      showWarning('Browser notifications not enabled');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBell className="mr-3 text-blue-600" />
          Notification System Demo
        </h2>
        <NotificationBell />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <FaBell className="text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Unread Count</p>
              <p className="text-2xl font-bold text-blue-800">{unreadCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <FaCheck className="text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Notifications</p>
              <p className="text-2xl font-bold text-green-800">{notifications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Notifications</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => showSuccess('This is a success message!')}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaCheck className="mr-2" />
            Success
          </button>
          
          <button
            onClick={() => showError('This is an error message!')}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaExclamationTriangle className="mr-2" />
            Error
          </button>
          
          <button
            onClick={() => showInfo('This is an info message!')}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaInfo className="mr-2" />
            Info
          </button>
          
          <button
            onClick={() => showWarning('This is a warning message!')}
            className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <FaExclamationTriangle className="mr-2" />
            Warning
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => showOrderNotification('order_created', 'New shopping order from John Doe', '12345')}
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaShoppingBag className="mr-2" />
            Order Notification
          </button>
          
          <button
            onClick={() => showPaymentNotification(true, 'Payment of KES 2,500 received successfully')}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            💰 Payment Success
          </button>
          
          <button
            onClick={handleTestNotifications}
            className="flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            🚀 Test All Notifications
          </button>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleRequestPermission}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FaBell className="mr-2" />
            Enable Browser Notifications
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6">
        <DetailedNotificationStatus />
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2">How to Use Notifications:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>1.</strong> Import the hook: <code className="bg-gray-200 px-1 rounded">import useNotificationActions from '../hooks/useNotificationActions';</code></p>
          <p><strong>2.</strong> Use in component: <code className="bg-gray-200 px-1 rounded">const {`{ showSuccess, showError }`} = useNotificationActions();</code></p>
          <p><strong>3.</strong> Show notifications: <code className="bg-gray-200 px-1 rounded">showSuccess('Order completed!');</code></p>
          <p><strong>4.</strong> Add NotificationBell to header for notification dropdown</p>
          <p><strong>5.</strong> System works offline - notifications will be stored locally until backend is available</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;