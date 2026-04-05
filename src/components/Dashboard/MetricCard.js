import React from 'react';
import { FaCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './MetricCard.css';

const MetricCard = ({ 
  title, 
  value, 
  growth, 
  color = '#667eea', 
  compact = false,
  icon = null 
}) => {
  const formatGrowth = (growth) => {
    if (growth === undefined || growth === null) return '0.0%';
    return `${Math.abs(growth).toFixed(1)}%`;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return '#16a34a';
    if (growth < 0) return '#dc2626';
    return '#6b7280';
  };

  const getGrowthBgColor = (growth) => {
    if (growth > 0) return '#dcfce7';
    if (growth < 0) return '#fee2e2';
    return '#f3f4f6';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <FaArrowUp />;
    if (growth < 0) return <FaArrowDown />;
    return null;
  };

  return (
    <div className={`metric-card ${compact ? 'compact' : ''}`}>
      <div className="metric-header">
        <div className="metric-icon-container">
          <FaCircle 
            className="metric-icon" 
            style={{ color: color }}
          />
        </div>
        <div className="metric-info">
          <h4 className="metric-title">{title}</h4>
          {!compact && (
            <div className="metric-value" style={{ color: color }}>
              {value}
            </div>
          )}
        </div>
      </div>

      {compact && (
        <div className="metric-value compact" style={{ color: color }}>
          {value}
        </div>
      )}

      <div className="metric-growth">
        <div 
          className="growth-badge"
          style={{ 
            backgroundColor: getGrowthBgColor(growth),
            color: getGrowthColor(growth)
          }}
        >
          {getGrowthIcon(growth)}
          <span className="growth-text">
            {formatGrowth(growth)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;