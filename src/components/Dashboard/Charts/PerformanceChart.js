import React from 'react';
import './PerformanceChart.css';

const PerformanceChart = ({ data, timeRange }) => {
  // Generate performance data points
  const generatePerfData = () => {
    const points = [];
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    const basePerf = 95; // Base performance percentage
    
    for (let i = 0; i < Math.min(days, 14); i++) {
      const variation = Math.random() * 10 - 5; // ±5% variation
      const performance = Math.max(75, Math.min(100, basePerf + variation));
      
      points.push({
        day: i + 1,
        performance: performance,
        x: 20 + (i * (280 / Math.min(days, 13))),
        y: 120 - (performance / 100) * 80
      });
    }
    
    return points;
  };

  const perfData = generatePerfData();
  
  // Create SVG path
  const createPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const cpy1 = prevPoint.y;
      const cpx2 = currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      const cpy2 = currentPoint.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${currentPoint.x} ${currentPoint.y}`;
    }
    return path;
  };

  const linePath = createPath(perfData);

  return (
    <div className="performance-chart">
      <svg viewBox="0 0 320 140" className="perf-chart-svg">
        {/* Grid lines */}
        <defs>
          <linearGradient id="perfGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06d6a0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06d6a0" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <line x1="20" y1="40" x2="300" y2="40" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Performance line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#06d6a0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points */}
        {perfData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#06d6a0"
            stroke="white"
            strokeWidth="2"
            className="perf-point"
          />
        ))}
        
        {/* Y-axis labels */}
        <text x="12" y="45" fontSize="10" fill="#718096" textAnchor="end">100%</text>
        <text x="12" y="65" fontSize="10" fill="#718096" textAnchor="end">90%</text>
        <text x="12" y="85" fontSize="10" fill="#718096" textAnchor="end">80%</text>
        <text x="12" y="105" fontSize="10" fill="#718096" textAnchor="end">70%</text>
      </svg>
      
      {/* Performance Stats */}
      <div className="perf-stats">
        <div className="perf-stat">
          <span className="stat-label">Current</span>
          <span className="stat-value">
            {perfData.length > 0 ? perfData[perfData.length - 1].performance.toFixed(1) : '95.0'}%
          </span>
        </div>
        <div className="perf-stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">
            {(perfData.reduce((sum, p) => sum + p.performance, 0) / perfData.length).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;