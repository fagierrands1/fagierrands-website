import React from 'react';
import './OrderVolumeChart.css';

const OrderVolumeChart = ({ data, timeRange }) => {
  // Generate order volume data
  const generateVolumeData = () => {
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    const points = [];
    const baseVolume = (data.total_orders || 22) / 30; // Daily average
    
    for (let i = 0; i < Math.min(days, 14); i++) {
      const variation = Math.random() * 0.6 - 0.3; // ±30% variation
      const volume = Math.max(1, Math.round(baseVolume * (1 + variation)));
      
      points.push({
        day: i + 1,
        volume: volume,
        x: 20 + (i * (260 / Math.min(days, 13))),
        y: 100 - (volume / (baseVolume * 1.5)) * 60
      });
    }
    
    return points;
  };

  const volumeData = generateVolumeData();
  
  // Create area path for the chart
  const createAreaPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} 100`; // Start at bottom
    path += ` L ${points[0].x} ${points[0].y}`; // Go to first point
    
    // Create smooth curve through points
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const cpy1 = prevPoint.y;
      const cpx2 = currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      const cpy2 = currentPoint.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${currentPoint.x} ${currentPoint.y}`;
    }
    
    path += ` L ${points[points.length - 1].x} 100`; // Go to bottom
    path += ' Z'; // Close path
    return path;
  };

  // Create line path
  const createLinePath = (points) => {
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

  const areaPath = createAreaPath(volumeData);
  const linePath = createLinePath(volumeData);

  return (
    <div className="order-volume-chart">
      <svg viewBox="0 0 300 120" className="volume-chart-svg">
        {/* Grid lines */}
        <defs>
          <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <line x1="20" y1="25" x2="280" y2="25" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="75" x2="280" y2="75" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#volumeGradient)"
          />
        )}
        
        {/* Volume line */}
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
        {volumeData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#667eea"
            stroke="white"
            strokeWidth="2"
            className="volume-point"
          />
        ))}
      </svg>
      
      {/* Volume Stats */}
      <div className="volume-stats">
        <div className="volume-stat">
          <span className="stat-label">Peak</span>
          <span className="stat-value">
            {Math.max(...volumeData.map(p => p.volume))}
          </span>
        </div>
        <div className="volume-stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">
            {Math.round(volumeData.reduce((sum, p) => sum + p.volume, 0) / volumeData.length)}
          </span>
        </div>
        <div className="volume-stat">
          <span className="stat-label">Total</span>
          <span className="stat-value">
            {volumeData.reduce((sum, p) => sum + p.volume, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderVolumeChart;