import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Header from '../components/Common/Header';
import { FaExclamationTriangle, FaUpload } from 'react-icons/fa';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const OrderReportIssuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportIssueData, setReportIssueData] = useState({
    description: '',
    incident_timestamp: new Date().toISOString().slice(0, 16),
    evidence_photos: [],
    evidence_videos: []
  });
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('OrderReportIssuePage - Fetching order details for ID:', id);
        
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        const response = await axios.get(`orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 404) {
            setError('Order not found.');
          } else if (err.response.status === 401) {
            navigate('/login');
            return;
          } else {
            setError(`Failed to load order details: ${err.response.data?.detail || 'Unknown error'}`);
          }
        } else if (err.request) {
          // This is a network error (CORS, connection refused, etc.)
          console.log('Network error details:', err.message);
          if (err.message.includes('CORS')) {
            setError('Cross-Origin Request Blocked. This is a server configuration issue. Please contact support.');
          } else {
            setError('Network error. Please check your connection.');
          }
        } else {
          setError('Failed to load order details. Please try again.');
        }
        
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Handle form changes
  const handleReportIssueChange = (e) => {
    const { name, value } = e.target;
    setReportIssueData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo uploads
  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Update form data with new files
      setReportIssueData(prev => ({
        ...prev,
        evidence_photos: [...prev.evidence_photos, ...files]
      }));
      
      // Create preview URLs
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // Handle video uploads
  const handleVideoUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Update form data with new files
      setReportIssueData(prev => ({
        ...prev,
        evidence_videos: [...prev.evidence_videos, ...files]
      }));
      
      // Create preview URLs
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setVideoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // Remove a photo
  const removePhoto = (index) => {
    setReportIssueData(prev => ({
      ...prev,
      evidence_photos: prev.evidence_photos.filter((_, i) => i !== index)
    }));
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Remove a video
  const removeVideo = (index) => {
    setReportIssueData(prev => ({
      ...prev,
      evidence_videos: prev.evidence_videos.filter((_, i) => i !== index)
    }));
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(videoPreviewUrls[index]);
    setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Submit issue report
  const submitIssueReport = async (e) => {
    e.preventDefault();
    
    if (!reportIssueData.description) {
      alert('Please provide a description of the issue.');
      return;
    }
    
    if (reportIssueData.evidence_photos.length === 0) {
      alert('Please upload at least one photo as evidence.');
      return;
    }
    
    if (reportIssueData.evidence_videos.length === 0) {
      alert('Please upload at least one video as evidence.');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      formData.append('description', reportIssueData.description);
      formData.append('incident_timestamp', reportIssueData.incident_timestamp);
      formData.append('order', id);
      
      reportIssueData.evidence_photos.forEach((photo, index) => {
        formData.append(`evidence_photos[${index}]`, photo);
      });
      
      reportIssueData.evidence_videos.forEach((video, index) => {
        formData.append(`evidence_videos[${index}]`, video);
      });
      
      await axios.post(`orders/${id}/report-issue/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSubmitSuccess(true);
      
      // Reset form
      setReportIssueData({
        description: '',
        incident_timestamp: new Date().toISOString().slice(0, 16),
        evidence_photos: [],
        evidence_videos: []
      });
      setPhotoPreviewUrls([]);
      setVideoPreviewUrls([]);
      
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 3000);
    } catch (err) {
      console.error('Error reporting issue:', err);
      alert('Failed to report issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <FaExclamationTriangle className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Order</h2>
          <p className="text-gray-700 mb-6">{error || 'Order not found or you do not have permission to view it.'}</p>
          <Link to="/orders" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
       
        
        <div className="container mx-auto px-4 py-20 mt-8">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Issue Reported Successfully</h2>
              <p className="text-gray-700 mb-6">Thank you for reporting the issue. Our team will review it and get back to you as soon as possible.</p>
              <p className="text-gray-700 mb-6">You will be redirected to the order details page shortly...</p>
              <Link to={`/orders/${id}`} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200">
                Back to Order Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
     
      
      <div className="container mx-auto px-4 py-20 mt-8">
        <div className="mb-6">
          <Link to={`/orders/${id}`} className="flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Order Details
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Report an Issue with Order: {order.title}
            </h1>
            <p className="text-gray-600 mt-2">
              Please provide details about the issue you're experiencing with this order.
            </p>
          </div>
          
          <form onSubmit={submitIssueReport} className="p-6">
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Issue Description
              </label>
              <textarea
                id="description"
                name="description"
                value={reportIssueData.description}
                onChange={handleReportIssueChange}
                rows="5"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please describe the issue in detail..."
                required
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label htmlFor="incident_timestamp" className="block text-gray-700 font-medium mb-2">
                When did this issue occur?
              </label>
              <input
                type="datetime-local"
                id="incident_timestamp"
                name="incident_timestamp"
                value={reportIssueData.incident_timestamp}
                onChange={handleReportIssueChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Evidence Photos (Required)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => photoInputRef.current.click()}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200"
                >
                  <FaUpload className="mr-2" />
                  Upload Photos
                </button>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <span className="ml-3 text-gray-600 text-sm">
                  {reportIssueData.evidence_photos.length} photo(s) selected
                  {reportIssueData.evidence_photos.length === 0 && (
                    <span className="text-red-500 ml-2">* Required</span>
                  )}
                </span>
              </div>
              
              {photoPreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Evidence Videos (Required)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => videoInputRef.current.click()}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200"
                >
                  <FaUpload className="mr-2" />
                  Upload Videos
                </button>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                  multiple
                  accept="video/*"
                  className="hidden"
                />
                <span className="ml-3 text-gray-600 text-sm">
                  {reportIssueData.evidence_videos.length} video(s) selected
                  {reportIssueData.evidence_videos.length === 0 && (
                    <span className="text-red-500 ml-2">* Required</span>
                  )}
                </span>
              </div>
              
              {videoPreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <video
                        src={url}
                        controls
                        className="w-full h-48 object-cover rounded-lg"
                      ></video>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-8">
              <Link
                to={`/orders/${id}`}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200 flex items-center ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="mr-2" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderReportIssuePage;
