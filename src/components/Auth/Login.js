// src/components/Auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, user, loading: authLoading } = useAuth();
  
  // Prevent redirect loop - if user is already authenticated and not coming from a redirect, 
  // don't automatically redirect (let them stay on login page if they want to switch accounts)
  useEffect(() => {
    // Only redirect if user is authenticated AND we're not in the middle of a login attempt
    // AND there's no error state
    if (!authLoading && user && !loading && !error && location.pathname === '/login') {
      // Check if there's a redirect parameter or if user just logged in
      const urlParams = new URLSearchParams(location.search);
      const fromParam = urlParams.get('from');
      
      // Only auto-redirect if explicitly coming from a protected route
      if (fromParam === 'protected') {
        navigate('/dashboard', { replace: true });
      }
      // Otherwise, let user stay on login page (they might want to switch accounts)
    }
  }, [user, authLoading, loading, error, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, logout to clear any existing authentication data
      await logout();
      
      // Clear localStorage manually to ensure all auth data is removed
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userType');
      localStorage.removeItem('normalizedUserType');
      localStorage.removeItem('profileData');
      localStorage.removeItem('userId');
      
      // Use the login function from AuthContext
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate to dashboard using React Router
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header>
        <div className="header-container">
          <div className="logo-container">
            <div className="logo">
              <img src={Logo} alt="Fagi Errands Logo" />
            </div>
            <h1>Fagi Errands</h1>
          </div>
          <div className="nav-links">
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/contact" className="contact-button">Contact Us</Link>
          </div>
        </div>
      </header>
      
      <div className="form-container">
        <h2>Login to Your Account</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="input-field"
            />
          </div>
          
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input-field"
            />
          </div>
          
          <div className="remember-forgot-container">
            <div className="remember-me">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>
          
          <div className="signup-prompt">
            <span>Not registered yet?</span>
            <Link to="/signup" className="signup-link">Create an account</Link>
          </div>
          
          <div className="login-button-container">
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo-container {
          display: flex;
          align-items: center;
        }
        
        .logo {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }
        
        .logo img {
          width: 100%;
          height: 100%;
        }
        
        .login-container {
          min-height: 100vh;
          width: 100%;
          background: #49AFAF;
          background: radial-gradient(at center, #49AFAF, #A8DFF4);
          position: relative;
          padding-top: 60px;
        }
        
        .logo-container {
          position: absolute;
          top: 20px;
          left: 40px;
          display: flex;
          align-items: center;
        }
        
        .logo {
          width: 50px;
          height: 50px;
          margin-right: 10px;
        }
        
        .logo-container h1 {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        
        .nav-links {
          position: absolute;
          top: 25px;
          right: 40px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .nav-link {
          color: #111827;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }
        
        .nav-link:hover {
          color: #2563eb;
        }
        
        .contact-button {
          background-color: #3b82f6;
          color: white;
          padding: 8px 24px;
          border-radius: 9999px;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        
        .contact-button:hover {
          background-color: #2563eb;
        }
        
        .form-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        
        .form-container h2 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 30px;
          color: #111827;
        }
        
        .error-message {
          background-color: #fee2e2;
          border: 1px solid #f87171;
          color: #b91c1c;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          white-space: pre-line;
        }
        
        .input-field {
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
          background-color: white;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        
        .remember-forgot-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
        }
        
        .remember-me input {
          margin-right: 8px;
        }
        
        .forgot-link {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .forgot-link:hover {
          text-decoration: underline;
        }
        
        .signup-prompt {
          margin: 20px 0;
          color: #111827;
        }
        
        .signup-link {
          color: #3b82f6;
          text-decoration: none;
          margin-left: 5px;
        }
        
        .signup-link:hover {
          text-decoration: underline;
        }
        
        .login-button-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        
        .login-button {
          background-color: #3b82f6;
          color: white;
          padding: 10px 30px;
          border: none;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .login-button:hover {
          background-color: #2563eb;
        }
        
        .login-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding-top: 0;
          }
          
          .logo-container {
            position: relative;
            top: 0;
            left: 0;
            justify-content: center;
            margin: 20px auto;
            width: 100%;
          }
          
          .nav-links {
            position: relative;
            top: 0;
            right: 0;
            justify-content: center;
            margin: 0 auto 30px;
            width: 100%;
          }
          
          .header-container {
            flex-direction: column;
            padding: 16px;
          }
          
          .form-container {
            padding: 20px 16px;
            margin-top: 0;
          }
          
          .remember-forgot-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .input-field {
            padding: 14px;
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .login-button {
            width: 100%;
            padding: 14px;
          }
        }
        
        /* Small phones */
        @media (max-width: 480px) {
          .form-container h2 {
            font-size: 24px;
          }
          
          .nav-links {
            gap: 12px;
          }
          
          .contact-button {
            padding: 6px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;