import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import './QuoteReview.css';

const QuoteReview = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('submitted');

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = filter ? `?status=${filter}` : '';
      const response = await axios.get(`/orders/handler/quotes/${params}`);
      setQuotes(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewQuote = (quote, action) => {
    setSelectedQuote(quote);
    setReviewAction(action);
    setRejectionReason('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    try {
      const reviewData = {
        action: reviewAction
      };

      if (reviewAction === 'reject') {
        if (!rejectionReason.trim()) {
          alert('Please provide a reason for rejection');
          return;
        }
        reviewData.reason = rejectionReason;
      }

      await axios.post(`/orders/handler/quotes/${selectedQuote.id}/review/`, reviewData);
      
      alert(`Quote ${reviewAction}d successfully!`);
      setShowReviewModal(false);
      setSelectedQuote(null);
      fetchQuotes(); // Refresh the list
    } catch (error) {
      console.error('Error reviewing quote:', error);
      alert('Error processing review');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'gray', text: '📝 Draft' },
      submitted: { color: 'blue', text: '📋 Pending Review' },
      approved: { color: 'green', text: '✅ Approved' },
      rejected: { color: 'red', text: '❌ Rejected' },
      revised: { color: 'orange', text: '🔄 Revised' }
    };
    
    const config = statusConfig[status] || { color: 'gray', text: status };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading quotes...</div>;
  }

  return (
    <div className="quote-review-container">
      <div className="header">
        <h2>Quote Review Dashboard</h2>
        <div className="filter-controls">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Quotes</option>
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="no-quotes">
          <p>No quotes found for the selected filter.</p>
        </div>
      ) : (
        <div className="quotes-grid">
          {quotes.map(quote => (
            <div key={quote.id} className={`quote-card ${quote.status}`}>
              <div className="quote-header">
                <div className="quote-info">
                  <h3>Quote #{quote.id}</h3>
                  {getStatusBadge(quote.status)}
                </div>
                <div className="quote-price">
                  {formatCurrency(quote.quoted_price)}
                </div>
              </div>

              <div className="service-provider-info">
                <h4>Service Provider</h4>
                <p><strong>Name:</strong> {quote.service_provider_name}</p>
                <p><strong>Username:</strong> {quote.service_provider_username}</p>
              </div>

              <div className="order-details">
                <h4>Order Details</h4>
                <p><strong>Service:</strong> {quote.handyman_order_details.service_type}</p>
                <p><strong>Client:</strong> {quote.handyman_order_details.client_name}</p>
                <p><strong>Date:</strong> {quote.handyman_order_details.scheduled_date}</p>
                <p><strong>Time:</strong> {quote.handyman_order_details.scheduled_time_slot}</p>
                <p><strong>Address:</strong> {quote.handyman_order_details.address}</p>
              </div>

              <div className="quote-details">
                <h4>Quote Details</h4>
                <p><strong>Duration:</strong> {quote.estimated_duration}</p>
                <p><strong>Materials:</strong> {quote.materials_included ? 'Included' : 'Not Included'}</p>
                {quote.warranty_period && (
                  <p><strong>Warranty:</strong> {quote.warranty_period}</p>
                )}
                
                <div className="description">
                  <strong>Work Description:</strong>
                  <p>{quote.description}</p>
                </div>

                {quote.materials_list && (
                  <div className="materials">
                    <strong>Materials List:</strong>
                    <p>{quote.materials_list}</p>
                  </div>
                )}

                {quote.additional_notes && (
                  <div className="notes">
                    <strong>Additional Notes:</strong>
                    <p>{quote.additional_notes}</p>
                  </div>
                )}
              </div>

              <div className="quote-timestamps">
                <p><strong>Submitted:</strong> {new Date(quote.submitted_at).toLocaleString()}</p>
                {quote.reviewed_at && (
                  <p><strong>Reviewed:</strong> {new Date(quote.reviewed_at).toLocaleString()}</p>
                )}
              </div>

              {quote.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong>
                  <p>{quote.rejection_reason}</p>
                </div>
              )}

              {quote.status === 'submitted' && (
                <div className="quote-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleReviewQuote(quote, 'approve')}
                  >
                    ✅ Approve Quote
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleReviewQuote(quote, 'reject')}
                  >
                    ❌ Reject Quote
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedQuote && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h3>
                {reviewAction === 'approve' ? '✅ Approve Quote' : '❌ Reject Quote'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="quote-summary">
                <h4>Quote Summary</h4>
                <p><strong>Quote ID:</strong> #{selectedQuote.id}</p>
                <p><strong>Service Provider:</strong> {selectedQuote.service_provider_name}</p>
                <p><strong>Service:</strong> {selectedQuote.handyman_order_details.service_type}</p>
                <p><strong>Quoted Price:</strong> {formatCurrency(selectedQuote.quoted_price)}</p>
              </div>

              {reviewAction === 'approve' && (
                <div className="approval-confirmation">
                  <p>Are you sure you want to approve this quote?</p>
                  <p>This will allow the service provider to start work on the order.</p>
                </div>
              )}

              {reviewAction === 'reject' && (
                <div className="rejection-form">
                  <label>Reason for Rejection *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejecting this quote..."
                    rows="4"
                    required
                  />
                  <p className="help-text">
                    The service provider will see this reason and can submit a revised quote.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`submit-btn ${reviewAction}`}
                onClick={submitReview}
              >
                {reviewAction === 'approve' ? 'Approve Quote' : 'Reject Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteReview;