import React from 'react';
import './RevenuePieChart.css';

const RevenuePieChart = ({ data }) => {
  const radius = 30;
  const centerX = 60;
  const centerY = 60;
  const circumference = 2 * Math.PI * radius;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate stroke-dasharray for each segment
  const calculateStrokeDashArray = (percentage) => {
    const segmentLength = (percentage / 100) * circumference;
    return `${segmentLength} ${circumference}`;
  };

  // Calculate stroke-dashoffset for positioning
  let cumulativePercentage = 0;
  const chartsData = data.map((item, index) => {
    const offset = -cumulativePercentage / 100 * circumference;
    cumulativePercentage += item.percentage;
    return {
      ...item,
      offset,
      strokeDashArray: calculateStrokeDashArray(item.percentage)
    };
  });

  return (
    <div className="revenue-pie-chart">
      <div className="pie-chart-container">
        <svg viewBox="0 0 120 120" className="pie-svg">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          
          {/* Data segments */}
          {chartsData.map((item, index) => (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="10"
              strokeDasharray={item.strokeDashArray}
              strokeDashoffset={item.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${centerX} ${centerY})`}
              className="pie-segment"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="pie-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div className="legend-row">
              <div className="legend-indicator">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-label">
                  {item.name}: {item.percentage}%
                </span>
              </div>
              <span className="legend-amount">
                {formatCurrency(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenuePieChart;