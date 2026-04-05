import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToastContainer } from './components/Common/NotificationToast';
import { requestNotificationPermission } from './utils/notificationUtils';
import AdminDashboardPage from './pages/AdminDashboardPage';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import FeaturesPage from './pages/FeaturesPage';
import GetStartedPage from './pages/GetStartedPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import AssistantDashboard from './components/Dashboard/AssistantDashboard';
import HandlerDashboard from './components/Dashboard/HandlerDashboard';
import NotificationsPage from './pages/NotificationsPage';
import OrdersPage from './pages/OrdersPage';
import Shop from './components/Services/Shop';
import PickupDelivery from './components/Services/PickupDelivery';
import CargoDelivery from './components/Services/CargoDelivery';
import Banking from './components/Services/Banking';
import Handyman from './components/Services/Handyman';
import OrderDetails from './components/Orders/OrdersDetails';
import OrdersDetailPage from './pages/OrdersDetailPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderReportIssuePage from './pages/OrderReportIssuePage';
import OrderReviewPage from './pages/OrderReviewPage';
import AssistantVerificationPage from './pages/AssistantVerificationPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallback from './components/Auth/AuthCallback';
import OTPVerification from './components/Auth/OTPVerification';
import NotificationTest from './components/Test/NotificationTest';
import AssistantProfilePage from './pages/AssistantProfilePage';
import ReferralsPage from './pages/ReferralsPage';
import CreateOrder from './components/Orders/CreateOrder';
import PaymentPage from './pages/PaymentPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import HandymanFinalPaymentPage from './pages/HandymanFinalPaymentPage';
import GeofenceDemo from './pages/GeofenceDemo';
import CommissionDemo from './pages/CommissionDemo';
import AllTasksCommissionDemo from './pages/AllTasksCommissionDemo';
import PriceCalculationTestSuite from './tests/InteractivePriceCalculatorTest';
import GoogleMapDemo from './pages/GoogleMapDemo';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Redirect to the appropriate dashboard based on user type
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Redirect based on user type
  const userType = user.user_type || 'client';
  
  // Debug information
  console.log('DashboardRedirect - User:', user);
  console.log('DashboardRedirect - User Type:', userType);
  
  switch (userType) {
    case 'assistant':
      console.log('Redirecting to assistant dashboard');
      return <Navigate to="/assistant/dashboard" />;
    case 'handler':
      console.log('Redirecting to handler dashboard');
      return <Navigate to="/handler/dashboard" />;
    case 'admin':
      console.log('Redirecting to admin dashboard');
      return <Navigate to="/admin/dashboard" />;
    default:
      console.log('Redirecting to client dashboard');
      return <Navigate to="/client/dashboard" />;
  }
};

// Redirect to external URL paths like /privacy-policy
const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <LocationProvider>
            <WebSocketProvider>
              <NotificationToastContainer />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
                <Route path="/assistant/dashboard" element={<ProtectedRoute><AssistantDashboard /></ProtectedRoute>} />
                <Route path="/handler/dashboard" element={<ProtectedRoute><HandlerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/my-orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrdersDetailPage /></ProtectedRoute>} />
                <Route path="/orders/:id/tracking" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/orders/:id/track" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/order-tracking/:id" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/orders/:id/report-issue" element={<ProtectedRoute><OrderReportIssuePage /></ProtectedRoute>} />
                <Route path="/report-issue/:id" element={<ProtectedRoute><OrderReportIssuePage /></ProtectedRoute>} />
                <Route path="/orders/:id/review" element={<ProtectedRoute><OrderReviewPage /></ProtectedRoute>} />
                <Route path="/create-order/:service" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
                <Route path="/verify-assistant" element={<ProtectedRoute><AssistantVerificationPage /></ProtectedRoute>} />
                <Route path="/assistants/:id" element={<ProtectedRoute><AssistantProfilePage /></ProtectedRoute>} />
                <Route path="/referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/pickup-delivery" element={<ProtectedRoute><PickupDelivery /></ProtectedRoute>} />
                <Route path="/cargo-delivery" element={<ProtectedRoute><CargoDelivery /></ProtectedRoute>} />
                <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/handyman" element={<ProtectedRoute><Handyman /></ProtectedRoute>} />
                <Route path="/home-maintenance" element={<ProtectedRoute><Handyman /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/payment/:paymentId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/verify-email/:token" element={<AuthCallback />} />
                <Route path="/test-otp" element={<OTPVerification />} />
                <Route path="/handyman-payment/:orderId" element={<ProtectedRoute><HandymanFinalPaymentPage /></ProtectedRoute>} />
                <Route path="/test-notifications" element={<NotificationTest />} />
                <Route path="/geofence-demo" element={<ProtectedRoute><GeofenceDemo /></ProtectedRoute>} />
                <Route path="/commission-demo" element={<ProtectedRoute><CommissionDemo /></ProtectedRoute>} />
                <Route path="/all-tasks-commission-demo" element={<ProtectedRoute><AllTasksCommissionDemo /></ProtectedRoute>} />
                <Route path="/price-calculation-tests" element={<ProtectedRoute><PriceCalculationTestSuite /></ProtectedRoute>} />
                <Route path="/map-demo" element={<GoogleMapDemo />} />
                {/* Legal pages */}
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              </Routes>
           
            </WebSocketProvider>
          </LocationProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;