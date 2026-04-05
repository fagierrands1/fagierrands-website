import React from 'react';
import './ResponseTimeChart.css';

const ResponseTimeChart = ({ data }) => {
  // Generate response time distribution data
  const responseTimeRanges = [
    { range: '0-5s', count: 45, color: '#10b981' },
    { range: '5-10s', count: 32, color: '#06d6a0' },
    { range: '10-20s', count: 18, color: '#f59e0b' },
    { range: '20-30s', count: 8, color: '#ef4444' },
    { range: '30s+', count: 3, color: '#8b5cf6' }
  ];

  const maxCount = Math.max(...responseTimeRanges.map(r => r.count));

  return (
    <div className="response-time-chart">
      <div className="chart-bars">
        {responseTimeRanges.map((range, index) => (
          <div key={index} className="bar-container">
            <div 
              className="response-bar"
              style={{
                height: `${(range.count / maxCount) * 100}%`,
                backgroundColor: range.color
              }}
            >
              <span className="bar-value">{range.count}</span>
            </div>
            <span className="bar-label">{range.range}</span>
          </div>
        ))}
      </div>
      
      <div className="response-summary">
        <div className="summary-item">
          <span className="summary-label">Fastest</span>
          <span className="summary-value">2.1s</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Average</span>
          <span className="summary-value">
            {Math.round((data.responseTimes || 900) / 60)}m
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">95th %ile</span>
          <span className="summary-value">18.2s</span>
        </div>
      </div>
    </div>
  );
};

export default ResponseTimeChart;