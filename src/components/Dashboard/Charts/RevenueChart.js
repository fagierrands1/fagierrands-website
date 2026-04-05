import React from 'react';
import './RevenueChart.css';

const RevenueChart = ({ data, timeRange }) => {
  // Generate sample data points for the chart
  const generateChartData = () => {
    const points = [];
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    const baseRevenue = data.total_revenue || 1000;
    const dailyAvg = baseRevenue / days;
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      // Create some variation in the data
      const variation = Math.random() * 0.3 - 0.15; // ±15% variation
      const value = dailyAvg * (1 + variation);
      points.push({
        day: i + 1,
        value: Math.max(0, value),
        x: 20 + (i * (460 / Math.min(days, 29))), // Scale to chart width
        y: 180 - (value / (dailyAvg * 1.5)) * 100 // Scale to chart height
      });
    }
    return points;
  };

  const chartData = generateChartData();
  
  // Create SVG path for the line
  const createPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Create area path for gradient fill
  const createAreaPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} 180`; // Start at bottom
    path += ` L ${points[0].x} ${points[0].y}`; // Go to first point
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    path += ` L ${points[points.length - 1].x} 180`; // Go to bottom
    path += ' Z'; // Close path
    return path;
  };

  const linePath = createPath(chartData);
  const areaPath = createAreaPath(chartData);

  return (
    <div className="revenue-chart">
      <svg viewBox="0 0 500 200" className="chart-svg">
        {/* Grid lines */}
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        <line x1="20" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#revenueGradient)"
            opacity="0.3"
          />
        )}
        
        {/* Chart line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#667eea"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points */}
        {chartData.map((point, index) => (
          <g key={index}>
            {(index === 0 || index === chartData.length - 1) && (
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#667eea"
                stroke="white"
                strokeWidth="2"
                className="chart-point"
              />
            )}
          </g>
        ))}
      </svg>
      
      {/* Chart Info */}
      <div className="chart-info">
        <div className="chart-stats">
          <div className="stat">
            <span className="stat-label">Highest</span>
            <span className="stat-value">
              {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0
              }).format(Math.max(...chartData.map(p => p.value)))}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Average</span>
            <span className="stat-value">
              {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0
              }).format(chartData.reduce((sum, p) => sum + p.value, 0) / chartData.length)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;