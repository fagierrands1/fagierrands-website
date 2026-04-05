import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const VerificationForm = ({ onVerificationSubmit }) => {
  const [formData, setFormData] = useState({
    user_role: 'rider', // default selection
    full_name: '',
    id_number: '',
    driving_license_number: '',
    years_of_experience: 'less_than_a_year',
    area_of_operation: '',
    phone_number: '',
    id_front: null,
    id_back: null,
    selfie: null,
    driving_license_image: null,
    service: '',
    certificate_image: null
  });

  const [preview, setPreview] = useState({
    id_front: null,
    id_back: null,
    selfie: null,
    driving_license_image: null,
    certificate_image: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const API_URL = '/accounts';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Safe file handling function that doesn't try to modify the file object
  const handleFileChange = (e) => {
    try {
      const { name, files } = e.target;
      
      if (!files || !files[0]) return;
      
      const file = files[0];
      
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        setError(`File exceeds the maximum size of 5MB.`);
        e.target.value = null;
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError(`File must be a JPG or PNG image.`);
        e.target.value = null;
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update state
      setPreview(prev => ({ ...prev, [name]: previewUrl }));
      setFormData(prev => ({ ...prev, [name]: file }));
    } catch (error) {
      console.error('Error in handleFileChange:', error);
      setError('Error processing file. Please try again with a different file.');
    }
  };

  useEffect(() => {
    return () => {
      Object.values(preview).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const validateForm = () => {
    let requiredFields = [
      'user_role', 
      'full_name', 
      'id_number', 
      'years_of_experience', 
      'area_of_operation', 
      'phone_number', 
      'id_front', 
      'id_back', 
      'selfie'
    ];

    if (formData.user_role === 'rider') {
      requiredFields = requiredFields.concat(['driving_license_number', 'driving_license_image']);
    } else if (formData.user_role === 'service_provider') {
      requiredFields = requiredFields.concat(['service', 'certificate_image']);
    }

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      setError(`Please provide: ${missingFields.join(', ')}`);
      return false;
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateForm()) return;
    setShowModal(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      
      // Add basic information
      formDataToSend.append('user_role', formData.user_role);
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('id_number', formData.id_number);
      formDataToSend.append('area_of_operation', formData.area_of_operation);
      formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('years_of_experience', formData.years_of_experience);
      
      // Add document images - use a simpler approach
      if (formData.id_front) {
        try {
          formDataToSend.append('id_front', formData.id_front);
        } catch (error) {
          console.error('Error appending id_front:', error);
        }
      }
      
      if (formData.id_back) {
        try {
          formDataToSend.append('id_back', formData.id_back);
        } catch (error) {
          console.error('Error appending id_back:', error);
        }
      }
      
      if (formData.selfie) {
        try {
          formDataToSend.append('selfie', formData.selfie);
        } catch (error) {
          console.error('Error appending selfie:', error);
        }
      }
      
      // Add role-specific fields
      if (formData.user_role === 'rider') {
        formDataToSend.append('driving_license_number', formData.driving_license_number);
        
        // Handle driver's license image with extra care
        if (formData.driving_license_image) {
          try {
            // Just append the file directly without any modifications
            formDataToSend.append('driving_license_image', formData.driving_license_image);
            
            // Log success for debugging
            console.log('Successfully appended driving_license_image');
          } catch (error) {
            console.error('Error appending driving_license_image:', error);
            setError('Error uploading license image. Please try again with a different image.');
          }
        }
      } else if (formData.user_role === 'service_provider') {
        formDataToSend.append('service', formData.service);
        
        if (formData.certificate_image) {
          try {
            formDataToSend.append('certificate_image', formData.certificate_image);
          } catch (error) {
            console.error('Error appending certificate_image:', error);
          }
        }
      }

      // Get the JWT token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Send the verification data to the backend
      const response = await axios.post(
        `${API_URL}/assistant/verify/`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setShowModal(false);
      if (onVerificationSubmit) {
        onVerificationSubmit({ 
          success: true, 
          message: 'Verification submitted successfully',
          data: response.data 
        });
      }
    } catch (error) {
      console.error('Verification submission error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Error submitting verification. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with an error status
        console.error('Error response:', error.response.data);
        
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Convert object of errors to readable format
          const errorDetails = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = errorDetails || errorMessage;
        }
      } else if (error.message) {
        // Client-side error with a message
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const ConfirmationModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
          <p className="mb-6 text-gray-600">
            Are you sure you want to submit your verification information?
            Please ensure all details are accurate and documents are clearly visible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
              onClick={() => !submitting && setShowModal(false)}
              disabled={submitting}
            >
              Review Again
            </button>
            <button
              className={`px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center justify-center ${submitting ? 'opacity-75' : ''}`}
              onClick={confirmSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ImagePreview = ({ src, icon, text }) => {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center bg-gray-50 overflow-hidden relative">
        {src ? (
          <img src={src} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-3xl mb-1">{icon}</div>
            <p className="text-sm">{text}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-8 mb-20">
        <div className="bg-blue-600 text-white p-4 font-semibold text-xl">
          Assistant Verification
        </div>

        <div className="p-6 max-h-screen overflow-y-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-8 pb-6 border-b border-gray-200">
            <h5 className="text-lg font-semibold mb-4">Personal Information</h5>

            <div className="mb-4">
              <label className="block mb-2 font-medium">User Role</label>
              <select
                name="user_role"
                value={formData.user_role}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="rider">Rider</option>
                <option value="service_provider">Service Provider</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Full Legal Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full legal name"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Must match your government ID</p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">ID Number</label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleInputChange}
                placeholder="Enter your ID number"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Government ID number (passport, driver's license, etc.)</p>
            </div>

            {formData.user_role === 'rider' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium">Driving License Number</label>
                <input
                  type="text"
                  name="driving_license_number"
                  value={formData.driving_license_number}
                  onChange={handleInputChange}
                  placeholder="Enter your driving license number"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            )}

            {formData.user_role === 'service_provider' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium">Service</label>
                <input
                  type="text"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  placeholder="Specify your service (e.g., car mechanic, bike repair)"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 font-medium">Years of Experience</label>
              <select
                name="years_of_experience"
                value={formData.years_of_experience}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="less_than_a_year">Less than a year</option>
                <option value="1_to_2_years">1-2 years</option>
                <option value="3_to_5_years">3-5 years</option>
                <option value="more_than_5_years">More than 5 years</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Area of Operation</label>
              <input
                type="text"
                name="area_of_operation"
                value={formData.area_of_operation}
                onChange={handleInputChange}
                placeholder="Enter your area of operation (city, district, etc.)"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Specify the location where you'll provide your services</p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Format: +1234567890</p>
            </div>
          </div>

          <div className="mb-8 pb-6 border-b border-gray-200">
            <h5 className="text-lg font-semibold mb-4">Identity Verification</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <ImagePreview
                  src={preview.id_front}
                  icon="📇"
                  text="ID Front"
                />
                <input
                  type="file"
                  name="id_front"
                  id="id_front"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="id_front"
                  className="block w-full mt-2 p-2 border border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Upload ID Front
                </label>
              </div>
              <div>
                <ImagePreview
                  src={preview.id_back}
                  icon="📇"
                  text="ID Back"
                />
                <input
                  type="file"
                  name="id_back"
                  id="id_back"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="id_back"
                  className="block w-full mt-2 p-2 border border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Upload ID Back
                </label>
              </div>
              <div>
                <ImagePreview
                  src={preview.selfie}
                  icon="🤳"
                  text="Selfie with ID"
                />
                <input
                  type="file"
                  name="selfie"
                  id="selfie"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="selfie"
                  className="block w-full mt-2 p-2 border border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Upload Selfie
                </label>
                <p className="text-xs text-gray-500 mt-1">Hold your ID next to your face</p>
              </div>
            </div>
          </div>

          {formData.user_role === 'rider' && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h5 className="text-lg font-semibold mb-4">Rider Documents</h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <ImagePreview
                    src={preview.driving_license_image}
                    icon="🚗"
                    text="Driving License Image"
                  />
                  <button
                    type="button"
                    className="block w-full mt-2 p-2 border border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      // Create a file input element programmatically
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = '.jpg,.jpeg,.png';
                      
                      // Handle the file selection manually
                      fileInput.addEventListener('change', (e) => {
                        try {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          // Validate file size
                          if (file.size > 5 * 1024 * 1024) {
                            setError('License image exceeds the maximum size of 5MB.');
                            return;
                          }
                          
                          // Validate file type
                          const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                          if (!validTypes.includes(file.type)) {
                            setError('License image must be a JPG or PNG image.');
                            return;
                          }
                          
                          // Create preview URL
                          const previewUrl = URL.createObjectURL(file);
                          
                          // Update state
                          setPreview(prev => ({ ...prev, driving_license_image: previewUrl }));
                          setFormData(prev => ({ ...prev, driving_license_image: file }));
                        } catch (error) {
                          console.error('Error handling license image:', error);
                          setError('Error processing license image. Please try again.');
                        }
                      });
                      
                      // Trigger the file selection dialog
                      fileInput.click();
                    }}
                  >
                    Upload License Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {formData.user_role === 'service_provider' && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h5 className="text-lg font-semibold mb-4">Service Provider Documents</h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <ImagePreview
                    src={preview.certificate_image}
                    icon="📜"
                    text="Certificate Image"
                  />
                  <input
                    type="file"
                    name="certificate_image"
                    id="certificate_image"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="certificate_image"
                    className="block w-full mt-2 p-2 border border-gray-300 rounded text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Upload Certificate
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <h6 className="font-semibold mb-2">Privacy Notice</h6>
            <p className="text-sm text-gray-600">
              Your personal information will only be used for verification purposes.
              We follow strict security protocols to protect your data in accordance with applicable privacy laws.
              Your documents will be encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleSubmit}
          >
            Submit Verification
          </button>
        </div>
      </div>

      <ConfirmationModal />
    </div>
  );
};

export default VerificationForm;

