import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { getApiBaseUrl, getApiServerUrl } from '../../utils/environment';

const ApiDebugger = () => {
  const [apiInfo, setApiInfo] = useState({
    baseUrl: config.API_BASE_URL,
    serverUrl: getApiServerUrl(),
    apiBaseUrl: getApiBaseUrl(),
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  });
  
  const [testResults, setTestResults] = useState({
    rootEndpoint: { status: 'pending', message: 'Not tested' },
    dashboardEndpoint: { status: 'pending', message: 'Not tested' },
    dashboardWithApiEndpoint: { status: 'pending', message: 'Not tested' },
    dashboardWithoutSlashEndpoint: { status: 'pending', message: 'Not tested' }
  });
  
  const testEndpoint = async (url, name) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [name]: { status: 'testing', message: 'Testing...' }
      }));
      
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(url, { 
        headers,
        timeout: 10000,
        validateStatus: status => true // Accept any status code
      });
      
      setTestResults(prev => ({
        ...prev,
        [name]: { 
          status: response.status < 400 ? 'success' : 'error',
          message: `Status: ${response.status}`,
          data: response.data,
          headers: response.headers
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [name]: { 
          status: 'error', 
          message: error.message,
          error: error
        }
      }));
    }
  };
  
  const runAllTests = () => {
    // Test root endpoint
    testEndpoint(getApiServerUrl(), 'rootEndpoint');
    
    // Test dashboard endpoint with different variations
    testEndpoint(`${getApiServerUrl()}/api/dashboard/overview/`, 'dashboardWithApiEndpoint');
    testEndpoint(`${getApiServerUrl()}/dashboard/overview/`, 'dashboardEndpoint');
    testEndpoint(`${getApiServerUrl()}/api/dashboard/overview`, 'dashboardWithoutSlashEndpoint');
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'testing': return '#2196f3';
      default: return '#9e9e9e';
    }
  };
  
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
      <h3>API Configuration Debugger</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>API Configuration</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>config.API_BASE_URL</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{apiInfo.baseUrl}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>getApiServerUrl()</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{apiInfo.serverUrl}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>getApiBaseUrl()</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{apiInfo.apiBaseUrl}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Environment</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{apiInfo.isLocal ? 'Local Development' : 'Production'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Current URL</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{window.location.href}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <button 
        onClick={runAllTests}
        style={{ 
          padding: '10px 15px', 
          background: '#2196f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Test API Endpoints
      </button>
      
      <div>
        <h4>Test Results</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Endpoint</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{apiInfo.serverUrl}</td>
              <td style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                color: getStatusColor(testResults.rootEndpoint.status),
                fontWeight: 'bold'
              }}>
                {testResults.rootEndpoint.status.toUpperCase()}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{testResults.rootEndpoint.message}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${apiInfo.serverUrl}/api/dashboard/overview/`}</td>
              <td style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                color: getStatusColor(testResults.dashboardWithApiEndpoint.status),
                fontWeight: 'bold'
              }}>
                {testResults.dashboardWithApiEndpoint.status.toUpperCase()}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{testResults.dashboardWithApiEndpoint.message}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${apiInfo.serverUrl}/dashboard/overview/`}</td>
              <td style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                color: getStatusColor(testResults.dashboardEndpoint.status),
                fontWeight: 'bold'
              }}>
                {testResults.dashboardEndpoint.status.toUpperCase()}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{testResults.dashboardEndpoint.message}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${apiInfo.serverUrl}/api/dashboard/overview`}</td>
              <td style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                color: getStatusColor(testResults.dashboardWithoutSlashEndpoint.status),
                fontWeight: 'bold'
              }}>
                {testResults.dashboardWithoutSlashEndpoint.status.toUpperCase()}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{testResults.dashboardWithoutSlashEndpoint.message}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Recommendations</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Make sure all API requests use the correct base URL</li>
          <li>Check that the backend has the correct URL patterns configured</li>
          <li>Ensure that axios is configured with the correct baseURL</li>
          <li>Verify that the API endpoints are accessible from your current environment</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiDebugger;