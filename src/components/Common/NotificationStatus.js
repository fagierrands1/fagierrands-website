// src/components/Common/NotificationStatus.js
import React from 'react';
import { FaWifi, FaWifiSlash } from 'react-icons/fa';
import notificationService from '../../services/simpleNotificationService';

/**
 * Shows notification system status (connected/mock mode)
 */
const NotificationStatus = ({ className = '' }) => {
  const isMockMode = notificationService.mockMode;

  if (!isMockMode) {
    return null; // Don't show anything when connected
  }

  return (
    <div className={`flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded ${className}`}>
      <FaWifiSlash className="w-3 h-3 mr-1" />
      <span>Offline Mode</span>
    </div>
  );
};

/**
 * Detailed notification status for admin/debug
 */
export const DetailedNotificationStatus = ({ className = '' }) => {
  const isMockMode = notificationService.mockMode;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        {isMockMode ? (
          <FaWifiSlash className="w-4 h-4 mr-2 text-yellow-600" />
        ) : (
          <FaWifi className="w-4 h-4 mr-2 text-green-600" />
        )}
        Notification System Status
      </h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Backend Connection:</span>
          <span className={`font-medium ${isMockMode ? 'text-yellow-600' : 'text-green-600'}`}>
            {isMockMode ? 'Offline' : 'Connected'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Mode:</span>
          <span className={`font-medium ${isMockMode ? 'text-yellow-600' : 'text-green-600'}`}>
            {isMockMode ? 'Mock/Demo' : 'Live'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Browser Notifications:</span>
          <span className={`font-medium ${
            Notification.permission === 'granted' ? 'text-green-600' : 
            Notification.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {Notification.permission === 'granted' ? 'Enabled' : 
             Notification.permission === 'denied' ? 'Blocked' : 'Not Set'}
          </span>
        </div>
      </div>
      
      {isMockMode && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
          <strong>Note:</strong> Running in offline mode. Notifications will work locally but won't sync with the server.
        </div>
      )}
    </div>
  );
};

export default NotificationStatus;