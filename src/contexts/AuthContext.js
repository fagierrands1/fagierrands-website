import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { getApiBaseUrl } from '../utils/environment';

const API_BASE_URL = getApiBaseUrl();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  
  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };
  
  // Create authenticated axios instance
  const createAuthAxios = (token) => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  };

  // Function to get or refresh auth token
  const getAuthToken = async () => {
    if (authToken) return authToken;
    const token = getToken();
    if (token) {
      setAuthToken(token);
      return token;
    }
    return null;
  };
  
  // Fetch user profile
  const fetchProfile = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingProfile) {
      console.log('fetchProfile: Already fetching, skipping...');
      return null;
    }
    
    setIsFetchingProfile(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('fetchProfile: No auth token available');
        setLoading(false);
        setIsFetchingProfile(false);
        return null;
      }
      
      console.log('fetchProfile: Fetching user profile with token');
      
      try {
        const axiosAuth = createAuthAxios(token);
        const profileResponse = await axiosAuth.get('accounts/profile/');
        
        console.log('fetchProfile: Got profile response:', profileResponse.data);
        
        if (profileResponse.data && profileResponse.data.user) {
          const userData = profileResponse.data.user;
          console.log('fetchProfile: Extracted user data from profile:', userData);
          
          if (!userData.user_type) {
            const storedUserType = localStorage.getItem('userType');
            if (storedUserType) {
              userData.user_type = storedUserType;
            } else {
              userData.user_type = 'user';
            }
          }
          
          console.log('fetchProfile: Final user data with user_type:', userData);
          
          setUser(userData);
          setProfile(profileResponse.data);
          localStorage.setItem('userData', JSON.stringify(userData));
          localStorage.setItem('userType', userData.user_type);
          setLoading(false);
          setIsFetchingProfile(false);
          
          return userData;
        }
      } catch (profileError) {
        console.error('Error fetching profile, falling back to user endpoint:', profileError);
        // If it's a 401, the token is invalid - clear it
        if (profileError.response?.status === 401) {
          console.log('fetchProfile: Token is invalid (401), clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('userType');
          setAuthToken(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setIsFetchingProfile(false);
          return null;
        }
      }
      
      // Fallback to user endpoint if profile endpoint fails
      try {
        const axiosAuth = createAuthAxios(token);
        const response = await axiosAuth.get('accounts/user/');
        
        console.log('fetchProfile: Fetched user data:', response.data);
        
        if (!response.data.user_type) {
          const storedUserType = localStorage.getItem('userType');
          if (storedUserType) {
            response.data.user_type = storedUserType;
          } else {
            response.data.user_type = 'user';
          }
        }
        
        console.log('fetchProfile: Final user data with user_type:', response.data);
        
        setUser(response.data);
        setProfile(response.data);
        
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.setItem('userType', response.data.user_type);
        setLoading(false);
        setIsFetchingProfile(false);
        
        return response.data;
      } catch (userError) {
        console.error('Error fetching user data:', userError);
        // If it's a 401, the token is invalid - clear it
        if (userError.response?.status === 401) {
          console.log('fetchProfile: Token is invalid (401), clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('userType');
          setAuthToken(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        setIsFetchingProfile(false);
        return null;
      }
    } catch (error) {
      console.error('Fetch profile failed:', error.message);
      setLoading(false);
      setIsFetchingProfile(false);
      return null;
    }
  };
  
  useEffect(() => {
    const token = getToken();
    const userData = localStorage.getItem('userData');
    const userType = localStorage.getItem('userType');
    
    // Check if we're on the login page - if so, don't try to fetch profile
    // This prevents reload loops when there's an invalid token
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
    
    console.log('AuthContext initialization:');
    console.log('- Token exists:', !!token);
    console.log('- UserData exists:', !!userData);
    console.log('- UserType from localStorage:', userType);
    console.log('- Is login/signup page:', isLoginPage);
    
    if (token) {
      setAuthToken(token);
      
      if (userData) {
        let parsedUserData;
        try {
          parsedUserData = JSON.parse(userData);
        } catch (e) {
          console.error('Error parsing userData from localStorage:', e);
          localStorage.removeItem('userData');
          setLoading(false);
          return;
        }
        
        if (!parsedUserData.user_type && userType) {
          console.log('Adding user_type from localStorage to user data');
          parsedUserData = {
            ...parsedUserData,
            user_type: userType
          };
        }
        
        if (!parsedUserData.user_type) {
          // Only fetch profile if not on login/signup page
          if (!isLoginPage) {
            console.warn('Cached user data missing user_type, fetching fresh profile');
            fetchProfile();
          } else {
            console.log('On login page, skipping profile fetch');
            setLoading(false);
          }
        } else {
          console.log('Setting user and profile with data:', parsedUserData);
          setUser(parsedUserData);
          setProfile(parsedUserData);
          setLoading(false);
        }
      } else {
        // Only fetch profile if not on login/signup page
        if (!isLoginPage) {
          console.log('No cached user data, fetching profile');
          fetchProfile();
        } else {
          console.log('On login page, skipping profile fetch');
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
  }, []);
  
  // Login function - authenticates with Django backend
  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login with email:', email);
      
      const response = await axios.post(`accounts/login/`, {
        email,
        password
      });
      
      console.log('AuthContext: Login response:', response.data);
      
      const token = response.data.token || response.data.access;
      const user_type = response.data.user_type;
      const user_id = response.data.user_id;
      
      if (!token) {
        console.error('Login response missing token');
        return { success: false, message: 'Authentication failed. Missing token.' };
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('refresh', response.data.refresh);
      }
      setAuthToken(token);
      
      if (user_type) {
        console.log('AuthContext: Setting user_type from login response:', user_type);
        localStorage.setItem('userType', user_type);
      }
      
      if (user_id) {
        localStorage.setItem('userId', user_id);
      }
      
      const profileData = await fetchProfile();
      
      if (!profileData) {
        console.warn('Failed to fetch profile after login');
        return { success: false, message: 'Login successful but failed to load user profile.' };
      }
      
      console.log('AuthContext: Login and profile fetch successful');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };
  
  // OTP functions - added from mobile app
  const sendOTP = async (email) => {
    try {
      console.log('AuthContext: Sending OTP to email:', email);
      const response = await axios.post(`accounts/send-otp/`, { email });
      return { 
        success: true, 
        message: response.data?.message || 'OTP sent to your email' 
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Failed to send OTP' 
      };
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      console.log('AuthContext: Verifying OTP for email:', email);
      const response = await axios.post(`accounts/verify-otp/`, { 
        email, 
        otp_code: otpCode 
      });
      
      if (response.data?.token || response.data?.access) {
        const token = response.data.token || response.data.access;
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
        
        if (response.data.refresh) {
          localStorage.setItem('refreshToken', response.data.refresh);
          localStorage.setItem('refresh', response.data.refresh);
        }
        
        setAuthToken(token);
        const profileData = await fetchProfile();
        
        if (profileData) {
          return { 
            success: true, 
            message: 'OTP verified successfully' 
          };
        }
      }
      
      return { 
        success: response.data?.success !== false, 
        message: response.data?.message || 'OTP verified' 
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Failed to verify OTP' 
      };
    }
  };

  const resendOTP = async (email) => {
    try {
      console.log('AuthContext: Resending OTP to email:', email);
      const response = await axios.post(`accounts/resend-otp/`, { email });
      return { 
        success: true, 
        message: response.data?.message || 'OTP resent to your email' 
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Failed to resend OTP' 
      };
    }
  };

  const getOTPStatus = async (email) => {
    try {
      const response = await axios.post(`accounts/otp-status/`, { email });
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Get OTP status error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to get OTP status' 
      };
    }
  };

  // Email verification functions - added from mobile app
  const checkEmailVerification = async () => {
    try {
      const response = await axios.get(`accounts/check-email-verification/`);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Check email verification error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to check email verification status' 
      };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      console.log('AuthContext: Resending verification email to:', email);
      const response = await axios.post(`accounts/resend-verification/`, { email });
      return { 
        success: true, 
        message: response.data?.message || 'Verification email sent' 
      };
    } catch (error) {
      console.error('Resend verification email error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Failed to resend verification email' 
      };
    }
  };
  
  // Register function - updated
  const register = async (userData) => {
    try {
      console.log('AuthContext: Attempting registration');
      const response = await axios.post(`accounts/register/`, userData);
      
      return { 
        success: true, 
        data: response.data,
        message: response.data?.message || 'Registration successful' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const axiosAuth = createAuthAxios(token);
        await axiosAuth.post('accounts/logout/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('refresh');
      setAuthToken(null);
      setUser(null);
      setProfile(null);
    }
  };
  
  // Function to update user profile
  const updateProfile = async (profileData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { 
          success: false, 
          message: 'You must be logged in to update your profile.' 
        };
      }
      
      const axiosAuth = createAuthAxios(token);
      const response = await axiosAuth.patch('accounts/profile/', profileData);
      
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfile(updatedUser);
      
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to update profile.' 
      };
    }
  };
  
  // Enhanced isAuthenticated check that verifies user_type exists
  const isAuthenticated = () => {
    return !!user && !!user.user_type;
  };
  
  // Check if user is of a specific type (e.g., 'assistant')
  const hasUserType = (type) => {
    console.log('Checking user type:', type);
    console.log('Current user:', user);
    console.log('User type from user object:', user?.user_type);
    return isAuthenticated() && user.user_type === type;
  };
  
  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    register,
    getAuthToken,
    updateProfile,
    fetchProfile,
    sendOTP,
    verifyOTP,
    resendOTP,
    getOTPStatus,
    checkEmailVerification,
    resendVerificationEmail,
    isAuthenticated: isAuthenticated(),
    isAssistant: hasUserType('assistant'),
    isClient: hasUserType('user') || hasUserType('client'),
    isHandler: hasUserType('handler'),
    isAdmin: hasUserType('admin'),
    isVendor: hasUserType('vendor'),
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
