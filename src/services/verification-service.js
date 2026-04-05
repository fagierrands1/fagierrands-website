// verification-service.js
import axios from '../utils/axiosConfig';

// Function to submit verification details
export const submitVerification = async (formData, token) => {
  try {
    const response = await axios.post('/api/verification/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to check verification status
export const checkVerificationStatus = async (token) => {
  try {
    const response = await axios.get('/api/verification/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get verification details for handlers/admins
export const getVerificationRequests = async (token) => {
  try {
    const response = await axios.get('/api/verification/requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to approve or reject verification
export const updateVerificationStatus = async (verificationId, status, token) => {
  try {
    const response = await axios.put(`/api/verification/${verificationId}`, 
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
