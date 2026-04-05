import React from 'react';
import './UserRetentionHeatmap.css';

const UserRetentionHeatmap = () => {
  // Sample retention data
  const retentionData = [
    { week: 'Week 1', rate: 95, color: '#10b981' },
    { week: 'Week 2', rate: 87, color: '#84cc16' },
    { week: 'Week 3', rate: 72, color: '#eab308' },
    { week: 'Week 4', rate: 58, color: '#f97316' },
    { week: 'Week 5', rate: 41, color: '#ef4444' },
    { week: 'Week 6', rate: 35, color: '#8b5cf6' },
    { week: 'Week 7', rate: 28, color: '#06b6d4' }
  ];

  const getIntensityClass = (rate) => {
    if (rate >= 80) return 'intensity-high';
    if (rate >= 60) return 'intensity-medium-high';
    if (rate >= 40) return 'intensity-medium';
    if (rate >= 20) return 'intensity-low';
    return 'intensity-very-low';
  };

  return (
    <div className="user-retention-heatmap">
      <div className="heatmap-grid">
        {retentionData.map((item, index) => (
          <div
            key={index}
            className={`heatmap-cell ${getIntensityClass(item.rate)}`}
            style={{ backgroundColor: item.color }}
            title={`${item.week}: ${item.rate}% retention`}
          >
            <span className="cell-value">{item.rate}</span>
          </div>
        ))}
      </div>
      
      <div className="heatmap-legend">
        <div className="legend-section">
          <h4 className="legend-title">Cohort Retention Rates</h4>
          <div className="legend-items">
            {retentionData.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color-box"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-text">
                  {item.week}: {item.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="legend-section">
          <h5 className="legend-subtitle">Retention Scale</h5>
          <div className="scale-info">
            <div className="scale-item">
              <div className="scale-color intensity-high"></div>
              <span>Excellent (80%+)</span>
            </div>
            <div className="scale-item">
              <div className="scale-color intensity-medium-high"></div>
              <span>Good (60-79%)</span>
            </div>
            <div className="scale-item">
              <div className="scale-color intensity-medium"></div>
              <span>Average (40-59%)</span>
            </div>
            <div className="scale-item">
              <div className="scale-color intensity-low"></div>
              <span>Poor (20-39%)</span>
            </div>
            <div className="scale-item">
              <div className="scale-color intensity-very-low"></div>
              <span>Critical (&lt;20%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRetentionHeatmap;