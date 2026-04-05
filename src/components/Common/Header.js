import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// Commented out to prevent infinite login loops
// import { useNotifications } from '../../contexts/NotificationContext';
// import NotificationBadge from './NotificationBadge';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  // const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuRef]);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content" ref={mobileMenuRef}>
          <Link to="/" className="logo-container">
            <img src="/logo.svg" alt="Fagi Errands" className="logo" />
            <span className="logo-text">Fagi Errands</span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path 
                  d="M6 18L18 6M6 6L18 18" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              ) : (
                <path 
                  d="M4 6H20M4 12H20M4 18H20" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          
          {authLoading ? (
            <div className="loading-container">
              <div className="loading-circle"></div>
              <div className="loading-circle"></div>
            </div>
          ) : user ? (
            <div className={`user-controls ${isMobileMenuOpen ? 'expanded' : ''}`}>
              <div className="nav-links">
                <Link to="/referrals" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a4 4 0 118 0v7M5 8h14M5 8a4 4 0 110-8h14a4 4 0 110 8m-9 4v1m-4 0v1m8-1v1"></path>
                  </svg>
                  <span className="nav-text">Referrals</span>
                </Link>
                <Link to="/notifications" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  <span className="nav-text">Notifications</span>
                </Link>
                <Link to="/dashboard" className="nav-link mobile-only" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span className="nav-text">Dashboard</span>
                </Link>
                <Link to="/orders" className="nav-link mobile-only" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <span className="nav-text">My Orders</span>
                </Link>
                <Link to="/profile" className="nav-link mobile-only" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span className="nav-text">Profile Settings</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="nav-link mobile-only sign-out-nav"
                >
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span className="nav-text">Sign Out</span>
                </button>
              </div>
              
              <div className="user-menu-container desktop-only">
                <button 
                  onClick={toggleMenu}
                  className="user-menu-button"
                >
                  <div className="avatar-container">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt={user.user_metadata.full_name || user.email} 
                        className="avatar-image"
                      />
                    ) : (
                      <svg className="avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    )}
                  </div>
                </button>
                
                {isMenuOpen && (
                  <div className="dropdown-menu">
                    <div className="user-info">
                      <p className="user-name">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="menu-item">Dashboard</Link>
                    <Link to="/orders" className="menu-item">My Orders</Link>
                    <Link to="/referrals" className="menu-item">Referrals</Link>
                    <Link to="/profile" className="menu-item">Profile Settings</Link>
                    <button
                      onClick={handleSignOut}
                      className="sign-out-button"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`auth-controls ${isMobileMenuOpen ? 'expanded' : ''}`}>
              <Link to="/login" className="login-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="signup-button" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};



export default Header;