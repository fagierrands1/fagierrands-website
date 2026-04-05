// src/pages/AllTasksCommissionDemo.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UniversalCommissionCalculator from '../components/Common/UniversalCommissionCalculator';
import GoogleMapComponent from '../components/Common/GoogleMapComponent';
import UnifiedMapComponent from '../components/Common/UnifiedMapComponent';
import { 
  FaShoppingCart, 
  FaTruck, 
  FaBroom, 
  FaWrench, 
  FaMapMarkerAlt, 
  FaCalculator,
  FaMoneyBillWave 
} from 'react-icons/fa';
import { COMMISSION_RATES } from '../utils/commissionCalculator';

const AllTasksCommissionDemo = () => {
  const { isAdmin } = useAuth();
  
  // All hooks must be called before any conditional returns
  const [selectedTaskType, setSelectedTaskType] = useState('shopping');
  const [taskLocation, setTaskLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [totalPrice, setTotalPrice] = useState(1000);
  const [serviceType, setServiceType] = useState('standard');
  const [multiStopLocations, setMultiStopLocations] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Only allow admins to view this demo
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This commission system demo is only available to administrators.
          </p>
          <p className="text-sm text-gray-500">
            Commission breakdowns are internal business information and not visible to clients, assistants, or handlers.
          </p>
        </div>
      </div>
    );
  }

  const taskTypes = {
    shopping: {
      icon: FaShoppingCart,
      name: 'Shopping Service',
      description: 'Shop for groceries, clothes, or any items',
      color: 'bg-green-500',
      needsDelivery: false,
      examples: ['Grocery shopping at Nakumatt', 'Buying electronics at Sarit Centre', 'Pharmacy pickup']
    },
    delivery: {
      icon: FaTruck,
      name: 'Pickup & Delivery',
      description: 'Pick up and deliver items between locations',
      color: 'bg-blue-500',
      needsDelivery: true,
      examples: ['Document delivery', 'Food delivery', 'Package pickup and delivery']
    },
    cleaning: {
      icon: FaBroom,
      name: 'Cleaning Service',
      description: 'House cleaning, office cleaning, etc.',
      color: 'bg-purple-500',
      needsDelivery: false,
      examples: ['House cleaning in Kilimani', 'Office cleaning in CBD', 'Car wash service']
    },
    maintenance: {
      icon: FaWrench,
      name: 'Maintenance Service',
      description: 'Repairs, installations, and maintenance',
      color: 'bg-orange-500',
      needsDelivery: false,
      examples: ['Plumbing repair', 'Electrical installation', 'Appliance maintenance']
    },
    'multi-stop': {
      icon: FaMapMarkerAlt,
      name: 'Multi-Stop Service',
      description: 'Tasks involving multiple locations',
      color: 'bg-red-500',
      needsDelivery: false,
      examples: ['Shopping at multiple stores', 'Multi-location deliveries', 'Business errands']
    },
    general: {
      icon: FaCalculator,
      name: 'General Errand',
      description: 'Any other type of errand or task',
      color: 'bg-gray-500',
      needsDelivery: false,
      examples: ['Queue for services', 'Document processing', 'Personal assistance']
    }
  };

  const handleLocationSelect = (location) => {
    if (selectedTaskType === 'delivery') {
      if (currentStep === 1) {
        setTaskLocation(location);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        setDeliveryLocation(location);
        setCurrentStep(3);
      }
    } else if (selectedTaskType === 'multi-stop') {
      setMultiStopLocations([...multiStopLocations, location]);
      setTaskLocation([...multiStopLocations, location]);
    } else {
      setTaskLocation(location);
      setCurrentStep(3);
    }
  };

  const resetDemo = () => {
    setTaskLocation(null);
    setDeliveryLocation(null);
    setMultiStopLocations([]);
    setCurrentStep(1);
  };

  const removeMultiStopLocation = (index) => {
    const newLocations = multiStopLocations.filter((_, i) => i !== index);
    setMultiStopLocations(newLocations);
    setTaskLocation(newLocations.length > 0 ? newLocations : null);
  };

  const currentTaskType = taskTypes[selectedTaskType];
  const TaskIcon = currentTaskType.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Universal Commission System Demo
        </h1>
        
        <p className="text-gray-600 mb-8">
          This demo shows how commission rates are calculated for <strong>ALL types of tasks</strong> - 
          not just pickup and delivery! The system works for shopping, cleaning, maintenance, 
          multi-stop errands, and any other service based on location.
        </p>

        {/* Commission Rates Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Universal Commission Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">CBD Tasks</h3>
              <p className="text-sm text-green-700 mb-2">Task location(s) within Nairobi CBD</p>
              <div className="text-lg font-bold text-green-600">
                Company: {COMMISSION_RATES.CBD_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.CBD_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Non-CBD Tasks</h3>
              <p className="text-sm text-blue-700 mb-2">Task location(s) outside CBD</p>
              <div className="text-lg font-bold text-blue-600">
                Company: {COMMISSION_RATES.STANDARD_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.STANDARD_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Premium Tasks</h3>
              <p className="text-sm text-purple-700 mb-2">Express or special handling</p>
              <div className="text-lg font-bold text-purple-600">
                Company: {COMMISSION_RATES.PREMIUM_SERVICE.COMPANY_PERCENTAGE}% | 
                Assistant: {COMMISSION_RATES.PREMIUM_SERVICE.ASSISTANT_PERCENTAGE}%
              </div>
            </div>
          </div>
        </div>

        {/* Task Type Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Task Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(taskTypes).map(([key, taskType]) => {
              const Icon = taskType.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTaskType(key);
                    resetDemo();
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTaskType === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${taskType.color} text-white mr-3`}>
                      <Icon className="text-lg" />
                    </div>
                    <h3 className="font-semibold text-gray-800">{taskType.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-left">{taskType.description}</p>
                </button>
              );
            })}
          </div>

          {/* Demo Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Current Task Type Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${currentTaskType.color} text-white mr-4`}>
              <TaskIcon className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentTaskType.name}</h2>
              <p className="text-gray-600">{currentTaskType.description}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Example Use Cases:</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {currentTaskType.examples.map((example, index) => (
                <li key={index}>{example}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map and Location Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedTaskType === 'delivery' 
                ? `Step ${currentStep}: Select ${currentStep === 1 ? 'Pickup' : 'Delivery'} Location`
                : selectedTaskType === 'multi-stop'
                ? 'Add Task Locations'
                : 'Select Task Location'
              }
            </h2>
            
            <div className="mb-4">
              {selectedTaskType === 'delivery' && (
                <p className="text-gray-600 text-sm mb-4">
                  {currentStep === 1 
                    ? 'Select the pickup location for your delivery task.'
                    : 'Now select the delivery destination.'
                  }
                </p>
              )}
              
              {selectedTaskType === 'multi-stop' && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-2">
                    Click on the map to add multiple locations for your task.
                  </p>
                  {multiStopLocations.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-2">Selected Locations:</h4>
                      {multiStopLocations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between text-sm mb-1">
                          <span>{location.name || `Location ${index + 1}`}</span>
                          <button
                            onClick={() => removeMultiStopLocation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <UnifiedMapComponent
              onLocationSelect={handleLocationSelect}
              selectedLocation={currentStep === 1 ? taskLocation : deliveryLocation}
              bufferDistance={1}
              restrictToCBD={false}
              showLandmarks={true}
              showBufferZone={true}
              showGeofence={false}
              height="400px"
              initialStyle="satellite-streets"
              showControls={true}
              showStyleSwitcher={true}
              showLegend={true}
            />
            
            {/* Selected Locations Display */}
            {(taskLocation || deliveryLocation) && (
              <div className="mt-4 space-y-2">
                {taskLocation && !Array.isArray(taskLocation) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <TaskIcon className="text-blue-600 mr-2" />
                      <span className="text-sm font-medium">
                        {selectedTaskType === 'delivery' ? 'Pickup: ' : 'Task Location: '}
                        {taskLocation.name}
                      </span>
                    </div>
                  </div>
                )}
                
                {deliveryLocation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <FaTruck className="text-green-600 mr-2" />
                      <span className="text-sm font-medium">
                        Delivery: {deliveryLocation.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Commission Calculator */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaMoneyBillWave className="text-green-600 mr-2" />
                Commission Calculation
              </h2>
              
              {taskLocation ? (
                <UniversalCommissionCalculator
                  totalPrice={totalPrice}
                  taskType={selectedTaskType}
                  taskLocation={taskLocation}
                  deliveryLocation={deliveryLocation}
                  serviceType={serviceType}
                  showDetails={true}
                  adminOnly={false} // Allow in demo for admins
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <TaskIcon className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select task location(s) to see commission breakdown
                  </p>
                </div>
              )}
            </div>
            
            {/* Task-Specific Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">💡 Tips for {currentTaskType.name}</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                {selectedTaskType === 'shopping' && (
                  <>
                    <li>• Commission applies to total shopping cost including service fee</li>
                    <li>• CBD shopping gets 70% assistant earnings</li>
                    <li>• Non-CBD shopping gets 75% assistant earnings</li>
                  </>
                )}
                {selectedTaskType === 'delivery' && (
                  <>
                    <li>• Commission based on both pickup and delivery locations</li>
                    <li>• Both locations in CBD = 70% assistant earnings</li>
                    <li>• Any location outside CBD = 75% assistant earnings</li>
                  </>
                )}
                {selectedTaskType === 'cleaning' && (
                  <>
                    <li>• Commission based on service location</li>
                    <li>• CBD cleaning services = 70% assistant earnings</li>
                    <li>• Non-CBD cleaning = 75% assistant earnings</li>
                  </>
                )}
                {selectedTaskType === 'maintenance' && (
                  <>
                    <li>• Commission includes labor and materials cost</li>
                    <li>• Location determines commission rate</li>
                    <li>• Express maintenance gets premium rates</li>
                  </>
                )}
                {selectedTaskType === 'multi-stop' && (
                  <>
                    <li>• Commission based on whether ALL stops are in CBD</li>
                    <li>• If all stops in CBD = 70% assistant earnings</li>
                    <li>• If any stop outside CBD = 75% assistant earnings</li>
                  </>
                )}
                {selectedTaskType === 'general' && (
                  <>
                    <li>• Flexible commission based on task location</li>
                    <li>• Can be upgraded to premium for urgent tasks</li>
                    <li>• Same location-based rates apply</li>
                  </>
                )}
              </ul>
            </div>
            
            {/* Example Calculations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Example Calculations (KES 1000)</h3>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-green-500 pl-3">
                  <strong className="text-green-600">CBD Task:</strong>
                  <br />Assistant earns KES 700 (70%), Company gets KES 300 (30%)
                </div>
                
                <div className="border-l-4 border-blue-500 pl-3">
                  <strong className="text-blue-600">Non-CBD Task:</strong>
                  <br />Assistant earns KES 750 (75%), Company gets KES 250 (25%)
                </div>
                
                <div className="border-l-4 border-purple-500 pl-3">
                  <strong className="text-purple-600">Premium Task:</strong>
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

export default AllTasksCommissionDemo;