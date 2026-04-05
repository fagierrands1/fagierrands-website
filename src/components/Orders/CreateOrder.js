import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig'; // Add axios import
import { supabase } from '../../services/supabaseClient';
import Header from '../Common/Header';
import MapComponent from '../Common/MapComponent';

// Set up axios defaults
 // Backend URL
axios.defaults.headers.common['Content-Type'] = 'application/json';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [orderTypes, setOrderTypes] = useState([]);
  const [formData, setFormData] = useState({
    service_type: 'Shop',
    delivery_address: '',
    items: [],
    payment_method: 'Cash',
    notes: '',
    pickup_location: null,
    delivery_location: null
  });
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      
      // Set auth token for axios
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      }
    };
    
    checkAuth();
    fetchOrderTypes();
  }, [navigate]);

  // Fetch order types from API
  const fetchOrderTypes = async () => {
    try {
      const response = await axios.get(`/orders/types/`);
      setOrderTypes(response.data);
    } catch (error) {
      console.error('Error fetching order types:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const addItem = () => {
    if (!currentItem.name) return;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem, id: Date.now() }]
    }));
    
    setCurrentItem({
      name: '',
      quantity: 1,
      price: 0
    });
  };

  const removeItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleLocationSelect = (type, location) => {
    setFormData(prev => ({
      ...prev,
      [type]: location
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item to your order');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format data according to API expectations
      let apiEndpoint = '';
      let orderData = {};
      
      // Determine which API endpoint to use based on service type
      switch(formData.service_type) {
        case 'Shop':
          apiEndpoint = `/orders/shopping/`;
          orderData = {
            order_type: formData.service_type === 'Shop' ? 1 : 2, // Adjust ID based on your order types
            title: 'Shopping Order',
            description: formData.notes,
            delivery_address: formData.delivery_address,
            delivery_latitude: formData.delivery_location?.lat,
            delivery_longitude: formData.delivery_location?.lng,
            items: formData.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            payment_method: formData.payment_method
          };
          break;
          
        case 'PickUp':
          apiEndpoint = `/orders/pickup-delivery/`;
          orderData = {
            order_type_id: 2, // Adjust ID based on your order types
            title: 'Pickup & Delivery',
            additional_description: formData.notes,
            pickup_address: 'Pickup location',
            delivery_address: formData.delivery_address,
            pickup_latitude: formData.pickup_location?.lat,
            pickup_longitude: formData.pickup_location?.lng,
            delivery_latitude: formData.delivery_location?.lat,
            delivery_longitude: formData.delivery_location?.lng,
            items: formData.items.map(item => ({
              name: item.name,
              description: '',
              quantity: item.quantity
            }))
          };
          break;
          
        case 'Cargo':
          apiEndpoint = `/orders/cargo-delivery/`;
          orderData = {
            order_type_id: 3, // Adjust ID based on your order types
            cargoName: 'Cargo Delivery',
            cargoDescription: formData.notes,
            pickup_address: 'Pickup address',
            delivery_address: formData.delivery_address,
            pickup_latitude: formData.pickup_location?.lat,
            pickup_longitude: formData.pickup_location?.lng,
            delivery_latitude: formData.delivery_location?.lat,
            delivery_longitude: formData.delivery_location?.lng,
            cargoWeight: parseFloat(formData.items[0]?.quantity || 0),
            cargoSize: formData.items[0]?.name || 'Medium',
            needHelpers: formData.notes.includes('helper'),
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '12:00'
          };
          break;
          
        default:
          // For other service types, use the default endpoint
          apiEndpoint = `/orders/`;
          orderData = {
            order_type: formData.service_type,
            title: `${formData.service_type} Order`,
            description: formData.notes,
            status: 'pending',
            total_amount: calculateTotal()
          };
      }
      
      // Send the order to the API
      const response = await axios.post(apiEndpoint, orderData);
      
      console.log('Order created successfully:', response.data);
      
      // Navigate to order details
      if (response.data.order_id) {
        navigate(`/orders/${response.data.order_id}`);
      } else {
        navigate('/orders');
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'There was an error creating your order. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
    
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Service Type</label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  >
                    {orderTypes.length > 0 ? (
                      orderTypes.map(type => (
                        <option key={type.id} value={type.name}>
                          {type.name} ({type.description})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Shop">Shop (Groceries & Essentials)</option>
                        <option value="PickUp">PickUp & Delivery</option>
                        <option value="Cargo">Cargo Delivery</option>
                        <option value="Handyman">Handyman Services</option>
                        <option value="Banking">Banking & Finance</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Delivery Address</label>
                  <input
                    type="text"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="Enter delivery address"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Mobile">Mobile Money</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="Add any special instructions or notes"
                    rows="3"
                  ></textarea>
                </div>
                
                {['PickUp', 'Cargo'].includes(formData.service_type) && (
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Location</label>
                    <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <MapComponent 
                        onPickupLocationSelect={(location) => handleLocationSelect('pickup_location', location)}
                        onDeliveryLocationSelect={(location) => handleLocationSelect('delivery_location', location)}
                      />
                    </div>
                    {(!formData.pickup_location || !formData.delivery_location) && (
                      <p className="text-sm text-red-500 mt-2">Please select pickup and delivery locations on the map</p>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-700">Order Items</label>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Item Name</label>
                        <input
                          type="text"
                          name="name"
                          value={currentItem.name}
                          onChange={handleItemChange}
                          className="w-full border border-gray-300 rounded p-2"
                          placeholder="Item name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          name="quantity"
                          value={currentItem.quantity}
                          onChange={handleItemChange}
                          className="w-full border border-gray-300 rounded p-2"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Price (KES)</label>
                        <input
                          type="number"
                          name="price"
                          value={currentItem.price}
                          onChange={handleItemChange}
                          className="w-full border border-gray-300 rounded p-2"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItem}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition duration-200"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {formData.items.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No items added yet
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">{item.name}</td>
                              <td className="px-4 py-3">{item.quantity}</td>
                              <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                              <td className="px-4 py-3">${(item.quantity * item.price).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-medium">Total:</td>
                            <td className="px-4 py-3 font-bold">KES {calculateTotal().toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                disabled={loading || formData.items.length === 0 || (
                  ['PickUp', 'Cargo'].includes(formData.service_type) && 
                  (!formData.pickup_location || !formData.delivery_location)
                )}
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;

