import React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

// Test component with sample data
const AnalyticsDashboardTest = () => {
  // Sample data that matches your backend structure
  const sampleData = {
    total_users: 11,
    total_orders: 22,
    total_revenue: 461.00,
    new_users_last_30_days: 5,
    active_users_last_30_days: 8,
    completed_orders_last_30_days: 4,
    revenue_last_30_days: 461.00,
    revenue_growth_rate: 15.3,
    user_growth_rate: 5.2,
    avg_order_value: 153.67,
    nps_score: 0,
    avg_rating: 0,
    avg_order_completion_time: 7200, // 2 hours in seconds
    avg_response_time: 900, // 15 minutes in seconds
    
    // Additional analytics data
    pending_orders: 8,
    cancelled_orders: 2,
    online_assistants: 3,
    system_uptime: 99.9,
    peak_hours: ['12PM', '6PM'],
    busiest_day: 'Wednesday',
    completion_rate: 85.5,
    customer_satisfaction: 4.2,
    repeat_customers: 65,
    
    // Time-series data
    daily_orders: [3, 5, 2, 8, 4, 6, 3, 7, 5, 4, 6, 8, 2, 5],
    hourly_activity: [12, 8, 15, 22, 18, 25, 20, 16, 14, 10, 8, 12],
    
    // Performance metrics
    server_response_time: 850, // milliseconds
    database_queries_per_sec: 45,
    cache_hit_rate: 92.5,
    error_rate: 0.02
  };

  return (
    <div style={{ backgroundColor: '#f1f3f4', minHeight: '100vh' }}>
      <AnalyticsDashboard data={sampleData} />
    </div>
  );
};

export default AnalyticsDashboardTest;