import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import formValidation from '../../utils/formValidation';
import Header from '../Common/Header';
import Logo from '../../assets/logo.png';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    referralCode: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [accountType, setAccountType] = useState('Client');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const userTypeMapping = {
    'Client': 'user',
    'Assistant': 'assistant'
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(formValidation.validatePassword(formData.password));
    }
  }, [formData.password]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const validationErrors = formValidation.validateSignUpForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      alert(firstError);
      return;
    }
    
    try {
      setLoading(true);
      setErrors({});
      
      const backendUserType = userTypeMapping[accountType] || 'user';
      
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        user_type: backendUserType,
      };

      if (formData.phoneNumber.trim()) {
        registrationData.phone_number = formValidation.formatPhoneNumber(formData.phoneNumber);
      }

      if (formData.referralCode.trim()) {
        registrationData.referral_code = formData.referralCode.trim();
      }
      
      const response = await axios.post('/accounts/register/', registrationData);
      
      if (response.status === 201) {
        alert('Registration successful! Check your email for verification.');
        navigate('/login');
      }
      
    } catch (error) {
      console.error('Sign up error:', error);
      
      if (error.response?.status === 400) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const fieldErrors = {};
          Object.entries(data).forEach(([field, msg]) => {
            if (field === 'username' && msg.toString().toLowerCase().includes('already')) {
              fieldErrors.username = 'This username is already taken';
            } else if (field === 'email' && msg.toString().toLowerCase().includes('already')) {
              fieldErrors.email = 'An account with this email already exists';
            } else {
              fieldErrors[field] = Array.isArray(msg) ? msg.join(', ') : msg;
            }
          });
          setErrors(fieldErrors);
          alert(Object.values(fieldErrors)[0]);
        }
      } else {
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Registration failed';
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      
      
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
        <h2>Sign Up</h2>
        
        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <input
              type="text"
              value={formData.username}
              onChange={(e) => updateFormData('username', e.target.value)}
              placeholder="Username"
              className={`input-field ${errors.username ? 'error' : ''}`}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="Email Address"
              className={`input-field ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData('firstName', e.target.value)}
              placeholder="First Name"
              className={`input-field ${errors.firstName ? 'error' : ''}`}
            />
            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData('lastName', e.target.value)}
              placeholder="Last Name"
              className={`input-field ${errors.lastName ? 'error' : ''}`}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData('phoneNumber', e.target.value)}
              placeholder="Phone Number (Optional) e.g., +254712345678"
              className={`input-field ${errors.phoneNumber ? 'error' : ''}`}
            />
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="text"
              value={formData.referralCode}
              onChange={(e) => updateFormData('referralCode', e.target.value)}
              placeholder="Referral Code (Optional)"
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Password (8+ chars, uppercase, lowercase, number, special char)"
                className={`input-field ${errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {passwordStrength && (
              <div className="password-strength">
                <div className={`strength-bar strength-${
                  passwordStrength.requirements.minLength ? (
                    passwordStrength.requirements.hasUppercase && 
                    passwordStrength.requirements.hasLowercase && 
                    passwordStrength.requirements.hasNumber && 
                    passwordStrength.requirements.hasSpecialChar ? 'strong' : 'medium'
                  ) : 'weak'
                }`}></div>
                <span className="strength-text">
                  {!passwordStrength.requirements.minLength ? '❌ Min 8 chars' :
                   !passwordStrength.requirements.hasUppercase ? '❌ Needs uppercase' :
                   !passwordStrength.requirements.hasLowercase ? '❌ Needs lowercase' :
                   !passwordStrength.requirements.hasNumber ? '❌ Needs number' :
                   !passwordStrength.requirements.hasSpecialChar ? '❌ Needs special char' :
                   '✓ Strong password'}
                </span>
              </div>
            )}
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm Password"
                className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
          
          <div className="account-type-container">
            <p>Choose account type</p>
            <div className="account-options">
              <div className={`account-option ${accountType === 'Client' ? 'selected' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={accountType === 'Client'}
                    onChange={() => setAccountType('Client')}
                  />
                  Client
                </label>
              </div>
              
              <div className={`account-option ${accountType === 'Assistant' ? 'selected' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={accountType === 'Assistant'}
                    onChange={() => setAccountType('Assistant')}
                  />
                  Assistant
                </label>
              </div>
            </div>
          </div>
          
          <div className="legal-agreement">
            <label className={`checkbox-label ${errors.acceptTerms ? 'error' : ''}`}>
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                className="checkbox-input"
              />
              <span>I accept the <a href="/termsandcondition.txt" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
            </label>
            {errors.acceptTerms && <span className="error-text">{errors.acceptTerms}</span>}
          </div>
          
          <div className="legal-agreement">
            <label className={`checkbox-label ${errors.acceptPrivacy ? 'error' : ''}`}>
              <input
                type="checkbox"
                checked={formData.acceptPrivacy}
                onChange={(e) => updateFormData('acceptPrivacy', e.target.checked)}
                className="checkbox-input"
              />
              <span>I accept the <Link to="/privacy">Privacy Policy</Link></span>
            </label>
            {errors.acceptPrivacy && <span className="error-text">{errors.acceptPrivacy}</span>}
          </div>

          <div className="login-prompt">
            <span>Already registered?</span>
            <Link to="/login" className="login-link">Login here</Link>
          </div>

          <div className="signup-button-container">
            <button
              type="submit"
              disabled={loading || !formData.acceptTerms || !formData.acceptPrivacy}
              className="signup-button"
            >
              {loading ? 'Signing Up...' : 'Create Account'}
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
        
        .signup-container {
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
        
        .form-group {
          margin-bottom: 12px;
          text-align: left;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
          background-color: white;
          box-sizing: border-box;
        }

        .input-field.error {
          border-color: #dc2626;
          background-color: #fef2f2;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .error-text {
          display: block;
          color: #dc2626;
          font-size: 12px;
          margin-top: -6px;
          margin-bottom: 8px;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          flex: 1;
          padding-right: 40px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .password-strength {
          margin-bottom: 8px;
        }

        .strength-bar {
          height: 4px;
          border-radius: 2px;
          margin-bottom: 6px;
          background-color: #e5e7eb;
        }

        .strength-weak {
          background-color: #dc2626;
        }

        .strength-medium {
          background-color: #f59e0b;
        }

        .strength-strong {
          background-color: #10b981;
        }

        .strength-text {
          font-size: 12px;
          color: #6b7280;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .checkbox-input {
          margin-right: 8px;
          margin-top: 2px;
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .checkbox-label span {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        .checkbox-label a {
          color: #3b82f6;
          text-decoration: none;
        }

        .checkbox-label a:hover {
          text-decoration: underline;
        }

        .legal-agreement {
          margin-bottom: 12px;
          text-align: left;
        }

        .legal-agreement.error .checkbox-label {
          color: #dc2626;
        }
        
        .account-type-container {
          margin-bottom: 20px;
          text-align: left;
        }
        
        .account-type-container p {
          margin-bottom: 12px;
          font-weight: 500;
          color: #111827;
        }
        
        .account-options {
          display: flex;
          gap: 20px;
        }
        
        .account-option {
          flex: 1;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background-color: #f3f4f6;
          cursor: pointer;
        }
        
        .account-option.selected {
          background-color: #bfdbfe;
          border-color: #3b82f6;
        }
        
        .account-option label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .account-option input {
          margin-right: 8px;
        }
        
        .login-prompt {
          margin: 20px 0;
          color: #111827;
        }
        
        .login-link {
          color: #3b82f6;
          text-decoration: none;
          margin-left: 5px;
        }
        
        .login-link:hover {
          text-decoration: underline;
        }

        .legal-links {
          margin: 10px 0 0;
          color: #374151;
        }

        .legal-links a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .signup-button-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        
        .signup-button {
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
        
        .signup-button:hover {
          background-color: #2563eb;
        }
        
        .signup-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .signup-container {
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
          
          .account-options {
            flex-direction: column;
            gap: 10px;
          }
          
          .input-field {
            padding: 14px;
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .signup-button {
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

export default SignUp;

