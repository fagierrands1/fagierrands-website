import React from 'react';
import './OrderHeatmap.css';

const OrderHeatmap = () => {
  // Days of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Hours (showing only key hours)
  const hours = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
  
  // Generate sample heatmap data
  const generateHeatmapData = () => {
    const data = [];
    
    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        // Generate realistic order patterns
        let intensity = Math.random();
        
        // Higher activity during business hours
        if (hourIndex >= 1 && hourIndex <= 4) {
          intensity = Math.min(1, intensity + 0.4);
        }
        
        // Higher activity during weekdays
        if (dayIndex < 5) {
          intensity = Math.min(1, intensity + 0.2);
        }
        
        // Peak during lunch and evening
        if (hourIndex === 2 || hourIndex === 4) {
          intensity = Math.min(1, intensity + 0.3);
        }
        
        data.push({
          day,
          hour,
          dayIndex,
          hourIndex,
          intensity,
          orders: Math.floor(intensity * 50)
        });
      });
    });
    
    return data;
  };
  
  const heatmapData = generateHeatmapData();
  
  // Get intensity class for styling
  const getIntensityClass = (intensity) => {
    if (intensity >= 0.8) return 'heat-very-high';
    if (intensity >= 0.6) return 'heat-high';
    if (intensity >= 0.4) return 'heat-medium';
    if (intensity >= 0.2) return 'heat-low';
    return 'heat-very-low';
  };

  return (
    <div className="order-heatmap">
      <div className="heatmap-container">
        {/* Hour labels */}
        <div className="hour-labels">
          <div className="label-spacer"></div>
          {hours.map((hour, index) => (
            <div key={index} className="hour-label">{hour}</div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="heatmap-grid">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="heatmap-row">
              <div className="day-label">{day}</div>
              {hours.map((hour, hourIndex) => {
                const cell = heatmapData.find(
                  d => d.dayIndex === dayIndex && d.hourIndex === hourIndex
                );
                return (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className={`heatmap-cell ${getIntensityClass(cell.intensity)}`}
                    title={`${day} ${hour}: ${cell.orders} orders`}
                  >
                    <span className="cell-orders">{cell.orders}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Heatmap Legend */}
      <div className="heatmap-legend">
        <h4 className="legend-title">Order Volume</h4>
        <div className="legend-scale">
          <span className="scale-label">Low</span>
          <div className="scale-colors">
            <div className="scale-color heat-very-low"></div>
            <div className="scale-color heat-low"></div>
            <div className="scale-color heat-medium"></div>
            <div className="scale-color heat-high"></div>
            <div className="scale-color heat-very-high"></div>
          </div>
          <span className="scale-label">High</span>
        </div>
        
        <div className="legend-stats">
          <div className="stat-item">
            <span className="stat-label">Peak Hour</span>
            <span className="stat-value">12PM - 1PM</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Peak Day</span>
            <span className="stat-value">Wednesday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHeatmap;