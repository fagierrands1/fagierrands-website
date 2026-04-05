# Payment Status Issue Analysis & Solutions

## 🚨 **Problem: Payment Status Stuck on "Processing"**

Payment statuses remain "processing" even after IntaSend successfully receives payment. This is a common integration issue that affects user experience and business operations.

## 🔍 **Root Cause Analysis**

### **1. Missing Webhook Integration**
- **Issue**: No webhook endpoint to receive real-time payment notifications from IntaSend
- **Impact**: System doesn't know when payment is completed
- **Evidence**: Payment callback only handles frontend redirects, not backend status updates

### **2. Incomplete Payment Verification**
- **Issue**: Payment callback doesn't properly update order status in database
- **Impact**: Orders remain in "processing" state indefinitely
- **Evidence**: PaymentCallbackPage.js only verifies but may not update order status

### **3. Asynchronous Payment Processing**
- **Issue**: Frontend assumes immediate payment confirmation
- **Impact**: Status updates happen after user has left the page
- **Evidence**: No polling mechanism to check payment status updates

## 🛠️ **Solutions Implementation**

### **Solution 1: Implement IntaSend Webhook Handler**

Create a webhook endpoint to receive payment notifications:

```javascript
// src/services/paymentWebhookService.js
import axios from '../utils/axiosConfig';

export const handleIntaSendWebhook = async (webhookData) => {
  try {
    const { 
      invoice_id, 
      state, 
      charges, 
      net_amount,
      currency,
      value,
      account,
      api_ref
    } = webhookData;

    // Map IntaSend states to our order statuses
    const statusMapping = {
      'COMPLETE': 'paid',
      'PENDING': 'processing', 
      'FAILED': 'failed',
      'CANCELLED': 'cancelled'
    };

    const orderStatus = statusMapping[state] || 'processing';

    // Update order status in backend
    const response = await axios.post('/api/payments/webhook/intasend/', {
      invoice_id,
      payment_status: orderStatus,
      amount: net_amount || value,
      currency,
      transaction_ref: api_ref,
      raw_webhook_data: webhookData
    });

    return response.data;
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
};
```

### **Solution 2: Enhanced Payment Status Polling**

Add automatic status checking for pending payments:

```javascript
// src/hooks/usePaymentStatusPolling.js
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';

export const usePaymentStatusPolling = (orderId, initialStatus = 'processing') => {
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`/api/orders/${orderId}/payment-status/`);
      const newStatus = response.data.payment_status;
      
      setPaymentStatus(newStatus);
      
      // Stop polling if payment is complete or failed
      if (['paid', 'completed', 'failed', 'cancelled'].includes(newStatus)) {
        stopPolling();
      }
      
      return newStatus;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return paymentStatus;
    }
  };

  const startPolling = (intervalMs = 5000) => {
    if (intervalRef.current) return; // Already polling
    
    setIsPolling(true);
    intervalRef.current = setInterval(checkPaymentStatus, intervalMs);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  useEffect(() => {
    // Auto-start polling for processing payments
    if (['processing', 'pending'].includes(paymentStatus)) {
      startPolling();
    }

    return () => stopPolling();
  }, [orderId, paymentStatus]);

  return {
    paymentStatus,
    isPolling,
    checkPaymentStatus,
    startPolling,
    stopPolling
  };
};
```

### **Solution 3: Improved Payment Callback Handler**

Update the payment callback to properly handle status updates:

```javascript
// Enhanced PaymentCallbackPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePaymentStatusPolling } from '../hooks/usePaymentStatusPolling';
import axios from '../utils/axiosConfig';

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying payment status...');
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  // Use polling hook for real-time status updates
  const { paymentStatus, isPolling, checkPaymentStatus } = usePaymentStatusPolling(orderId);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const txRef = urlParams.get('tx_ref');
        const flwStatus = urlParams.get('status');
        const transactionId = urlParams.get('transaction_id');
        
        if (!txRef) {
          setStatus('failed');
          setMessage('Invalid payment reference. Please try again.');
          return;
        }
        
        // Enhanced verification with retry logic
        const token = localStorage.getItem('authToken');
        const response = await axios.post('/api/payments/verify/', {
          tx_ref: txRef,
          status: flwStatus,
          transaction_id: transactionId,
          provider: 'intasend'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setOrderId(response.data.order_id);
          setStatus('success');
          setMessage('Payment completed successfully!');
          
          // Update order status immediately
          await axios.patch(`/api/orders/${response.data.order_id}/`, {
            payment_status: 'paid',
            status: 'confirmed'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setTimeout(() => {
            navigate(`/orders/${response.data.order_id}`);
          }, 3000);
        } else {
          // Start polling for status updates
          setOrderId(response.data.order_id);
          setStatus('processing');
          setMessage('Payment is being processed. Please wait...');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Failed to verify payment.');
        setError(err);
      }
    };
    
    verifyPayment();
  }, [navigate]);

  // Update UI based on polling results
  useEffect(() => {
    if (paymentStatus === 'paid' || paymentStatus === 'completed') {
      setStatus('success');
      setMessage('Payment completed successfully!');
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
      setMessage('Payment failed. Please try again.');
    }
  }, [paymentStatus]);

  return (
    // ... existing JSX with enhanced status handling
  );
};
```

### **Solution 4: Backend API Endpoints**

Add necessary backend endpoints for payment status management:

```python
# Backend API endpoints needed (Django example)

# 1. Webhook endpoint
@api_view(['POST'])
def intasend_webhook(request):
    try:
        webhook_data = request.data
        
        # Verify webhook signature (security)
        if not verify_intasend_signature(request):
            return Response({'error': 'Invalid signature'}, status=400)
        
        # Process payment status update
        invoice_id = webhook_data.get('invoice_id')
        state = webhook_data.get('state')
        
        # Find order by invoice_id
        order = Order.objects.get(payment_reference=invoice_id)
        
        # Update payment status
        status_mapping = {
            'COMPLETE': 'paid',
            'PENDING': 'processing',
            'FAILED': 'failed',
            'CANCELLED': 'cancelled'
        }
        
        order.payment_status = status_mapping.get(state, 'processing')
        if state == 'COMPLETE':
            order.status = 'confirmed'
        
        order.save()
        
        return Response({'success': True})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# 2. Payment status check endpoint
@api_view(['GET'])
def check_payment_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        
        # Optionally verify with IntaSend API
        if order.payment_status == 'processing':
            intasend_status = verify_with_intasend(order.payment_reference)
            if intasend_status != order.payment_status:
                order.payment_status = intasend_status
                order.save()
        
        return Response({
            'payment_status': order.payment_status,
            'order_status': order.status,
            'last_updated': order.updated_at
        })
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
```

## 🔧 **Implementation Steps**

### **Step 1: Update Frontend Components**

1. **Add payment status polling to order components**
2. **Update PaymentCallbackPage with enhanced verification**
3. **Add real-time status updates to OrderDetails**

### **Step 2: Backend Integration**

1. **Create webhook endpoint for IntaSend**
2. **Add payment status verification API**
3. **Update order model to include payment_status field**

### **Step 3: IntaSend Configuration**

1. **Configure webhook URL in IntaSend dashboard**
2. **Set up proper webhook authentication**
3. **Test webhook delivery and processing**

## 📊 **Payment Status Flow**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   CLIENT    │    │   INTASEND   │    │   BACKEND   │
│   PAYMENT   │    │   GATEWAY    │    │   WEBHOOK   │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Initiate       │                   │
       │ Payment           │                   │
       ├──────────────────▶│                   │
       │                   │                   │
       │ 2. Payment        │ 3. Webhook        │
       │ Processing        │ Notification      │
       │                   ├──────────────────▶│
       │                   │                   │
       │                   │                   │ 4. Update
       │                   │                   │ Order Status
       │                   │                   │
       │ 5. Redirect       │                   │
       │ to Callback       │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │ 6. Poll Status    │                   │
       │ Updates           │                   │
       ├─────────────────────────────────────▶│
       │                   │                   │
       │ 7. Status         │                   │
       │ Confirmed         │                   │
       │◀─────────────────────────────────────│
```

## ✅ **Testing Checklist**

- [ ] Webhook endpoint receives IntaSend notifications
- [ ] Payment status updates correctly in database
- [ ] Frontend polling detects status changes
- [ ] Order status transitions properly (processing → paid → confirmed)
- [ ] Failed payments are handled correctly
- [ ] Timeout scenarios are managed
- [ ] Duplicate webhook handling is prevented

## 🚀 **Expected Results**

After implementation:
- ✅ Payment statuses update in real-time
- ✅ Users see immediate confirmation when payment completes
- ✅ No more stuck "processing" statuses
- ✅ Better user experience and trust
- ✅ Accurate business reporting and analytics

This comprehensive solution addresses the root causes of payment status issues and provides a robust, scalable payment processing system.