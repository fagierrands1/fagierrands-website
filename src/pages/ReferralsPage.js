import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Common/Header';
import config from '../config';
import { FaGift, FaClipboard, FaClipboardCheck, FaShareAlt, FaUsers } from 'react-icons/fa';
import './ReferralsPage.css';

const API_BASE_URL = config.API_BASE_URL;

const ReferralsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    earnedCredits: 0,
    availableCredits: 0
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        // Fetch referral data
        const referralResponse = await axios.get(`/orders/referrals/`, config);
        
        if (referralResponse.data) {
          console.log("Referral data received:", referralResponse.data);
          setReferralCode(referralResponse.data.referral_code || '');
          setReferralStats({
            totalReferrals: referralResponse.data.total_referrals || 0,
            pendingReferrals: referralResponse.data.pending_referrals || 0,
            completedReferrals: referralResponse.data.completed_referrals || 0,
            earnedCredits: referralResponse.data.earned_credits || 0,
            availableCredits: referralResponse.data.available_credits || 0
          });
          
          // If the API returns referral history
          if (referralResponse.data.history && Array.isArray(referralResponse.data.history)) {
            setReferralHistory(referralResponse.data.history);
          }
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError('Failed to load referral data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralData();
  }, [navigate]);
  
  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode)
        .then(() => {
          setReferralCopied(true);
          setTimeout(() => setReferralCopied(false), 3000); // Reset after 3 seconds
        })
        .catch(err => {
          console.error('Failed to copy referral code:', err);
        });
    }
  };
  
  // Share referral code
  const shareReferralCode = async () => {
    if (navigator.share && referralCode) {
      try {
        await navigator.share({
          title: 'Join Fagi Errands',
          text: `Use my referral code ${referralCode} to sign up for Fagi Errands! We'll both earn rewards when you join.`,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      copyReferralCode();
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div>
       
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
       
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="referrals-page">
     
      
      <div className="referrals-container">
        <div className="page-header">
          <h1 className="page-title">
            <FaGift className="header-icon" />
            Referral Program
          </h1>
          <p className="page-subtitle">
            Invite friends to Fagi Errands and earn 2 points for each person who signs up with your code!
          </p>
        </div>
        
        <div className="referral-card main-card">
          <div className="referral-header">
            <h2>Your Referral Code</h2>
            <div className="referral-code-container">
              <span className="referral-code">{referralCode || 'ERRANDS123'}</span>
              <button 
                onClick={copyReferralCode}
                className="copy-button"
                disabled={!referralCode}
              >
                {referralCopied ? <FaClipboardCheck /> : <FaClipboard />}
                {referralCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="referral-instruction">
              Share this code with friends and earn 2 points for each person who signs up using your code!
            </p>
            <button 
              className="share-button"
              onClick={shareReferralCode}
            >
              <FaShareAlt className="share-icon" />
              Share Your Code
            </button>
          </div>
        </div>
        
        <div className="stats-section">
          <h2 className="section-title">
            <FaUsers className="section-icon" />
            Your Referral Stats
          </h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{referralStats.totalReferrals}</div>
              <div className="stat-label">Total Referrals</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{referralStats.pendingReferrals}</div>
              <div className="stat-label">Pending</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{referralStats.completedReferrals}</div>
              <div className="stat-label">Completed</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{referralStats.earnedCredits}</div>
              <div className="stat-label">Earned Points</div>
            </div>
            
            <div className="stat-card highlight">
              <div className="stat-value">{referralStats.availableCredits}</div>
              <div className="stat-label">Available Points</div>
            </div>
          </div>
        </div>
        
        {referralHistory.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">Referral History</h2>
            
            <div className="table-container">
              <table className="referral-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {referralHistory.map((referral, index) => (
                    <tr key={referral.id || index}>
                      <td>{referral.referred_user || 'Anonymous'}</td>
                      <td>{formatDate(referral.date)}</td>
                      <td>
                        <span className={`status-badge ${referral.status.toLowerCase()}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td>{referral.points || 2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Share Your Code</h3>
              <p className="step-description">
                Share your unique referral code with friends and family.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">Friends Sign Up</h3>
              <p className="step-description">
                They sign up using your referral code when creating their account.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Earn Points</h3>
              <p className="step-description">
                You earn 2 points for each friend who signs up using your code.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h3 className="step-title">Use Your Points</h3>
              <p className="step-description">
                Redeem your earned points for discounts on future orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
