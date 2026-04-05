import React from 'react';
import { 
  FaPlus, 
  FaFileExport, 
  FaCog, 
  FaSync, 
  FaUsers, 
  FaShoppingCart,
  FaChartLine,
  FaPrint,
  FaEnvelope,
  FaCalendar
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './QuickActionsWidget.css';

const QuickActionsWidget = ({ data }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 1,
      title: 'New Order',
      icon: FaPlus,
      color: '#10b981',
      action: () => navigate('/orders/create'),
      description: 'Create a new order'
    },
    {
      id: 2,
      title: 'Export Data',
      icon: FaFileExport,
      color: '#667eea',
      action: () => handleExport(),
      description: 'Download analytics report'
    },
    {
      id: 3,
      title: 'View Orders',
      icon: FaShoppingCart,
      color: '#06d6a0',
      action: () => navigate('/orders'),
      description: 'Order management'
    },
    {
      id: 4,
      title: 'Reports',
      icon: FaChartLine,
      color: '#8b5cf6',
      action: () => navigate('/reports'),
      description: 'Generate reports'
    }
  ];

  const handleExport = () => {
    // Create CSV data from analytics
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', data.total_users || 0],
      ['Total Orders', data.total_orders || 0],
      ['Total Revenue', data.total_revenue || 0],
      ['Active Users', data.active_users_last_30_days || 0],
      ['Completed Orders', data.completed_orders_last_30_days || 0],
      ['Revenue Growth', `${data.revenue_growth_rate || 0}%`],
      ['User Growth', `${data.user_growth_rate || 0}%`],
      ['Avg Order Value', data.avg_order_value || 0],
      ['Avg Response Time', `${Math.round((data.avg_response_time || 0) / 60)} minutes`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefreshData = () => {
    window.location.reload();
  };

  return (
    <div className="quick-actions-widget">
      <div className="widget-header">
        <h3 className="widget-title">Quick Actions</h3>
        <button 
          className="refresh-btn"
          onClick={handleRefreshData}
          title="Refresh data"
        >
          <FaSync />
        </button>
      </div>

      <div className="actions-grid">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <button
              key={action.id}
              className="action-item"
              onClick={action.action}
              title={action.description}
            >
              <div 
                className="action-icon-wrapper"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <IconComponent 
                  className="action-icon"
                  style={{ color: action.color }}
                />
              </div>
              <span className="action-title">{action.title}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-summary">
        <div className="stat-row">
          <FaCalendar className="stat-icon" />
          <div className="stat-info">
            <span className="stat-label">Last Updated</span>
            <span className="stat-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;