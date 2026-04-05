import React from 'react';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';
import MetricCard from './MetricCard';
import PerformanceChart from './Charts/PerformanceChart';
import ResponseTimeChart from './Charts/ResponseTimeChart';
import './PerformanceMetricsSection.css';

const PerformanceMetricsSection = ({ data, timeRange }) => {
  // Format duration from seconds to readable format
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Performance metrics cards data
  const performanceCards = [
    {
      title: 'Avg Completion Time',
      value: formatDuration(data.avg_order_completion_time),
      growth: -5.2, // Negative is good for completion time
      color: '#06d6a0'
    },
    {
      title: 'Avg Response Time',
      value: formatDuration(data.avg_response_time),
      growth: -12.3, // Negative is good for response time
      color: '#667eea'
    },
    {
      title: 'Success Rate',
      value: `${((data.completed_orders_last_30_days / data.total_orders) * 100 || 0).toFixed(1)}%`,
      growth: 8.7,
      color: '#10b981'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      growth: 0.1,
      color: '#f59e0b'
    }
  ];

  // Performance data for charts
  const performanceData = {
    completionTimes: data.avg_order_completion_time || 0,
    responseTimes: data.avg_response_time || 0,
    successRate: (data.completed_orders_last_30_days / data.total_orders) * 100 || 0,
    uptime: 99.9
  };

  return (
    <div className="performance-metrics-section">
      <div className="section-header">
        <h2 className="section-title">Performance Metrics</h2>
        <p className="section-subtitle">Monitor system performance and efficiency</p>
      </div>

      <div className="performance-content">
        {/* Performance Cards Row */}
        <div className="performance-cards-row">
          {performanceCards.map((card, index) => (
            <MetricCard
              key={index}
              title={card.title}
              value={card.value}
              growth={card.growth}
              color={card.color}
              compact={false}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="performance-charts-row">
          {/* Performance Trend Chart */}
          <div className="chart-container performance-trend">
            <div className="chart-header">
              <h3 className="chart-title">Performance Trends</h3>
              <p className="chart-subtitle">System performance over time</p>
            </div>
            <PerformanceChart 
              data={performanceData} 
              timeRange={timeRange}
            />
          </div>

          {/* Response Time Distribution */}
          <div className="chart-container response-time">
            <div className="chart-header">
              <h3 className="chart-title">Response Time Distribution</h3>
              <p className="chart-subtitle">Response time patterns</p>
            </div>
            <ResponseTimeChart 
              data={performanceData}
            />
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="performance-indicators">
          <div className="indicator-card">
            <div className="indicator-header">
              <FaCheckCircle className="indicator-icon success" />
              <h4>System Health</h4>
            </div>
            <div className="indicator-status">
              <span className="status-badge healthy">Healthy</span>
              <span className="status-text">All systems operational</span>
            </div>
          </div>

          <div className="indicator-card">
            <div className="indicator-header">
              <FaChartBar className="indicator-icon info" />
              <h4>Load Average</h4>
            </div>
            <div className="indicator-status">
              <span className="status-badge normal">Normal</span>
              <span className="status-text">CPU: 45%, Memory: 62%</span>
            </div>
          </div>

          <div className="indicator-card">
            <div className="indicator-header">
              <FaExclamationTriangle className="indicator-icon warning" />
              <h4>Alerts</h4>
            </div>
            <div className="indicator-status">
              <span className="status-badge warning">2 Active</span>
              <span className="status-text">Minor performance issues</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsSection;