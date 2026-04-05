import React from 'react';
import { useParams } from 'react-router-dom';
import OrderDetails from '../components/Orders/OrdersDetails';

const OrdersDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <OrderDetails orderId={id} />
      </div>
    </div>
  );
};

export default OrdersDetailPage;
