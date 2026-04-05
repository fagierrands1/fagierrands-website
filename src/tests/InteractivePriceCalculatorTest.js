// Interactive Price Calculator Test Component
import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaShoppingCart, FaCalculator, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import PriceCalculator from '../components/Common/PriceCalculator';
import { calculateCommission } from '../utils/commissionCalculator';

const InteractivePriceCalculatorTest = () => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [items, setItems] = useState([]);
  const [orderTypeId, setOrderTypeId] = useState(1);
  const [testScenarios, setTestScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [customLocation, setCustomLocation] = useState({ latitude: '', longitude: '', name: '' });
  const [showCustomLocationForm, setShowCustomLocationForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: 1 });
  const [showItemForm, setShowItemForm] = useState(false);

  // Predefined test locations
  const predefinedLocations = [
    { name: 'Nairobi CBD - KICC', latitude: -1.2921, longitude: 36.8219 },
    { name: 'Nairobi CBD - City Hall', latitude: -1.2865, longitude: 36.8235 },
    { name: 'Westlands', latitude: -1.2676, longitude: 36.8108 },
    { name: 'Karen', latitude: -1.3197, longitude: 36.6859 },
    { name: 'Eastleigh', latitude: -1.2741, longitude: 36.8441 },
    { name: 'Kasarani', latitude: -1.2258, longitude: 36.8986 },
    { name: 'Embakasi', latitude: -1.3167, longitude: 36.8833 },
    { name: 'Ngong Road', latitude: -1.3032, longitude: 36.7827 },
    { name: 'Thika Road - Roysambu', latitude: -1.2167, longitude: 36.8833 },
    { name: 'Mombasa Road - South B', latitude: -1.3167, longitude: 36.8333 }
  ];

  // Predefined test scenarios
  const predefinedScenarios = [
    {
      name: 'CBD to CBD Delivery',
      pickup: { name: 'Nairobi CBD - KICC', latitude: -1.2921, longitude: 36.8219 },
      delivery: { name: 'Nairobi CBD - City Hall', latitude: -1.2865, longitude: 36.8235 },
      items: [{ name: 'Documents', price: 0, quantity: 1 }],
      orderTypeId: 2,
      description: 'Short distance delivery within CBD'
    },
    {
      name: 'Shopping Trip - Westlands',
      pickup: { name: 'Westlands Mall', latitude: -1.2676, longitude: 36.8108 },
      delivery: { name: 'Karen', latitude: -1.3197, longitude: 36.6859 },
      items: [
        { name: 'Groceries', price: 2500, quantity: 1 },
        { name: 'Electronics', price: 15000, quantity: 1 },
        { name: 'Clothing', price: 3500, quantity: 2 }
      ],
      orderTypeId: 1,
      description: 'Shopping with multiple items'
    },
    {
      name: 'Long Distance Delivery',
      pickup: { name: 'Nairobi CBD', latitude: -1.2921, longitude: 36.8219 },
      delivery: { name: 'Kasarani', latitude: -1.2258, longitude: 36.8986 },
      items: [{ name: 'Package', price: 500, quantity: 1 }],
      orderTypeId: 2,
      description: 'Long distance delivery test'
    },
    {
      name: 'High Value Items',
      pickup: { name: 'Westlands', latitude: -1.2676, longitude: 36.8108 },
      delivery: { name: 'Karen', latitude: -1.3197, longitude: 36.6859 },
      items: [
        { name: 'Laptop', price: 80000, quantity: 1 },
        { name: 'Phone', price: 45000, quantity: 1 }
      ],
      orderTypeId: 1,
      description: 'High value items test'
    },
    {
      name: 'Multiple Small Items',
      pickup: { name: 'Eastleigh', latitude: -1.2741, longitude: 36.8441 },
      delivery: { name: 'Embakasi', latitude: -1.3167, longitude: 36.8833 },
      items: [
        { name: 'Item 1', price: 50, quantity: 5 },
        { name: 'Item 2', price: 25, quantity: 10 },
        { name: 'Item 3', price: 75, quantity: 3 }
      ],
      orderTypeId: 1,
      description: 'Multiple small items with quantities'
    }
  ];

  useEffect(() => {
    setTestScenarios(predefinedScenarios);
  }, []);

  // Load a test scenario
  const loadScenario = (scenario) => {
    setPickupLocation(scenario.pickup);
    setDeliveryLocation(scenario.delivery);
    setItems(scenario.items);
    setOrderTypeId(scenario.orderTypeId);
    setSelectedScenario(scenario);
  };

  // Clear all data
  const clearAll = () => {
    setPickupLocation(null);
    setDeliveryLocation(null);
    setItems([]);
    setSelectedScenario(null);
  };

  // Handle location selection
  const handleLocationSelect = (location, type) => {
    if (type === 'pickup') {
      setPickupLocation(location);
    } else {
      setDeliveryLocation(location);
    }
  };

  // Add custom location
  const addCustomLocation = () => {
    if (customLocation.latitude && customLocation.longitude && customLocation.name) {
      const location = {
        name: customLocation.name,
        latitude: parseFloat(customLocation.latitude),
        longitude: parseFloat(customLocation.longitude)
      };
      
      // Add to predefined locations for this session
      predefinedLocations.push(location);
      
      setCustomLocation({ latitude: '', longitude: '', name: '' });
      setShowCustomLocationForm(false);
    }
  };

  // Add item
  const addItem = () => {
    if (newItem.name && newItem.price) {
      const item = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        quantity: parseInt(newItem.quantity) || 1
      };
      
      setItems([...items, item]);
      setNewItem({ name: '', price: '', quantity: 1 });
      setShowItemForm(false);
    }
  };

  // Remove item
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : field === 'quantity' ? parseInt(value) || 1 : value
    };
    setItems(updatedItems);
  };

  // Calculate total items price
  const getTotalItemsPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get commission info if we have valid locations and price
  const getCommissionInfo = () => {
    if (!pickupLocation || !deliveryLocation) return null;
    
    const totalItemsPrice = getTotalItemsPrice();
    const estimatedTotal = 500 + totalItemsPrice; // Base price + items
    
    return calculateCommission(estimatedTotal, pickupLocation, deliveryLocation);
  };

  const commissionInfo = getCommissionInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaCalculator className="mr-3 text-blue-600" />
              Interactive Price Calculator Test
            </h1>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Test Scenarios */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Test Scenarios</h2>
                <div className="space-y-2">
                  {testScenarios.map((scenario, index) => (
                    <button
                      key={index}
                      onClick={() => loadScenario(scenario)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedScenario?.name === scenario.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{scenario.name}</div>
                      <div className="text-sm text-gray-600">{scenario.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Locations</h3>
                
                {/* Pickup Location */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <select
                    value={pickupLocation ? `${pickupLocation.latitude},${pickupLocation.longitude}` : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [lat, lng] = e.target.value.split(',');
                        const location = predefinedLocations.find(
                          loc => loc.latitude === parseFloat(lat) && loc.longitude === parseFloat(lng)
                        );
                        handleLocationSelect(location, 'pickup');
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select pickup location</option>
                    {predefinedLocations.map((location, index) => (
                      <option key={index} value={`${location.latitude},${location.longitude}`}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {pickupLocation && (
                    <div className="mt-1 text-xs text-gray-600">
                      {pickupLocation.name} ({pickupLocation.latitude.toFixed(4)}, {pickupLocation.longitude.toFixed(4)})
                    </div>
                  )}
                </div>

                {/* Delivery Location */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Location
                  </label>
                  <select
                    value={deliveryLocation ? `${deliveryLocation.latitude},${deliveryLocation.longitude}` : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [lat, lng] = e.target.value.split(',');
                        const location = predefinedLocations.find(
                          loc => loc.latitude === parseFloat(lat) && loc.longitude === parseFloat(lng)
                        );
                        handleLocationSelect(location, 'delivery');
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select delivery location</option>
                    {predefinedLocations.map((location, index) => (
                      <option key={index} value={`${location.latitude},${location.longitude}`}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {deliveryLocation && (
                    <div className="mt-1 text-xs text-gray-600">
                      {deliveryLocation.name} ({deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)})
                    </div>
                  )}
                </div>

                {/* Custom Location Form */}
                {showCustomLocationForm ? (
                  <div className="border border-gray-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium mb-2">Add Custom Location</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Location name"
                        value={customLocation.name}
                        onChange={(e) => setCustomLocation({...customLocation, name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={customLocation.latitude}
                        onChange={(e) => setCustomLocation({...customLocation, latitude: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={customLocation.longitude}
                        onChange={(e) => setCustomLocation({...customLocation, longitude: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={addCustomLocation}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowCustomLocationForm(false)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomLocationForm(true)}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                  >
                    <FaMapMarkerAlt className="inline mr-2" />
                    Add Custom Location
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column - Items */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Items</h3>
                  <button
                    onClick={() => setShowItemForm(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaPlus className="inline mr-1" />
                    Add Item
                  </button>
                </div>

                {/* Add Item Form */}
                {showItemForm && (
                  <div className="border border-gray-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium mb-2">Add New Item</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price (KES)"
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={addItem}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowItemForm(false)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">
                      <FaShoppingCart className="mx-auto mb-2 text-2xl" />
                      No items added
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            className="font-medium bg-transparent border-none outline-none flex-1"
                          />
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Price (KES)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Subtotal: KES {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between font-semibold">
                      <span>Total Items Value:</span>
                      <span>KES {getTotalItemsPrice().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Type */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Order Type</h3>
                <select
                  value={orderTypeId}
                  onChange={(e) => setOrderTypeId(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={1}>Shopping</option>
                  <option value={2}>Pickup & Delivery</option>
                  <option value={3}>Cargo Delivery</option>
                  <option value={4}>Banking</option>
                  <option value={5}>Home Maintenance</option>
                </select>
              </div>
            </div>

            {/* Right Column - Price Calculator & Results */}
            <div className="space-y-6">
              {/* Price Calculator */}
              {pickupLocation && deliveryLocation && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Price Calculation</h3>
                  <PriceCalculator
                    pickupLocation={pickupLocation}
                    deliveryLocation={deliveryLocation}
                    orderTypeId={orderTypeId}
                    items={items}
                  />
                </div>
              )}

              {/* Commission Information */}
              {commissionInfo && !commissionInfo.error && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service Type:</span>
                      <span className="font-medium">{commissionInfo.serviceDescription}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company Commission ({commissionInfo.companyPercentage}%):</span>
                      <span className="font-medium">KES {commissionInfo.companyCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assistant Earnings ({commissionInfo.assistantPercentage}%):</span>
                      <span className="font-medium">KES {commissionInfo.assistantEarnings.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between font-semibold">
                        <span>Estimated Total:</span>
                        <span>KES {commissionInfo.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Test Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. Select a test scenario or manually configure locations</li>
                  <li>2. Add items with prices and quantities</li>
                  <li>3. Choose the appropriate order type</li>
                  <li>4. Review the price calculation and commission breakdown</li>
                  <li>5. Test different scenarios to validate calculations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePriceCalculatorTest;