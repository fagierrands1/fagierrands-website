import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FaStar } from 'react-icons/fa';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const OrderReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id, navigate]);

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');
      
      await axios.post(`orders/${id}/review/`, {
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubmitSuccess(true);
      
      // Redirect back to order details after 2 seconds
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Order</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link to="/orders" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-green-500 text-5xl mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Review Submitted!</h2>
          <p className="text-gray-700 mb-6">Thank you for your feedback. You will be redirected to the order details page shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
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
              Rate Your Experience
            </h1>
            <p className="text-gray-600 mt-2">
              Please rate your experience with this order and provide any feedback.
            </p>
          </div>
          
          <form onSubmit={handleSubmitReview} className="p-6">
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Order ID
              </label>
              <p className="text-gray-600">{order?.id}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Service
              </label>
              <p className="text-gray-600">
                {order?.order_type?.name || order?.service_type || 'Standard Order'}
              </p>
            </div>
            
            {order?.assistant && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Assistant
                </label>
                <div className="flex items-center">
                  {order.assistant.avatar_url ? (
                    <img 
                      className="h-10 w-10 rounded-full mr-3" 
                      src={order.assistant.avatar_url} 
                      alt={order.assistant.name} 
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                  )}
                  <p className="text-gray-600">{order.assistant.name || order.assistant.email}</p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Your Rating
              </label>
              <div className="flex">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  
                  return (
                    <label key={index} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="rating" 
                        className="hidden" 
                        value={ratingValue} 
                        onClick={() => setRating(ratingValue)} 
                      />
                      <FaStar 
                        className="w-8 h-8 mr-1" 
                        color={ratingValue <= (hover || rating) ? "#FBBF24" : "#D1D5DB"} 
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                Your Comments (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience with this order..."
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ${
                  submitting || rating === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewPage;
