import React from 'react';
import { FaUsers, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import UserGrowthChart from './Charts/UserGrowthChart';
import UserActivityChart from './Charts/UserActivityChart';
import UserRetentionHeatmap from './Charts/UserRetentionHeatmap';
import MetricCard from './MetricCard';
import './UserMetricsSection.css';

const UserMetricsSection = ({ data, timeRange }) => {
  // User metrics cards data
  const userCards = [
    {
      title: 'Total Users',
      value: (data.total_users || 0).toLocaleString(),
      growth: data.user_growth_rate || 0,
      color: '#8b5cf6'
    },
    {
      title: 'New Users',
      value: (data.new_users_last_30_days || 0).toLocaleString(),
      growth: 18.7,
      color: '#06d6a0'
    },
    {
      title: 'Active Users',
      value: (data.active_users_last_30_days || 0).toLocaleString(),
      growth: 3.8,
      color: '#ef4444'
    }
  ];

  return (
    <div className="user-metrics-section">
      <div className="section-header">
        <h2 className="section-title">User Metrics</h2>
        <p className="section-subtitle">Monitor user engagement and growth patterns</p>
      </div>

      <div className="user-content">
        {/* User Cards Row */}
        <div className="user-cards-row">
          {userCards.map((card, index) => (
            <MetricCard
              key={index}
              title={card.title}
              value={card.value}
              growth={card.growth}
              color={card.color}
              compact={false}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="user-charts-row">
          {/* User Growth Chart */}
          <div className="chart-container user-growth">
            <div className="chart-header">
              <h3 className="chart-title">User Growth Chart</h3>
              <p className="chart-subtitle">Weekly user acquisition</p>
            </div>
            <UserGrowthChart 
              data={data} 
              timeRange={timeRange}
            />
          </div>

          {/* Daily Active Users */}
          <div className="chart-container user-activity">
            <div className="chart-header">
              <h3 className="chart-title">Daily Active Users</h3>
              <p className="chart-subtitle">7-day trend</p>
            </div>
            <UserActivityChart 
              data={data}
            />
          </div>
        </div>

        {/* User Retention Heatmap */}
        <div className="chart-container user-retention">
          <div className="chart-header">
            <h3 className="chart-title">User Retention Heatmap</h3>
            <p className="chart-subtitle">Cohort retention rates</p>
          </div>
          <UserRetentionHeatmap />
        </div>
      </div>
    </div>
  );
};

export default UserMetricsSection;