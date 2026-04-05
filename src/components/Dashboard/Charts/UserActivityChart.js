import React from 'react';
import './UserActivityChart.css';

const UserActivityChart = ({ data }) => {
  // Generate sample data for daily active users
  const generateActivityData = () => {
    const days = 7;
    const baseActivity = (data.active_users_last_30_days || 100) / 30 * 7; // Weekly estimate
    const points = [];
    
    for (let i = 0; i < days; i++) {
      const variation = Math.random() * 0.3 - 0.15; // ±15% variation
      const value = Math.max(10, baseActivity * (1 + variation));
      
      points.push({
        day: i + 1,
        value: Math.round(value),
        x: 20 + (i * 40), // Scale across chart width
        y: 100 - (value / (baseActivity * 1.3)) * 60 // Scale to chart height
      });
    }
    
    return points;
  };

  const activityData = generateActivityData();
  
  // Create SVG path for the line
  const createPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const linePath = createPath(activityData);

  return (
    <div className="user-activity-chart">
      <svg viewBox="0 0 280 120" className="activity-svg">
        {/* Grid lines */}
        <line x1="20" y1="30" x2="260" y2="30" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="50" x2="260" y2="50" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="70" x2="260" y2="70" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="20" y1="90" x2="260" y2="90" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Chart line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#06d6a0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="activity-line"
          />
        )}
        
        {/* Data points with animation */}
        {activityData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#06d6a0"
            className="activity-point"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <animate
              attributeName="r" 
              values="3;5;3" 
              dur="2s" 
              repeatCount="indefinite"
              begin={`${index * 0.5}s`}
            />
          </circle>
        ))}
        
        {/* Day labels */}
        {activityData.map((point, index) => (
          <text
            key={`label-${index}`}
            x={point.x}
            y="115"
            textAnchor="middle"
            fontSize="10"
            fill="#718096"
            className="day-label"
          >
            D{point.day}
          </text>
        ))}
      </svg>
      
      {/* Activity Stats */}
      <div className="activity-stats">
        <div className="activity-stat">
          <span className="stat-label">Trend</span>
          <span className="stat-value trend-up">↗ +12%</span>
        </div>
        <div className="activity-stat">
          <span className="stat-label">Peak Day</span>
          <span className="stat-value">
            {Math.max(...activityData.map(p => p.value))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserActivityChart;