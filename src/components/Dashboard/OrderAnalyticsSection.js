import React from 'react';
import { FaShoppingCart, FaClock, FaCheckCircle, FaSpinner, FaTimes } from 'react-icons/fa';
import MetricCard from './MetricCard';
import OrderStatusChart from './Charts/OrderStatusChart';
import OrderVolumeChart from './Charts/OrderVolumeChart';
import OrderHeatmap from './Charts/OrderHeatmap';
import './OrderAnalyticsSection.css';

const OrderAnalyticsSection = ({ data, timeRange }) => {
  // Calculate order metrics
  const completionRate = ((data.completed_orders_last_30_days / data.total_orders) * 100) || 0;
  const pendingOrders = data.total_orders - data.completed_orders_last_30_days;
  const averageOrderValue = data.avg_order_value || 0;

  // Order metrics cards data
  const orderCards = [
    {
      title: 'Total Orders',
      value: (data.total_orders || 0).toLocaleString(),
      growth: 15.2,
      color: '#667eea'
    },
    {
      title: 'Completed Orders',
      value: (data.completed_orders_last_30_days || 0).toLocaleString(),
      growth: 22.8,
      color: '#10b981'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      growth: 5.4,
      color: '#06d6a0'
    },
    {
      title: 'Avg Order Value',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
      }).format(averageOrderValue),
      growth: 8.9,
      color: '#f59e0b'
    }
  ];

  // Order status breakdown
  const orderStatusData = [
    { status: 'Completed', count: data.completed_orders_last_30_days || 0, color: '#10b981' },
    { status: 'In Progress', count: Math.floor(pendingOrders * 0.6), color: '#667eea' },
    { status: 'Pending', count: Math.floor(pendingOrders * 0.3), color: '#f59e0b' },
    { status: 'Cancelled', count: Math.floor(pendingOrders * 0.1), color: '#ef4444' }
  ];

  return (
    <div className="order-analytics-section">
      <div className="section-header">
        <h2 className="section-title">Order Analytics</h2>
        <p className="section-subtitle">Comprehensive order tracking and analysis</p>
      </div>

      <div className="order-content">
        {/* Order Cards Row */}
        <div className="order-cards-row">
          {orderCards.map((card, index) => (
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
        <div className="order-charts-row">
          {/* Order Status Chart */}
          <div className="chart-container order-status">
            <div className="chart-header">
              <h3 className="chart-title">Order Status Distribution</h3>
              <p className="chart-subtitle">Current order statuses</p>
            </div>
            <OrderStatusChart 
              data={orderStatusData}
            />
          </div>

          {/* Order Volume Chart */}
          <div className="chart-container order-volume">
            <div className="chart-header">
              <h3 className="chart-title">Order Volume Trend</h3>
              <p className="chart-subtitle">Daily order volumes</p>
            </div>
            <OrderVolumeChart 
              data={data}
              timeRange={timeRange}
            />
          </div>
        </div>

        {/* Order Activity Heatmap */}
        <div className="chart-container order-heatmap">
          <div className="chart-header">
            <h3 className="chart-title">Order Activity Heatmap</h3>
            <p className="chart-subtitle">Order patterns by hour and day</p>
          </div>
          <OrderHeatmap />
        </div>

        {/* Order Summary Stats */}
        <div className="order-summary">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-header">
                <FaShoppingCart className="summary-icon" />
                <h4>Today's Orders</h4>
              </div>
              <div className="summary-value">
                {Math.floor((data.total_orders || 0) * 0.1)}
              </div>
              <div className="summary-trend positive">
                +12% from yesterday
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <FaClock className="summary-icon" />
                <h4>Avg Processing Time</h4>
              </div>
              <div className="summary-value">
                {Math.floor((data.avg_order_completion_time || 0) / 60)}m
              </div>
              <div className="summary-trend negative">
                -5% improvement
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <FaCheckCircle className="summary-icon" />
                <h4>Success Rate</h4>
              </div>
              <div className="summary-value">
                {completionRate.toFixed(1)}%
              </div>
              <div className="summary-trend positive">
                +3% this week
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <FaSpinner className="summary-icon" />
                <h4>Active Orders</h4>
              </div>
              <div className="summary-value">
                {Math.floor(pendingOrders * 0.6)}
              </div>
              <div className="summary-trend neutral">
                Stable
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalyticsSection;