import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import Header from '../Common/Header';

const ShoppingOrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderTypes, setOrderTypes] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    order_type: '',
    title: 'Shopping Order',
    description: '',
    delivery_address: '',
    delivery_latitude: null,
    delivery_longitude: null,
    contact_name: '',
    contact_phone: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  useEffect(() => {
    // Fetch order types when component mounts
    const fetchOrderTypes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/orders/types/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter order types for shopping if needed
        const shoppingTypes = response.data.filter(type => 
          type.name.toLowerCase().includes('shopping') || type.category === 'shopping'
        );
        
        setOrderTypes(shoppingTypes.length > 0 ? shoppingTypes : response.data);
        
        // Set default order type if available
        if (shoppingTypes.length > 0) {
          setFormData(prev => ({ ...prev, order_type: shoppingTypes[0].id }));
        } else if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, order_type: response.data[0].id }));
        }
      } catch (err) {
        console.error('Error fetching order types:', err);
        setError('Failed to load order types');
      }
    };
    
    fetchOrderTypes();
    
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            delivery_latitude: position.coords.latitude,
            delivery_longitude: position.coords.longitude
          }));
        },
        (err) => console.log('Geolocation error:', err)
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'quantity' || field === 'price' 
      ? parseFloat(value) || 0 
      : value;
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return; // Keep at least one item
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => 
      total + (item.quantity * item.price), 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in');
      }
      
      // Create the order
      const response = await axios.post(
        '/orders/shopping/',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success message
      alert('Order created successfully!');
      
      // Redirect to orders page or order details
      navigate('/orders');
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Shopping Order</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Order Type</label>
                <select 
                  name="order_type"
                  value={formData.order_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Order Type</option>
                  {orderTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Delivery Address</label>
              <input 
                type="text"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Contact Name</label>
                <input 
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Contact Phone</label>
                <input 
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Shopping Items</h3>
            
            {formData.items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-gray-700 mb-1">Item Name</label>
                    <input 
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">Quantity</label>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">Price</label>
                    <input 
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                {formData.items.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove Item
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center mb-6">
              <button 
                type="button"
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Add Another Item
              </button>
              
              <div className="text-xl">
                <span className="font-medium">Total:</span> KES {Number(calculateTotal()).toFixed(2)}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded text-lg"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShoppingOrderForm;

