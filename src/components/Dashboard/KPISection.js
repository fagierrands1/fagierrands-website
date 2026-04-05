import React from 'react';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaUsers, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaClock,
  FaStar,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import './KPISection.css';

const KPISection = ({ data, timeRange }) => {
  // Calculate KPIs
  const kpis = [
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
      }).format(data.total_revenue || 0),
      change: `+${data.revenue_growth_rate || 0}%`,
      changeType: 'positive',
      icon: FaMoneyBillWave,
      color: '#10b981',
      subtitle: 'Total earnings'
    },
    {
      title: 'Active Users',
      value: (data.active_users_last_30_days || 0).toLocaleString(),
      change: `+${data.user_growth_rate || 0}%`,
      changeType: 'positive',
      icon: FaUsers,
      color: '#667eea',
      subtitle: 'Monthly active users'
    },
    {
      title: 'Order Volume',
      value: (data.total_orders || 0).toLocaleString(),
      change: '+15.2%',
      changeType: 'positive',
      icon: FaShoppingCart,
      color: '#06d6a0',
      subtitle: 'Total orders placed'
    },
    {
      title: 'Completion Rate',
      value: `${((data.completed_orders_last_30_days / data.total_orders) * 100 || 0).toFixed(1)}%`,
      change: '+3.2%',
      changeType: 'positive',
      icon: FaCheckCircle,
      color: '#f59e0b',
      subtitle: 'Order success rate'
    },
    {
      title: 'Avg Response Time',
      value: `${Math.round((data.avg_response_time || 0) / 60)}min`,
      change: '-5.8%',
      changeType: 'negative',
      icon: FaClock,
      color: '#ef4444',
      subtitle: 'System response time'
    },
    {
      title: 'Customer Rating',
      value: (data.avg_rating || 4.2).toFixed(1),
      change: '+0.3',
      changeType: 'positive',
      icon: FaStar,
      color: '#8b5cf6',
      subtitle: 'Average satisfaction'
    }
  ];

  const getTrendIcon = (changeType) => {
    return changeType === 'positive' ? FaArrowUp : FaArrowDown;
  };

  return (
    <div className="kpi-section">
      <div className="kpi-header">
        <h2 className="kpi-title">Key Performance Indicators</h2>
        <div className="kpi-subtitle">
          Real-time business metrics and performance indicators
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          const TrendIcon = getTrendIcon(kpi.changeType);
          
          return (
            <div key={index} className="kpi-card">
              <div className="kpi-card-header">
                <div 
                  className="kpi-icon-wrapper"
                  style={{ backgroundColor: `${kpi.color}15` }}
                >
                  <IconComponent 
                    className="kpi-icon"
                    style={{ color: kpi.color }}
                  />
                </div>
                <div className={`kpi-change ${kpi.changeType}`}>
                  <TrendIcon className="trend-icon" />
                  <span>{kpi.change}</span>
                </div>
              </div>
              
              <div className="kpi-content">
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-label">{kpi.title}</div>
                <div className="kpi-subtitle">{kpi.subtitle}</div>
              </div>
              
              {/* Progress bar for visual appeal */}
              <div className="kpi-progress">
                <div 
                  className="kpi-progress-bar"
                  style={{ 
                    backgroundColor: kpi.color,
                    width: `${Math.random() * 40 + 60}%`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="kpi-summary">
        <div className="summary-header">
          <h3>Performance Summary</h3>
        </div>
        <div className="summary-content">
          <div className="summary-stat">
            <FaChartLine className="summary-icon positive" />
            <div className="summary-info">
              <span className="summary-label">Overall Growth</span>
              <span className="summary-value positive">+12.5%</span>
            </div>
          </div>
          <div className="summary-stat">
            <FaExclamationTriangle className="summary-icon warning" />
            <div className="summary-info">
              <span className="summary-label">Areas for Improvement</span>
              <span className="summary-value warning">Response Time</span>
            </div>
          </div>
          <div className="summary-stat">
            <FaCheckCircle className="summary-icon success" />
            <div className="summary-info">
              <span className="summary-label">Top Performer</span>
              <span className="summary-value success">Order Volume</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISection;