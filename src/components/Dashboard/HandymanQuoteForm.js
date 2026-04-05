import React, { useState, useEffect } from 'react';
import { FaTools, FaMoneyBillWave, FaFileAlt, FaUpload, FaCheck, FaTimes } from 'react-icons/fa';
import { homeMaintenanceService } from '../../services/apiService';

const HandymanQuoteForm = ({ order, onQuoteSubmitted, onCancel }) => {
  const [quoteData, setQuoteData] = useState({
    service_quote: '',
    estimated_hours: '',
    materials_needed: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Pre-fill form if there's existing quote data
    if (order && order.handyman_orders && order.handyman_orders.length > 0) {
      const handymanOrder = order.handyman_orders[0];
      if (handymanOrder.service_quote) {
        setQuoteData({
          service_quote: handymanOrder.service_quote.toString(),
          estimated_hours: handymanOrder.estimated_hours?.toString() || '',
          materials_needed: handymanOrder.materials_needed || '',
          notes: handymanOrder.quote_notes || ''
        });
      }
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!quoteData.service_quote || isNaN(parseFloat(quoteData.service_quote)) || parseFloat(quoteData.service_quote) <= 0) {
        throw new Error('Please enter a valid service quote amount');
      }
      
      // Get the handyman order ID
      let handymanOrderId;
      if (order.handyman_orders && order.handyman_orders.length > 0) {
        handymanOrderId = order.handyman_orders[0].id;
      } else {
        throw new Error('Handyman order information not found');
      }
      
      // Format data for API
      const formattedData = {
        service_quote: parseFloat(quoteData.service_quote),
        estimated_hours: quoteData.estimated_hours ? parseFloat(quoteData.estimated_hours) : null,
        materials_needed: quoteData.materials_needed,
        notes: quoteData.notes
      };
      
      // Submit quote
      await homeMaintenanceService.submitQuote(handymanOrderId, formattedData);
      
      setSuccess(true);
      setLoading(false);
      
      // Notify parent component
      if (onQuoteSubmitted) {
        onQuoteSubmitted();
      }
    } catch (err) {
      console.error('Error submitting quote:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit quote');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <FaCheck className="text-green-500 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-600 mb-2">Quote Submitted Successfully!</h3>
          <p className="text-gray-600 mb-4">
            Your quote has been submitted and is awaiting approval.
          </p>
          <button
            onClick={onQuoteSubmitted}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <FaTools className="text-blue-500 text-2xl mr-3" />
        <h2 className="text-xl font-semibold">Submit Service Quote</h2>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <div className="flex items-center">
            <FaTimes className="text-red-500 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            <FaMoneyBillWave className="inline mr-2 text-green-600" />
            Service Quote Amount (KSh) *
          </label>
          <input
            type="number"
            name="service_quote"
            value={quoteData.service_quote}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount in KSh"
            required
            min="1"
            step="0.01"
          />
          <p className="text-sm text-gray-500 mt-1">
            This is the amount the client will pay for your service (excluding the facilitation fee)
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Estimated Hours
          </label>
          <input
            type="number"
            name="estimated_hours"
            value={quoteData.estimated_hours}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Estimated hours to complete the service"
            min="0.5"
            step="0.5"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            <FaFileAlt className="inline mr-2 text-blue-600" />
            Materials Needed
          </label>
          <textarea
            name="materials_needed"
            value={quoteData.materials_needed}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List any materials needed for the service"
            rows="3"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={quoteData.notes}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional information about the service"
            rows="3"
          />
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Submit Quote
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HandymanQuoteForm;