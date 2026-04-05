import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import './AssistantList.css';

const AssistantList = () => {
  const [assistants, setAssistants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    verification_status: '',
    user_role: '',
    service_type: '',
    search: ''
  });

  useEffect(() => {
    fetchAssistants();
    fetchStats();
  }, [filters]);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/accounts/user/list/?${params}`);
      setAssistants(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/accounts/assistants/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'green', text: '✅ Verified' },
      pending: { color: 'orange', text: '⏳ Pending' },
      rejected: { color: 'red', text: '❌ Rejected' },
      not_submitted: { color: 'gray', text: '⚪ Not Submitted' }
    };
    
    const config = statusConfig[status] || statusConfig.not_submitted;
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role, serviceType) => {
    if (role === 'rider') {
      return <span className="role-badge rider">🏍️ Rider</span>;
    } else if (role === 'service_provider') {
      return (
        <span className="role-badge service-provider">
          🔧 {serviceType || 'Service Provider'}
        </span>
      );
    }
    return <span className="role-badge unknown">❓ Unknown</span>;
  };

  return (
    <div className="assistant-list-container">
      <h2>Assistant Management</h2>
      
      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <h3>Total Assistants</h3>
            <div className="stat-number">{stats.total_assistants}</div>
          </div>
          <div className="stat-card">
            <h3>Verified</h3>
            <div className="stat-number verified">{stats.verification_status.verified}</div>
          </div>
          <div className="stat-card">
            <h3>Riders</h3>
            <div className="stat-number">{stats.roles.riders}</div>
          </div>
          <div className="stat-card">
            <h3>Service Providers</h3>
            <div className="stat-number">{stats.roles.service_providers}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Verification Status:</label>
            <select 
              value={filters.verification_status} 
              onChange={(e) => handleFilterChange('verification_status', e.target.value)}
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Assistant Type:</label>
            <select 
              value={filters.user_role} 
              onChange={(e) => handleFilterChange('user_role', e.target.value)}
            >
              <option value="">All</option>
              <option value="rider">Riders</option>
              <option value="service_provider">Service Providers</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Service Type:</label>
            <input
              type="text"
              placeholder="e.g., plumbing, electrical"
              value={filters.service_type}
              onChange={(e) => handleFilterChange('service_type', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="quick-filters">
          <button 
            className="quick-filter-btn"
            onClick={() => setFilters({
              verification_status: 'verified',
              user_role: 'rider',
              service_type: '',
              search: ''
            })}
          >
            🏍️ Verified Riders
          </button>
          <button 
            className="quick-filter-btn"
            onClick={() => setFilters({
              verification_status: 'verified',
              user_role: 'service_provider',
              service_type: '',
              search: ''
            })}
          >
            🔧 Verified Service Providers
          </button>
          <button 
            className="quick-filter-btn"
            onClick={() => setFilters({
              verification_status: 'pending',
              user_role: '',
              service_type: '',
              search: ''
            })}
          >
            ⏳ Pending Verification
          </button>
        </div>
      </div>

      {/* Assistant List */}
      <div className="assistants-section">
        <h3>Assistants ({assistants.length})</h3>
        
        {loading ? (
          <div className="loading">Loading assistants...</div>
        ) : (
          <div className="assistants-grid">
            {assistants.map(assistant => (
              <div key={assistant.id} className="assistant-card">
                <div className="assistant-header">
                  <h4>{assistant.full_name_from_verification || `${assistant.first_name} ${assistant.last_name}`}</h4>
                  {getStatusBadge(assistant.verification_status)}
                </div>
                
                <div className="assistant-details">
                  {getRoleBadge(assistant.user_role, assistant.service_type)}
                  
                  <div className="detail-row">
                    <span className="label">Area:</span>
                    <span>{assistant.area_of_operation || 'Not specified'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Experience:</span>
                    <span>{assistant.years_of_experience || 'Not specified'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span>{assistant.phone_number}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span>{assistant.email}</span>
                  </div>
                  
                  {assistant.verification_details && (
                    <div className="verification-info">
                      <small>
                        ID: {assistant.verification_details.id_number}
                        {assistant.verification_details.driving_license_number && (
                          <> | License: {assistant.verification_details.driving_license_number}</>
                        )}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="assistant-actions">
                  <button className="assign-btn">Assign Task</button>
                  <button className="view-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && assistants.length === 0 && (
          <div className="no-results">
            No assistants found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantList;