// src/pages/CommissionDemo.js
import React, { useState } from 'react';
import CommissionCalculator from '../components/Common/CommissionCalculator';
import GoogleMapComponent from '../components/Common/GoogleMapComponent';
import { FaMoneyBillWave, FaMapMarkerAlt, FaCalculator } from 'react-icons/fa';
import { COMMISSION_RATES } from '../utils/commissionCalculator';

const CommissionDemo = () => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [totalPrice, setTotalPrice] = useState(1000);
  const [serviceType, setServiceType] = useState('standard');
  const [currentStep, setCurrentStep] = useState(1);

  const handlePickupLocationSelect = (location) => {
    setPickupLocation(location);
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleDeliveryLocationSelect = (location) => {
    setDeliveryLocation(location);
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const resetDemo = () => {
    setPickupLocation(null);
    setDeliveryLocation(null);
    setCurrentStep(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Commission Calculator Demo
        </h1>
        
        <p className="text-gray-600 mb-8">
          This demo shows how commission rates are calculated based on pickup and delivery locations 
          within Nairobi CBD. CBD services offer enhanced earnings for assistants!
        </p>

        {/* Commission Rates Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Commission Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">CBD Service</h3>
              <p className="text-sm text-green-700 mb-2">Both locations within Nairobi CBD</p>
              <div className="text-lg font-bold text-green-600">
                Company: {COMMISSION_RATES.CBD_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.CBD_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Standard Service</h3>
              <p className="text-sm text-blue-700 mb-2">At least one location outside CBD</p>
              <div className="text-lg font-bold text-blue-600">
                Company: {COMMISSION_RATES.STANDARD_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.STANDARD_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Premium Service</h3>
              <p className="text-sm text-purple-700 mb-2">Express or special handling</p>
              <div className="text-lg font-bold text-purple-600">
                Company: {COMMISSION_RATES.PREMIUM_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.PREMIUM_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Demo Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price (KES)
              </label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="0"
                step="50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetDemo}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>

        {/* Step-by-step Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Step {currentStep}: Select {currentStep === 1 ? 'Pickup' : currentStep === 2 ? 'Delivery' : 'Review'} Location
            </h2>
            
            {currentStep <= 2 && (
              <>
                <p className="text-gray-600 mb-4">
                  {currentStep === 1 
                    ? 'Click on the map to select a pickup location. Try selecting locations both inside and outside the CBD to see how it affects commission rates.'
                    : 'Now select a delivery location. Notice how the commission changes based on whether both locations are in the CBD.'
                  }
                </p>
                
                <GoogleMapComponent
                  onLocationSelect={currentStep === 1 ? handlePickupLocationSelect : handleDeliveryLocationSelect}
                  selectedLocation={currentStep === 1 ? pickupLocation : deliveryLocation}
                  height="400px"
                  showControls={true}
                />
              </>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Selected Locations</h3>
                  
                  {pickupLocation && (
                    <div className="flex items-center mb-2">
                      <FaMapMarkerAlt className="text-red-500 mr-2" />
                      <span className="text-sm">
                        <strong>Pickup:</strong> {pickupLocation.name}
                      </span>
                    </div>
                  )}
                  
                  {deliveryLocation && (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-green-500 mr-2" />
                      <span className="text-sm">
                        <strong>Delivery:</strong> {deliveryLocation.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Try Different Locations
                </button>
              </div>
            )}
            
            {/* Progress Indicator */}
            <div className="mt-6 flex justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Commission Calculator Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaCalculator className="text-blue-500 mr-2" />
                Commission Calculation
              </h2>
              
              {pickupLocation && deliveryLocation ? (
                <CommissionCalculator
                  pickupLocation={pickupLocation}
                  deliveryLocation={deliveryLocation}
                  totalPrice={totalPrice}
                  serviceType={serviceType}
                  showDetails={true}
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <FaMoneyBillWave className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select pickup and delivery locations to see commission breakdown
                  </p>
                </div>
              )}
            </div>
            
            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">💡 Tips for Testing</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• Try selecting both locations within the green CBD area to see enhanced earnings</li>
                <li>• Select one location outside CBD to see standard commission rates</li>
                <li>• Adjust the price to see how commission amounts change</li>
                <li>• Try different service types (Express gets premium rates)</li>
                <li>• The yellow dashed area shows the CBD buffer zone</li>
              </ul>
            </div>
            
            {/* Example Scenarios */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Example Scenarios</h3>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-green-500 pl-3">
                  <strong className="text-green-600">CBD to CBD (KES 1000):</strong>
                  <br />Assistant earns KES 700 (70%), Company gets KES 300 (30%)
                </div>
                
                <div className="border-l-4 border-blue-500 pl-3">
                  <strong className="text-blue-600">CBD to Outside (KES 1000):</strong>
                  <br />Assistant earns KES 750 (75%), Company gets KES 250 (25%)
                </div>
                
                <div className="border-l-4 border-purple-500 pl-3">
                  <strong className="text-purple-600">Express Service (KES 1000):</strong>
                  <br />Assistant earns KES 600 (60%), Company gets KES 400 (40%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDemo;