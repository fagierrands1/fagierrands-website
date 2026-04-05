import React from 'react';
import { FaArrowUp, FaCircle } from 'react-icons/fa';
import RevenueChart from './Charts/RevenueChart';
import RevenuePieChart from './Charts/RevenuePieChart';
import MetricCard from './MetricCard';
import './RevenueMetricsSection.css';

const RevenueMetricsSection = ({ data, timeRange }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate daily average revenue
  const calculateDailyAverage = () => {
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return (data.revenue_last_30_days || 0) / days;
  };

  // Revenue metrics cards data
  const revenueCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.total_revenue),
      growth: data.revenue_growth_rate || 0,
      icon: '#10b981',
      color: '#10b981'
    },
    {
      title: 'Daily Avg Revenue',
      value: formatCurrency(calculateDailyAverage()),
      growth: 8.2,
      icon: '#0ea5e9',
      color: '#0ea5e9'
    },
    {
      title: 'Growth Rate',
      value: `${(data.revenue_growth_rate || 0).toFixed(1)}%`,
      growth: 2.1,
      icon: '#f59e0b',
      color: '#f59e0b'
    }
  ];

  // Revenue breakdown data for pie chart
  const revenueBreakdown = [
    { name: 'Premium Service', percentage: 50, amount: data.total_revenue ? data.total_revenue * 0.5 : 0, color: '#667eea' },
    { name: 'Standard Service', percentage: 30, amount: data.total_revenue ? data.total_revenue * 0.3 : 0, color: '#10b981' },
    { name: 'Basic Service', percentage: 20, amount: data.total_revenue ? data.total_revenue * 0.2 : 0, color: '#f59e0b' }
  ];

  return (
    <div className="revenue-metrics-section">
      <div className="section-header">
        <h2 className="section-title">Revenue Metrics</h2>
        <p className="section-subtitle">Track your revenue performance and growth trends</p>
      </div>

      <div className="revenue-content">
        {/* Revenue Cards Row */}
        <div className="revenue-cards-row">
          {revenueCards.map((card, index) => (
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
        <div className="charts-row">
          {/* Revenue Trend Chart */}
          <div className="chart-container revenue-trend">
            <div className="chart-header">
              <h3 className="chart-title">Revenue Trend</h3>
              <p className="chart-subtitle">Last {timeRange} performance</p>
            </div>
            <RevenueChart 
              data={data} 
              timeRange={timeRange}
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="chart-container revenue-breakdown">
            <div className="chart-header">
              <h3 className="chart-title">Revenue by Service</h3>
            </div>
            <RevenuePieChart 
              data={revenueBreakdown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueMetricsSection;