import React, { useState } from 'react';
import axios from 'axios';

const OTPVerification = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8006' 
      : 'https://fagierrands-server.vercel.app';

    try {
      // Try SMTP first (no domain restrictions)
      console.log('Trying SMTP email sending...');
      const response = await axios.post(`${backendUrl}/api/accounts/smtp/send-otp/`, {
        email: email
      });

      if (response.data.success) {
        setMessage('✅ Verification email sent via SMTP! Check your inbox for the 6-digit OTP code. 📧');
      } else {
        setMessage(`❌ SMTP Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('SMTP sending failed, trying Supabase fallback:', error);
      
      // If SMTP fails, try Supabase as fallback
      try {
        const fallbackResponse = await axios.post(`${backendUrl}/api/accounts/supabase/resend-verification/`, {
          email: email
        });

        if (fallbackResponse.data.success) {
          setMessage('✅ Verification email sent via Supabase! Check your inbox for the OTP token. 📧');
        } else {
          if (fallbackResponse.data.error_type === 'domain_restricted') {
            setMessage(`❌ ${fallbackResponse.data.message}\n\n💡 Try using devops@fagitone.com for testing, or contact support.`);
          } else {
            setMessage(`❌ Supabase Error: ${fallbackResponse.data.message}`);
          }
        }
      } catch (fallbackError) {
        console.error('Both SMTP and Supabase failed:', fallbackError);
        setMessage('❌ Failed to send verification email via both SMTP and Supabase. Please try again later or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8006' 
      : 'https://fagierrands-server.vercel.app';

    try {
      // Try SMTP verification first
      console.log('Trying SMTP OTP verification...');
      const response = await axios.post(`${backendUrl}/api/accounts/smtp/verify-otp/`, {
        email: email,
        token: token
      });

      if (response.data.success) {
        setMessage('🎉 Email verified successfully via SMTP! You can now log in. ✅');
      } else {
        setMessage(`❌ SMTP Verification Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('SMTP verification failed, trying Supabase fallback:', error);
      
      // If SMTP fails, try Supabase as fallback
      try {
        const fallbackResponse = await axios.post(`${backendUrl}/api/accounts/supabase/verify-otp/`, {
          email: email,
          token: token
        });

        if (fallbackResponse.data.success) {
          setMessage('🎉 Email verified successfully via Supabase! You can now log in. ✅');
        } else {
          setMessage(`❌ Supabase Verification Error: ${fallbackResponse.data.message}`);
        }
      } catch (fallbackError) {
        console.error('Both SMTP and Supabase verification failed:', fallbackError);
        setMessage('❌ Invalid or expired verification token. Please request a new OTP and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>Email Verification - OTP Testing</h4>
            </div>
            <div className="card-body">
              
              {/* Send OTP Form */}
              <form onSubmit={handleSendOTP} className="mb-4">
                <h5>Step 1: Send Verification Email</h5>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="devops@fagitone.com"
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>

              <hr />

              {/* Verify OTP Form */}
              <form onSubmit={handleVerifyOTP}>
                <h5>Step 2: Verify OTP Token</h5>
                <div className="mb-3">
                  <label htmlFor="token" className="form-label">OTP Token</label>
                  <input
                    type="text"
                    className="form-control"
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    placeholder="Enter the 6-digit token from email"
                  />
                  <div className="form-text">
                    Check your email for a 6-digit verification code
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={loading || !email || !token}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              {/* Message Display */}
              {message && (
                <div className={`alert mt-3 ${message.includes('❌') ? 'alert-danger' : 'alert-success'}`}>
                  {message}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-4">
                <h6>Instructions:</h6>
                <ol>
                  <li>Enter your email address and click "Send Verification Email"</li>
                  <li>Check your email inbox for a verification email (tries SMTP first, then Supabase)</li>
                  <li>Copy the 6-digit OTP code from the email</li>
                  <li>Paste the token above and click "Verify Email"</li>
                </ol>
                <div className="alert alert-info mt-3">
                  <strong>📧 SMTP Email System:</strong> Now supports ALL email domains (Gmail, Outlook, etc.)!<br/>
                  <strong>🔄 Fallback:</strong> If SMTP fails, automatically tries Supabase as backup.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;