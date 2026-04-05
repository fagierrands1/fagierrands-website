import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import axios from 'axios';

const AuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing email verification...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useParams(); // For Django token verification

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a Django token verification (from URL params)
        if (token) {
          // Handle Django email verification
          try {
            const backendUrl = window.location.hostname === 'localhost' 
              ? 'http://localhost:8003' 
              : 'https://fagierrands-server.vercel.app';
              
            const response = await axios.get(`${backendUrl}/api/accounts/verify-email/${token}/`);
            
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
            
          } catch (error) {
            console.error('Django email verification error:', error);
            setStatus('error');
            setMessage('Email verification failed. The link may be expired or invalid.');
            return;
          }
        }
        
        // Handle Supabase callback
        const supabaseToken = searchParams.get('token');
        const type = searchParams.get('type');
        const email = searchParams.get('email');
        
        if (type === 'email_confirmation' || type === 'signup' || supabaseToken) {
          // Handle OTP email verification
          if (supabaseToken && email) {
            // This is an OTP verification
            try {
              const backendUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:8006' 
                : 'https://fagierrands-server.vercel.app';
                
              const response = await axios.post(`${backendUrl}/api/accounts/supabase/verify-otp/`, {
                email: email,
                token: supabaseToken
              });
              
              if (response.data.success) {
                setStatus('success');
                setMessage('Email verified successfully! You can now log in.');
                
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                  navigate('/login');
                }, 3000);
                return;
              } else {
                setStatus('error');
                setMessage(response.data.message || 'Email verification failed.');
                return;
              }
              
            } catch (error) {
              console.error('OTP verification error:', error);
              setStatus('error');
              setMessage('Email verification failed. The link may be expired or invalid.');
              return;
            }
          }
          
          // Fallback to original Supabase verification
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: supabaseToken,
            type: 'email'
          });

          if (error) {
            console.error('Email verification error:', error);
            setStatus('error');
            setMessage('Email verification failed. The link may be expired or invalid.');
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else {
          // Handle other auth callbacks (like magic link login)
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setMessage('Authentication failed. Please try again.');
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {status === 'error' && (
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'processing' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
          
          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;