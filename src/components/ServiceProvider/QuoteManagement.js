import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import './QuoteManagement.css';

const QuoteManagement = () => {
  const [dashboard, setDashboard] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({
    quoted_price: '',
    description: '',
    estimated_duration: '',
    materials_included: true,
    materials_list: '',
    warranty_period: '',
    additional_notes: '',
    breakdown: {}
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/orders/service-provider/dashboard/');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (orderId) => {
    try {
      // Check if can submit quote
      const statusResponse = await axios.get(`/orders/quotes/status-check/${orderId}/`);
      
      if (!statusResponse.data.can_submit_quote) {
        alert(`Cannot submit quote: ${statusResponse.data.reason}`);
        return;
      }

      setSelectedOrder(statusResponse.data.order_details);
      setQuoteForm({
        ...quoteForm,
        handyman_order: orderId
      });
      setShowQuoteForm(true);
    } catch (error) {
      console.error('Error checking quote status:', error);
      alert('Error checking quote status');
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    
    try {
      // Create the quote
      const response = await axios.post('/orders/quotes/', {
        ...quoteForm,
        breakdown: {
          labor: parseFloat(quoteForm.quoted_price) * 0.7,
          materials: parseFloat(quoteForm.quoted_price) * 0.3
        }
      });

      // Submit the quote immediately
      await axios.post(`/orders/quotes/${response.data.id}/submit/`);
      
      alert('Quote submitted successfully!');
      setShowQuoteForm(false);
      setSelectedOrder(null);
      setQuoteForm({
        quoted_price: '',
        description: '',
        estimated_duration: '',
        materials_included: true,
        materials_list: '',
        warranty_period: '',
        additional_notes: '',
        breakdown: {}
      });
      
      fetchDashboard(); // Refresh dashboard
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { color: 'blue', text: '📋 Needs Quote' },
      quote_provided: { color: 'orange', text: '⏳ Quote Pending' },
      quote_approved: { color: 'green', text: '✅ Quote Approved' },
      quote_rejected: { color: 'red', text: '❌ Quote Rejected' },
      in_progress: { color: 'purple', text: '🔧 In Progress' },
      completed: { color: 'green', text: '✅ Completed' }
    };
    
    const config = statusConfig[status] || { color: 'gray', text: status };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="quote-management-container">
      <h2>Service Provider Dashboard</h2>
      
      {/* Statistics */}
      {dashboard && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="stat-number">{dashboard.statistics.total_assigned_orders}</div>
          </div>
          <div className="stat-card">
            <h3>Need Quotes</h3>
            <div className="stat-number urgent">{dashboard.statistics.orders_needing_quotes}</div>
          </div>
          <div className="stat-card">
            <h3>Pending Approval</h3>
            <div className="stat-number">{dashboard.statistics.pending_quotes}</div>
          </div>
          <div className="stat-card">
            <h3>Approved</h3>
            <div className="stat-number approved">{dashboard.statistics.approved_quotes}</div>
          </div>
        </div>
      )}

      {/* Orders Needing Quotes */}
      {dashboard?.orders_needing_quotes?.length > 0 && (
        <div className="orders-section">
          <h3>🚨 Orders Requiring Quotes ({dashboard.orders_needing_quotes.length})</h3>
          <div className="orders-grid">
            {dashboard.orders_needing_quotes.map(order => (
              <div key={order.id} className="order-card urgent">
                <div className="order-header">
                  <h4>{order.service_type}</h4>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="order-details">
                  <p><strong>Client:</strong> {order.client_name}</p>
                  <p><strong>Date:</strong> {order.scheduled_date}</p>
                  <p><strong>Time:</strong> {order.scheduled_time_slot}</p>
                  <p><strong>Address:</strong> {order.address}</p>
                  <p><strong>Description:</strong> {order.description}</p>
                </div>
                
                <div className="order-actions">
                  <button 
                    className="quote-btn"
                    onClick={() => handleCreateQuote(order.id)}
                  >
                    📝 Create Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders with Pending Quotes */}
      {dashboard?.orders_with_pending_quotes?.length > 0 && (
        <div className="orders-section">
          <h3>⏳ Quotes Awaiting Approval ({dashboard.orders_with_pending_quotes.length})</h3>
          <div className="orders-grid">
            {dashboard.orders_with_pending_quotes.map(order => (
              <div key={order.id} className="order-card pending">
                <div className="order-header">
                  <h4>{order.service_type}</h4>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="order-details">
                  <p><strong>Client:</strong> {order.client_name}</p>
                  <p><strong>Quoted Price:</strong> KSh {order.latest_quote?.quoted_price}</p>
                  <p><strong>Submitted:</strong> {new Date(order.latest_quote?.submitted_at).toLocaleDateString()}</p>
                </div>
                
                <div className="quote-info">
                  <p><strong>Quote Description:</strong></p>
                  <p>{order.latest_quote?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Orders */}
      {dashboard?.approved_orders?.length > 0 && (
        <div className="orders-section">
          <h3>✅ Ready to Start ({dashboard.approved_orders.length})</h3>
          <div className="orders-grid">
            {dashboard.approved_orders.map(order => (
              <div key={order.id} className="order-card approved">
                <div className="order-header">
                  <h4>{order.service_type}</h4>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="order-details">
                  <p><strong>Client:</strong> {order.client_name}</p>
                  <p><strong>Approved Price:</strong> KSh {order.approved_service_price}</p>
                  <p><strong>Date:</strong> {order.scheduled_date}</p>
                  <p><strong>Time:</strong> {order.scheduled_time_slot}</p>
                </div>
                
                <div className="order-actions">
                  <button className="start-btn">
                    🚀 Start Work
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <div className="modal-overlay">
          <div className="quote-form-modal">
            <div className="modal-header">
              <h3>Create Quote</h3>
              <button 
                className="close-btn"
                onClick={() => setShowQuoteForm(false)}
              >
                ×
              </button>
            </div>
            
            {selectedOrder && (
              <div className="order-summary">
                <h4>Order Details</h4>
                <p><strong>Service:</strong> {selectedOrder.service_type}</p>
                <p><strong>Description:</strong> {selectedOrder.description}</p>
                <p><strong>Address:</strong> {selectedOrder.address}</p>
                <p><strong>Date:</strong> {selectedOrder.scheduled_date}</p>
                <p><strong>Time:</strong> {selectedOrder.scheduled_time_slot}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmitQuote} className="quote-form">
              <div className="form-group">
                <label>Quoted Price (KSh) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={quoteForm.quoted_price}
                  onChange={(e) => setQuoteForm({...quoteForm, quoted_price: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Work Description *</label>
                <textarea
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                  placeholder="Detailed description of work to be performed..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Estimated Duration *</label>
                <input
                  type="text"
                  value={quoteForm.estimated_duration}
                  onChange={(e) => setQuoteForm({...quoteForm, estimated_duration: e.target.value})}
                  placeholder="e.g., 2-3 hours, 1 day, etc."
                  required
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quoteForm.materials_included}
                    onChange={(e) => setQuoteForm({...quoteForm, materials_included: e.target.checked})}
                  />
                  Materials included in price
                </label>
              </div>
              
              {quoteForm.materials_included && (
                <div className="form-group">
                  <label>Materials List</label>
                  <textarea
                    value={quoteForm.materials_list}
                    onChange={(e) => setQuoteForm({...quoteForm, materials_list: e.target.value})}
                    placeholder="List of materials that will be provided..."
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Warranty Period</label>
                <input
                  type="text"
                  value={quoteForm.warranty_period}
                  onChange={(e) => setQuoteForm({...quoteForm, warranty_period: e.target.value})}
                  placeholder="e.g., 6 months, 1 year"
                />
              </div>
              
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={quoteForm.additional_notes}
                  onChange={(e) => setQuoteForm({...quoteForm, additional_notes: e.target.value})}
                  placeholder="Any additional terms or conditions..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowQuoteForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteManagement;