// src/services/paymentService.js
import axios from '../utils/axiosConfig';

/**
 * Payment service for handling payment-related API calls
 */
class PaymentService {
  constructor() {
    this.baseURL = '/api/payments';
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Initiate payment with IntaSend
   */
  async initiatePayment(paymentData) {
    try {
      const response = await axios.post(`${this.baseURL}/initiate/`, paymentData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to initiate payment');
    }
  }

  /**
   * Verify payment status with IntaSend
   */
  async verifyPayment(verificationData) {
    try {
      const response = await axios.post(`${this.baseURL}/verify/`, verificationData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Payment verification failed');
    }
  }

  /**
   * Check payment status for an order
   */
  async checkPaymentStatus(orderId) {
    try {
      const response = await axios.get(`/api/orders/${orderId}/payment-status/`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check payment status');
    }
  }

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(orderId, statusData) {
    try {
      const response = await axios.patch(`/api/orders/${orderId}/payment-status/`, statusData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update payment status');
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${this.baseURL}/history/${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch payment history');
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderId, refundData) {
    try {
      const response = await axios.post(`${this.baseURL}/refund/`, {
        order_id: orderId,
        ...refundData
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process refund');
    }
  }

  /**
   * Handle webhook data (for testing purposes)
   */
  async processWebhookData(webhookData) {
    try {
      const response = await axios.post(`${this.baseURL}/webhook/test/`, webhookData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process webhook data');
    }
  }

  /**
   * Get payment methods available
   */
  async getPaymentMethods() {
    try {
      const response = await axios.get(`${this.baseURL}/methods/`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch payment methods');
    }
  }

  /**
   * Validate payment amount and currency
   */
  validatePaymentData(paymentData) {
    const errors = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!paymentData.currency) {
      errors.push('Currency is required');
    }

    if (!paymentData.order_id) {
      errors.push('Order ID is required');
    }

    if (!paymentData.customer_email) {
      errors.push('Customer email is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format payment amount for display
   */
  formatAmount(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get payment status display info
   */
  getPaymentStatusInfo(status) {
    const statusMap = {
      'pending': {
        label: 'Pending',
        color: 'yellow',
        description: 'Payment is being processed'
      },
      'processing': {
        label: 'Processing',
        color: 'blue',
        description: 'Payment is being verified'
      },
      'paid': {
        label: 'Paid',
        color: 'green',
        description: 'Payment completed successfully'
      },
      'failed': {
        label: 'Failed',
        color: 'red',
        description: 'Payment failed'
      },
      'cancelled': {
        label: 'Cancelled',
        color: 'gray',
        description: 'Payment was cancelled'
      },
      'refunded': {
        label: 'Refunded',
        color: 'purple',
        description: 'Payment has been refunded'
      }
    };

    return statusMap[status] || {
      label: status,
      color: 'gray',
      description: 'Unknown payment status'
    };
  }

  /**
   * Handle API errors consistently
   */
  handleError(error, defaultMessage) {
    const message = error.response?.data?.message || 
                   error.response?.data?.detail || 
                   error.message || 
                   defaultMessage;
    
    console.error('Payment Service Error:', {
      message,
      status: error.response?.status,
      data: error.response?.data
    });

    return new Error(message);
  }
}

// Create singleton instance
const paymentService = new PaymentService();

// Export individual methods for convenience
export const {
  initiatePayment,
  verifyPayment,
  checkPaymentStatus,
  updatePaymentStatus,
  getPaymentHistory,
  processRefund,
  processWebhookData,
  getPaymentMethods,
  validatePaymentData,
  formatAmount,
  getPaymentStatusInfo
} = paymentService;

export default paymentService;