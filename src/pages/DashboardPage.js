import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClientDashboard from '../components/Dashboard/ClientDashboard';
import AssistantDashboard from '../components/Dashboard/AssistantDashboard';
import HandlerDashboard from '../components/Dashboard/HandlerDashboard';

const DashboardPage = () => {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Determine which dashboard to display based on user type
  const renderDashboard = () => {
    const userType = profile?.user_type || 'client';
    
    // Debug information
    console.log('DashboardPage - User Profile:', profile);
    console.log('DashboardPage - User Type:', userType);
    
    switch (userType) {
      case 'assistant':
        console.log('Rendering AssistantDashboard');
        return <AssistantDashboard />;
      case 'handler':
        console.log('Rendering HandlerDashboard');
        return <HandlerDashboard />;
      case 'client':
        console.log('Rendering ClientDashboard');
        return <ClientDashboard />;
      default:
        console.log('Rendering default ClientDashboard');
        return <ClientDashboard />;
    }
  };
  
  return renderDashboard();
};

export default DashboardPage;