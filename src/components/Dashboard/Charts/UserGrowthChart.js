import React from 'react';
import './UserGrowthChart.css';

const UserGrowthChart = ({ data, timeRange }) => {
  // Generate sample data for weekly user growth
  const generateBarData = () => {
    const weeks = 7;
    const baseGrowth = (data.new_users_last_30_days || 50) / 4; // Weekly average
    const bars = [];
    
    for (let i = 0; i < weeks; i++) {
      const variation = Math.random() * 0.4 - 0.2; // ±20% variation
      const value = Math.max(10, baseGrowth * (1 + variation));
      const height = (value / (baseGrowth * 1.5)) * 60; // Scale to max 60px height
      
      bars.push({
        week: i + 1,
        value: Math.round(value),
        height: Math.max(10, height),
        x: 30 + (i * 50), // Spacing between bars
        color: '#667eea'
      });
    }
    
    return bars;
  };

  const barData = generateBarData();
  const maxValue = Math.max(...barData.map(b => b.value));

  return (
    <div className="user-growth-chart">
      <svg viewBox="0 0 400 100" className="bar-chart-svg">
        {/* Bars */}
        {barData.map((bar, index) => (
          <g key={index}>
            {/* Bar */}
            <rect
              x={bar.x}
              y={90 - bar.height}
              width="20"
              height={bar.height}
              fill={bar.color}
              rx="2"
              className="growth-bar"
            />
            
            {/* Week label */}
            <text
              x={bar.x + 10}
              y="98"
              textAnchor="middle"
              fontSize="10"
              fill="#718096"
              className="bar-label"
            >
              W{bar.week}
            </text>
            
            {/* Value label on hover */}
            <text
              x={bar.x + 10}
              y={90 - bar.height - 5}
              textAnchor="middle"
              fontSize="9"
              fill="#1a202c"
              className="bar-value"
              opacity="0"
            >
              {bar.value}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Chart Summary */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Weekly Avg</span>
          <span className="summary-value">
            {Math.round(barData.reduce((sum, bar) => sum + bar.value, 0) / barData.length)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Peak Week</span>
          <span className="summary-value">
            {maxValue}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthChart;