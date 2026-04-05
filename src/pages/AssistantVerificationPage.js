import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Header from '../components/Common/Header';
import { FaUpload, FaCheck, FaIdCard, FaFileAlt, FaUserCheck } from 'react-icons/fa';
import config from '../config';
import { joinUrl } from '../utils/environment';

const API_BASE_URL = config.API_BASE_URL;

const AssistantVerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState({
    assistant_type: '',
    full_name: '',
    id_number: '',
    license_number: '',
    service: '', // Added service field for service providers
    phone_number: '',
    address: '',
    years_experience: '',
    id_document_front: null,
    id_document_back: null,
    profile_photo: null,
    drivers_license: null, // Separate field for driver's license
    certificate: null, // Separate field for certificate
    additional_documents: []
  });
  
  const idDocumentFrontRef = useRef(null);
  const idDocumentBackRef = useRef(null);
  const profilePhotoRef = useRef(null);
  const additionalDocsRef = useRef(null);
  const driversLicenseRef = useRef(null);
  const certificateRef = useRef(null);
  
  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('/accounts/assistant/verification-status/');
        
        if (response.data && response.data.is_verified) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
      }
    };
    
    checkVerificationStatus();
  }, [navigate]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'assistant_type') {
      setVerificationData(prev => ({
        ...prev,
        [name]: value,
        license_number: value === 'rider' ? prev.license_number : '',
        drivers_license: value === 'rider' ? prev.drivers_license : null,
        certificate: value === 'service_provider' ? prev.certificate : null,
      }));
    } else {
      setVerificationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle file uploads
  const handleFileUpload = (e, fieldName) => {
    if (e.target.files && e.target.files.length > 0) {
      if (fieldName === 'additional_documents') {
        const files = Array.from(e.target.files);
        setVerificationData(prev => ({
          ...prev,
          [fieldName]: [...prev[fieldName], ...files]
        }));
      } else {
        // For single file fields
        setVerificationData(prev => ({
          ...prev,
          [fieldName]: e.target.files[0]
        }));
      }
    }
  };
  
  // Remove a file
  const removeFile = (fieldName, index) => {
    if (fieldName === 'additional_documents') {
      setVerificationData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    } else {
      setVerificationData(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };
  
  // Submit verification request
  const submitVerification = async (e) => {
    e.preventDefault();
    
    // Validate basic form fields
    if (!verificationData.assistant_type || !verificationData.full_name || 
        !verificationData.id_number || !verificationData.phone_number || 
        !verificationData.address || !verificationData.years_experience ||
        !verificationData.id_document_front || !verificationData.id_document_back || 
        !verificationData.profile_photo) {
      setError('Please fill in all required fields and upload the required documents.');
      return;
    }
    
    // Validate license number for riders
      if (verificationData.assistant_type === 'rider' && !verificationData.license_number) {
      setError('License number is required for riders.');
      return;
    }
    
    if (verificationData.assistant_type === 'service_provider' && !verificationData.service) {
      setError('Service type is required for service providers.');
      return;
    }
    
    // Validate type-specific documents
    if (verificationData.assistant_type === 'rider' && !verificationData.drivers_license) {
      setError('Please upload your driver\'s license.');
      return;
    }
    
    if (verificationData.assistant_type === 'service_provider' && !verificationData.certificate) {
      setError('Please upload your certificate.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      // Add text fields
      formData.append('user_role', verificationData.assistant_type);
      formData.append('full_name', verificationData.full_name);
      formData.append('id_number', verificationData.id_number);
      if (verificationData.assistant_type === 'rider') {
        formData.append('driving_license_number', verificationData.license_number);
      }
      if (verificationData.assistant_type === 'service_provider') {
        formData.append('service', verificationData.service);
      }
      formData.append('phone_number', verificationData.phone_number);
      formData.append('area_of_operation', verificationData.address);
      formData.append('years_of_experience', verificationData.years_experience);
      
      // Add required files
      formData.append('id_front', verificationData.id_document_front);
      formData.append('id_back', verificationData.id_document_back);
      formData.append('selfie', verificationData.profile_photo);
      
      // Add type-specific documents
      if (verificationData.assistant_type === 'rider' && verificationData.drivers_license) {
        formData.append('driving_license_image', verificationData.drivers_license);
      }
      
      if (verificationData.assistant_type === 'service_provider' && verificationData.certificate) {
        formData.append('certificate_image', verificationData.certificate);
      }
      
      // Add additional documents
      verificationData.additional_documents.forEach((doc, index) => {
        formData.append(`additional_document_${index}`, doc);
      });
      
      // Submit the form
      const response = await axios.post('/accounts/assistant/verify/', formData);
      
      setSubmitSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting verification:', err);
      
      // Enhanced debugging for 400 errors
      if (err.response) {
        console.log('Error response status:', err.response.status);
        console.log('Error response data:', err.response.data);
        console.log('Error response headers:', err.response.headers);
        
        // The server responded with an error status
        if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else if (typeof err.response.data === 'object') {
          // Format validation errors
          const errorMessages = [];
          for (const key in err.response.data) {
            if (Array.isArray(err.response.data[key])) {
              errorMessages.push(`${key}: ${err.response.data[key].join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${err.response.data[key]}`);
            }
          }
          setError(errorMessages.join('\n'));
        } else {
          setError(err.response.data.message || 'Server error. Please try again.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request
        setError('Failed to submit verification. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
        <div className="container mx-auto px-4 py-20 mt-8">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4">
                <FaCheck className="mx-auto h-16 w-16" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Verification Submitted Successfully</h2>
              <p className="text-gray-700 mb-6">
                Thank you for submitting your verification documents as a {verificationData.assistant_type === 'rider' ? 'Rider' : 'Service Provider'}. Our team will review your application and get back to you as soon as possible.
              </p>
              <p className="text-gray-700 mb-6">You will be redirected to the dashboard shortly...</p>
              <Link to="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200">
                Go to Dashboard
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaUserCheck className="text-blue-500 mr-3" />
              Assistant Verification
            </h1>
            <p className="text-gray-600 mt-2">
              Please select your assistant type (Rider or Service Provider) and provide your information along with the required documents to verify your account.
            </p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-4 mx-6 mt-6">
              <p className="font-medium">Verification Error</p>
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={submitVerification} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label htmlFor="assistant_type" className="block text-gray-700 font-medium mb-2">
                  Assistant Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="assistant_type"
                  name="assistant_type"
                  value={verificationData.assistant_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Assistant Type</option>
                  <option value="rider">Rider</option>
                  <option value="service_provider">Service Provider</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="full_name" className="block text-gray-700 font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={verificationData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="id_number" className="block text-gray-700 font-medium mb-2">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={verificationData.id_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your ID number"
                  required
                />
              </div>
              
              {verificationData.assistant_type === 'rider' && (
                <div>
                  <label htmlFor="license_number" className="block text-gray-700 font-medium mb-2">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={verificationData.license_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your driver's license number"
                    required
                  />
                </div>
              )}
              
              {verificationData.assistant_type === 'service_provider' && (
                <div>
                  <label htmlFor="service" className="block text-gray-700 font-medium mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="service"
                    name="service"
                    value={verificationData.service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your service type (e.g., Plumbing, Electrical, Cleaning, etc.)"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Specify the type of service you provide
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="phone_number" className="block text-gray-700 font-medium mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={verificationData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                  Area of Operation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={verificationData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your area of operation (e.g., Nairobi CBD, Westlands)"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Specify the areas where you'll be available to provide services
                </p>
              </div>
              
              <div>
                <label htmlFor="years_experience" className="block text-gray-700 font-medium mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <select
                  id="years_experience"
                  name="years_experience"
                  value={verificationData.years_experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Experience</option>
                  <option value="less_than_a_year">Less than a year</option>
                  <option value="a_year">A year</option>
                  <option value="more_than_a_year">A year plus</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Required Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    National ID (Front) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'id_document_front')}
                    ref={idDocumentFrontRef}
                    className="hidden"
                  />
                  
                  <div className="flex items-center mb-2">
                    <button
                      type="button"
                      onClick={() => idDocumentFrontRef.current.click()}
                      className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
                    >
                      <FaIdCard className="mr-2" />
                      Upload ID Front
                    </button>
                  </div>
                  
                  {verificationData.id_document_front && (
                    <div className="mt-2 relative bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 mr-2" />
                        <span className="text-sm truncate">
                          {verificationData.id_document_front.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('id_document_front')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    National ID (Back) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'id_document_back')}
                    ref={idDocumentBackRef}
                    className="hidden"
                  />
                  
                  <div className="flex items-center mb-2">
                    <button
                      type="button"
                      onClick={() => idDocumentBackRef.current.click()}
                      className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
                    >
                      <FaIdCard className="mr-2" />
                      Upload ID Back
                    </button>
                  </div>
                  
                  {verificationData.id_document_back && (
                    <div className="mt-2 relative bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 mr-2" />
                        <span className="text-sm truncate">
                          {verificationData.id_document_back.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('id_document_back')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'profile_photo')}
                    ref={profilePhotoRef}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => profilePhotoRef.current.click()}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
                  >
                    <FaUpload className="mr-2" />
                    Upload Photo
                  </button>
                  
                  {verificationData.profile_photo && (
                    <div className="mt-2 relative">
                      <img
                        src={URL.createObjectURL(verificationData.profile_photo)}
                        alt="Profile Preview"
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('profile_photo')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {verificationData.assistant_type === 'rider' 
                  ? "Driver's License" 
                  : verificationData.assistant_type === 'service_provider' 
                    ? "Professional Certificate" 
                    : "Additional Documents"}
                <span className="text-red-500">*</span>
              </h2>
              
              {verificationData.assistant_type === 'rider' && (
                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'drivers_license')}
                    ref={driversLicenseRef}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => driversLicenseRef.current.click()}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
                  >
                    <FaIdCard className="mr-2" />
                    Upload Driver's License
                  </button>
                  
                  <p className="mt-2 text-sm text-gray-500">
                    Please upload a clear image of your valid driver's license.
                  </p>
                  
                  {verificationData.drivers_license && (
                    <div className="mt-2 relative bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 mr-2" />
                        <span className="text-sm truncate">
                          {verificationData.drivers_license.name} (Driver's License)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('drivers_license')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {verificationData.assistant_type === 'service_provider' && (
                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'certificate')}
                    ref={certificateRef}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => certificateRef.current.click()}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
                  >
                    <FaFileAlt className="mr-2" />
                    Upload Certificate
                  </button>
                  
                  <p className="mt-2 text-sm text-gray-500">
                    Please upload a clear image of your professional certificate.
                  </p>
                  
                  {verificationData.certificate && (
                    <div className="mt-2 relative bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 mr-2" />
                        <span className="text-sm truncate">
                          {verificationData.certificate.name} (Certificate)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('certificate')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {!verificationData.assistant_type && (
                <p className="text-gray-500">
                  Please select an assistant type above to see required documents.
                </p>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Other Supporting Documents (Optional)</h2>
              
              <div>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'additional_documents')}
                  ref={additionalDocsRef}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => additionalDocsRef.current.click()}
                  className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition duration-200"
                >
                  <FaUpload className="mr-2" />
                  Upload Other Documents
                </button>
                
                <p className="mt-2 text-sm text-gray-500">
                  You can upload recommendation letters or any other relevant documents.
                </p>
                
                {verificationData.additional_documents.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {verificationData.additional_documents.map((doc, index) => (
                      <div key={index} className="relative bg-gray-100 p-2 rounded-md">
                        <div className="flex items-center">
                          <FaFileAlt className="text-blue-500 mr-2" />
                          <span className="text-sm truncate">
                            {doc.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('additional_documents', index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                  <span className="text-red-500">*</span> Required fields
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/dashboard"
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition duration-200 text-center"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Submit Verification
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantVerificationPage;