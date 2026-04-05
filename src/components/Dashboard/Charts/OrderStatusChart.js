import React from 'react';
import './OrderStatusChart.css';

const OrderStatusChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate percentages and angles
  const chartData = data.map((item, index) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    return {
      ...item,
      percentage: percentage.toFixed(1),
      angle
    };
  });

  // Create donut chart segments
  const createDonutSegments = () => {
    const radius = 40;
    const centerX = 80;
    const centerY = 80;
    let currentAngle = 0;
    
    return chartData.map((item, index) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + item.angle;
      currentAngle = endAngle;
      
      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
      const endAngleRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = item.angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return (
        <path
          key={index}
          d={pathData}
          fill={item.color}
          className="donut-segment"
          style={{ '--hover-color': item.color }}
        />
      );
    });
  };

  return (
    <div className="order-status-chart">
      <div className="donut-container">
        <svg viewBox="0 0 160 160" className="donut-svg">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="40"
            fill="#f8f9fa"
            stroke="#f1f5f9"
            strokeWidth="2"
          />
          
          {/* Donut segments */}
          {createDonutSegments()}
          
          {/* Center circle */}
          <circle
            cx="80"
            cy="80"
            r="20"
            fill="white"
            stroke="#f1f5f9"
            strokeWidth="2"
          />
          
          {/* Center text */}
          <text x="80" y="75" textAnchor="middle" fontSize="12" fill="#1a202c" fontWeight="600">
            Total
          </text>
          <text x="80" y="90" textAnchor="middle" fontSize="16" fill="#667eea" fontWeight="700">
            {total}
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="status-legend">
        {chartData.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="legend-info">
              <span className="legend-label">{item.status}</span>
              <span className="legend-count">{item.count} ({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusChart;