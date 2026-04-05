// Simple Price Calculation Tests
import React, { useState } from 'react';
import { FaCalculator, FaCheckCircle, FaTimesCircle, FaPlay } from 'react-icons/fa';

const SimplePriceCalculationTests = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Simple test cases
  const testCases = [
    {
      name: 'Basic Price Calculation',
      test: () => {
        const basePrice = 500;
        const itemsPrice = 1000;
        const total = basePrice + itemsPrice;
        return {
          passed: total === 1500,
          expected: 1500,
          actual: total,
          details: `Base: ${basePrice}, Items: ${itemsPrice}, Total: ${total}`
        };
      }
    },
    {
      name: 'Distance Calculation Test',
      test: () => {
        const distance = 20; // km
        const baseDistance = 15;
        const extraDistance = distance > baseDistance ? distance - baseDistance : 0;
        const distancePrice = extraDistance * 30;
        return {
          passed: distancePrice === 150,
          expected: 150,
          actual: distancePrice,
          details: `Distance: ${distance}km, Extra: ${extraDistance}km, Price: ${distancePrice}`
        };
      }
    },
    {
      name: 'Items Total Calculation',
      test: () => {
        const items = [
          { price: 100, quantity: 2 },
          { price: 50, quantity: 3 }
        ];
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return {
          passed: total === 350,
          expected: 350,
          actual: total,
          details: `Items: ${JSON.stringify(items)}, Total: ${total}`
        };
      }
    },
    {
      name: 'Commission Calculation Test',
      test: () => {
        const totalPrice = 1000;
        const commissionRate = 25; // 25%
        const companyCommission = (totalPrice * commissionRate) / 100;
        const assistantEarnings = totalPrice - companyCommission;
        return {
          passed: companyCommission === 250 && assistantEarnings === 750,
          expected: { company: 250, assistant: 750 },
          actual: { company: companyCommission, assistant: assistantEarnings },
          details: `Total: ${totalPrice}, Commission: ${companyCommission}, Assistant: ${assistantEarnings}`
        };
      }
    },
    {
      name: 'Edge Case - Zero Price',
      test: () => {
        const totalPrice = 0;
        const isValid = totalPrice > 0;
        return {
          passed: !isValid, // Should fail validation
          expected: false,
          actual: isValid,
          details: `Zero price should be invalid: ${!isValid}`
        };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const result = testCase.test();
        results.push({
          name: testCase.name,
          ...result
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          passed: false,
          error: error.message,
          details: 'Test execution failed'
        });
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const getTestStats = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    return { total, passed, failed, passRate };
  };

  const stats = getTestStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaCalculator className="mr-3 text-blue-600" />
              Simple Price Calculation Tests
            </h1>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FaPlay className="mr-2" />
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          {/* Test Progress */}
          {isRunning && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Running price calculation tests...</span>
              </div>
            </div>
          )}

          {/* Test Statistics */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-800">{stats.passed}</div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-800">{stats.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-800">{stats.passRate}%</div>
                <div className="text-sm text-blue-600">Pass Rate</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
              
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {result.passed ? (
                            <FaCheckCircle className="text-green-500 mr-2" />
                          ) : (
                            <FaTimesCircle className="text-red-500 mr-2" />
                          )}
                          <span className="font-medium text-gray-800">{result.name}</span>
                        </div>
                        
                        {result.details && (
                          <p className="text-sm text-gray-600 mb-2">{result.details}</p>
                        )}
                        
                        {result.expected !== undefined && (
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">Expected:</span>{' '}
                              <span className="text-gray-700">
                                {typeof result.expected === 'object' 
                                  ? JSON.stringify(result.expected)
                                  : result.expected}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Actual:</span>{' '}
                              <span className="text-gray-700">
                                {typeof result.actual === 'object'
                                  ? JSON.stringify(result.actual)
                                  : result.actual}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Information */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Test Coverage</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Basic price calculation (base + items)</li>
              <li>✓ Distance-based pricing (extra distance charges)</li>
              <li>✓ Items total calculation (price × quantity)</li>
              <li>✓ Commission calculation (company vs assistant split)</li>
              <li>✓ Edge case validation (zero price handling)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePriceCalculationTests;