// src/components/Test/NotificationTest.js
import React, { useState } from 'react';
import notificationService from '../../services/simpleNotificationService';

const NotificationTest = () => {
  const [status, setStatus] = useState('');

  const handleEnableNotifications = async () => {
    setStatus('Requesting permission...');
    const granted = await notificationService.requestNotificationPermission();
    
    if (granted) {
      setStatus('✅ Notifications enabled! Initializing VAPID support...');
      // Wait a moment for service worker to activate
      setTimeout(() => {
        setStatus('✅ Notifications ready! You can now test the system.');
      }, 2000);
    } else {
      setStatus('❌ Notifications denied or not supported.');
    }
  };

  const handleTestNotification = async () => {
    await notificationService.testNotificationSystem();
    setStatus('🧪 Test completed - check console for details');
  };

  const handleQuickTest = async () => {
    await notificationService.showBrowserNotification(
      '🚀 Quick Test',
      'This is a test notification with VAPID support!'
    );
    setStatus('📱 Test notification sent!');
  };

  const handleBackendTest = async () => {
    setStatus('Testing deployed backend connection...');
    try {
      // First test the health endpoint (no auth required)
      const healthResponse = await fetch('https://fagierrands-server.vercel.app/api/notifications/health/', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setStatus(`✅ Backend health check passed! CORS origin: ${healthData.cors_origin}`);
        
        // Now test authenticated endpoint
        const authResponse = await fetch('https://fagierrands-server.vercel.app/api/notifications/unread-count/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (authResponse.ok) {
          const data = await authResponse.json();
          setStatus(`✅ Full backend test passed! Unread count: ${data.count || data.unread_count || 0}`);
        } else {
          setStatus(`⚠️ Health OK, but auth failed: ${authResponse.status} ${authResponse.statusText}`);
        }
      } else {
        setStatus(`❌ Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
    } catch (error) {
      if (error.message.includes('CORS')) {
        setStatus(`❌ CORS error: ${error.message}`);
      } else {
        setStatus(`❌ Backend connection failed: ${error.message}`);
      }
    }
  };

  const handleGetNotifications = async () => {
    setStatus('Fetching notifications from deployed backend...');
    try {
      const notifications = await notificationService.getNotifications();
      const count = notifications.results?.length || notifications.length || 0;
      const total = notifications.count || count;
      setStatus(`✅ Got ${count} notifications (${total} total) - Check console for details`);
      console.log('📋 Notification response:', notifications);
    } catch (error) {
      setStatus(`❌ Error fetching notifications: ${error.message}`);
    }
  };

  const handleDirectFetch = async () => {
    setStatus('Testing direct fetch (like test page)...');
    try {
      // Reset service first
      notificationService.resetToBackend();
      
      // Direct fetch like the test page does
      const response = await fetch('https://fagierrands-server.vercel.app/api/notifications/notifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Direct fetch response:', data);
        const count = data.results?.length || data.count || 0;
        setStatus(`🎯 DIRECT FETCH SUCCESS! Got ${count} notifications`);
      } else {
        setStatus(`❌ Direct fetch failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Direct fetch error: ${error.message}`);
    }
  };

  const handleForceRefresh = async () => {
    setStatus('Force refreshing notifications...');
    // Clear any cached state and force a fresh fetch
    notificationService.mockMode = false; // Reset mock mode
    try {
      const { fetchNotifications } = require('../contexts/NotificationContext');
      if (fetchNotifications) {
        await fetchNotifications();
        setStatus('✅ Force refresh completed');
      } else {
        setStatus('⚠️ Force refresh not available - try refreshing the page');
      }
    } catch (error) {
      setStatus(`❌ Force refresh failed: ${error.message}`);
    }
  };

  const handleDebugNotifications = async () => {
    setStatus('Getting debug information...');
    try {
      const response = await fetch('https://fagierrands-server.vercel.app/api/notifications/debug/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Debug data:', data);
        setStatus(`🔍 Debug: User ${data.current_user?.username} has ${data.notifications?.user_notifications || 0} notifications. Total in DB: ${data.notifications?.total_in_database || 0}`);
      } else {
        setStatus(`❌ Debug failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Debug error: ${error.message}`);
    }
  };

  const handleDebugAllNotifications = async () => {
    setStatus('Getting all notifications debug...');
    try {
      const response = await fetch('https://fagierrands-server.vercel.app/api/notifications/debug-all/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 All notifications debug:', data);
        setStatus(`🔍 Found ${data.total_notifications} total notifications. Current user: ${data.current_username} (ID: ${data.current_user_id})`);
      } else {
        setStatus(`❌ Debug all failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Debug all error: ${error.message}`);
    }
  };

  const handleTestFixedEndpoint = async () => {
    setStatus('Testing fixed notification endpoint...');
    try {
      const response = await fetch('https://fagierrands-server.vercel.app/api/notifications/notifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Fixed endpoint response:', data);
        setStatus(`🎯 FIXED! Got ${data.results?.length || data.count || 0} notifications from corrected endpoint`);
      } else {
        setStatus(`❌ Fixed endpoint test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Fixed endpoint error: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔔 Notification System Test</h3>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        border: '1px solid #dee2e6'
      }}>
        <strong>Backend Status:</strong> 
        <span style={{ 
          marginLeft: '10px',
          padding: '2px 8px',
          borderRadius: '3px',
          backgroundColor: notificationService.mockMode ? '#ffc107' : '#28a745',
          color: notificationService.mockMode ? 'black' : 'white',
          fontSize: '12px'
        }}>
          {notificationService.mockMode ? '🟡 MOCK MODE' : '🟢 CONNECTED'}
        </span>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          {notificationService.mockMode 
            ? 'Using mock data - deployed backend unavailable' 
            : 'Connected to deployed backend (fagierrands-server.vercel.app)'
          }
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          <strong>Auth Token:</strong> {localStorage.getItem('authToken') ? 
            `${localStorage.getItem('authToken').substring(0, 20)}...` : 
            '❌ No token found'
          }
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>VAPID Key Status:</strong> {
          notificationService.vapidPublicKey ? 
          `✅ Configured (${notificationService.vapidPublicKey.substring(0, 20)}...)` : 
          '❌ Not configured'
        }
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Permission Status:</strong> {Notification.permission}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Service Worker:</strong> {
          'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported'
        }
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleEnableNotifications}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Enable Notifications
        </button>
        
        <button 
          onClick={handleTestNotification}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Run Full Test
        </button>
        
        <button 
          onClick={handleQuickTest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Quick Test
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleBackendTest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Backend
        </button>
        
        <button 
          onClick={handleGetNotifications}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Get Notifications
        </button>
        
        <button 
          onClick={handleDirectFetch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e83e8c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Direct Fetch
        </button>
        
        <button 
          onClick={handleForceRefresh}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Force Refresh
        </button>
        
        <button 
          onClick={handleDebugNotifications}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Debug User
        </button>
        
        <button 
          onClick={handleDebugAllNotifications}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Debug All
        </button>
        
        <button 
          onClick={handleTestFixedEndpoint}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Fix
        </button>
      </div>

      {status && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Instructions:</h4>
        <ol>
          <li>Click "Enable Notifications" and allow permissions</li>
          <li>Click "Run Full Test" to verify all components</li>
          <li>Click "Quick Test" to see a sample notification</li>
          <li>Click "Test Backend" to check server connection</li>
          <li>Click "Get Notifications" to fetch from backend</li>
          <li>Check browser console for detailed logs</li>
        </ol>
        
        <h4>Deployed Backend Status:</h4>
        <ul>
          <li><strong>Working with:</strong> https://fagierrands-server.vercel.app</li>
          <li><strong>500 errors:</strong> Deployed backend may not have latest error handling</li>
          <li><strong>404 errors:</strong> New endpoints may not be deployed yet</li>
          <li><strong>Mock mode:</strong> System automatically falls back when backend unavailable</li>
          <li><strong>Force Refresh:</strong> Use to retry backend connection</li>
        </ul>
        
        <h4>Debug Tools:</h4>
        <ul>
          <li><strong>Debug User:</strong> Shows notifications for current user vs total in database</li>
          <li><strong>Debug All:</strong> Shows all notifications and which users they belong to</li>
          <li><strong>Check Console:</strong> Detailed debug info appears in browser console</li>
        </ul>
        
        <h4>Common Issues:</h4>
        <ul>
          <li><strong>0 notifications but admin shows data:</strong> User mismatch or authentication issue</li>
          <li><strong>Wrong user ID:</strong> Notifications created for different user</li>
          <li><strong>Authentication problems:</strong> Invalid or missing auth token</li>
          <li><strong>API endpoint mismatch:</strong> Frontend calling wrong URL (FIXED!)</li>
        </ul>
        
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <strong>🎯 ISSUES FOUND & FIXED:</strong><br/>
          ✅ Main endpoint: <code>/notifications/notifications/</code> (WORKING!)<br/>
          ✅ Unread count: <code>/notifications/unread-count/</code> (FIXED!)<br/>
          ✅ Mark as read actions: Updated to use correct DRF URLs<br/>
          <strong>Your notifications should now work completely!</strong>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;