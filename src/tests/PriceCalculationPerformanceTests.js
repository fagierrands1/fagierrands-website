// Performance Tests for Price Calculation
import React, { useState } from 'react';
import { FaStopwatch, FaChartLine, FaPlay, FaStop } from 'react-icons/fa';
import { calculateCommission, calculateBatchCommission } from '../utils/commissionCalculator';

const PriceCalculationPerformanceTests = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [currentTest, setCurrentTest] = useState('');

  // Generate test data
  const generateTestData = (count) => {
    const testData = [];
    const locations = [
      { latitude: -1.2921, longitude: 36.8219 }, // CBD
      { latitude: -1.2865, longitude: 36.8235 }, // CBD
      { latitude: -1.3500, longitude: 36.9000 }, // Outside CBD
      { latitude: -1.4000, longitude: 36.9500 }, // Outside CBD
      { latitude: -1.3200, longitude: 36.8500 }, // Mixed
    ];

    for (let i = 0; i < count; i++) {
      testData.push({
        totalPrice: Math.random() * 2000 + 500, // 500-2500
        pickupLocation: locations[Math.floor(Math.random() * locations.length)],
        deliveryLocation: locations[Math.floor(Math.random() * locations.length)],
        serviceType: Math.random() > 0.8 ? 'premium' : null
      });
    }

    return testData;
  };

  // Performance test scenarios
  const performanceTests = [
    {
      name: 'Single Calculation Performance',
      description: 'Test single commission calculation speed',
      iterations: 1000,
      testFunction: async () => {
        const testOrder = {
          totalPrice: 1000,
          pickupLocation: { latitude: -1.2921, longitude: 36.8219 },
          deliveryLocation: { latitude: -1.3500, longitude: 36.9000 }
        };

        const startTime = performance.now();
        
        for (let i = 0; i < 1000; i++) {
          calculateCommission(
            testOrder.totalPrice,
            testOrder.pickupLocation,
            testOrder.deliveryLocation
          );
        }
        
        const endTime = performance.now();
        return endTime - startTime;
      }
    },
    {
      name: 'Batch Calculation Performance (100 orders)',
      description: 'Test batch commission calculation for 100 orders',
      iterations: 10,
      testFunction: async () => {
        const testData = generateTestData(100);
        
        const startTime = performance.now();
        
        for (let i = 0; i < 10; i++) {
          calculateBatchCommission(testData);
        }
        
        const endTime = performance.now();
        return endTime - startTime;
      }
    },
    {
      name: 'Batch Calculation Performance (1000 orders)',
      description: 'Test batch commission calculation for 1000 orders',
      iterations: 5,
      testFunction: async () => {
        const testData = generateTestData(1000);
        
        const startTime = performance.now();
        
        for (let i = 0; i < 5; i++) {
          calculateBatchCommission(testData);
        }
        
        const endTime = performance.now();
        return endTime - startTime;
      }
    },
    {
      name: 'Memory Usage Test',
      description: 'Test memory usage with large datasets',
      iterations: 1,
      testFunction: async () => {
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Create large dataset
        const largeDataset = generateTestData(10000);
        
        const startTime = performance.now();
        
        // Process the dataset
        const result = calculateBatchCommission(largeDataset);
        
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        return {
          time: endTime - startTime,
          memoryUsed: endMemory - startMemory,
          ordersProcessed: largeDataset.length,
          result
        };
      }
    },
    {
      name: 'Concurrent Calculations',
      description: 'Test multiple simultaneous calculations',
      iterations: 1,
      testFunction: async () => {
        const testData = generateTestData(100);
        
        const startTime = performance.now();
        
        // Run multiple calculations concurrently
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            new Promise(resolve => {
              const batchResult = calculateBatchCommission(testData);
              resolve(batchResult);
            })
          );
        }
        
        await Promise.all(promises);
        
        const endTime = performance.now();
        return endTime - startTime;
      }
    },
    {
      name: 'Edge Case Performance',
      description: 'Test performance with edge cases and invalid data',
      iterations: 100,
      testFunction: async () => {
        const edgeCases = [
          { totalPrice: 0, pickupLocation: null, deliveryLocation: null },
          { totalPrice: -100, pickupLocation: { latitude: -1.2921, longitude: 36.8219 }, deliveryLocation: { latitude: -1.3500, longitude: 36.9000 } },
          { totalPrice: 1000, pickupLocation: { latitude: null, longitude: 36.8219 }, deliveryLocation: { latitude: -1.3500, longitude: 36.9000 } },
          { totalPrice: 1000, pickupLocation: { latitude: -1.2921, longitude: 36.8219 }, deliveryLocation: null },
        ];

        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
          edgeCases.forEach(testCase => {
            try {
              calculateCommission(
                testCase.totalPrice,
                testCase.pickupLocation,
                testCase.deliveryLocation
              );
            } catch (error) {
              // Expected for edge cases
            }
          });
        }
        
        const endTime = performance.now();
        return endTime - startTime;
      }
    }
  ];

  // Run all performance tests
  const runPerformanceTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults = [];

    for (const test of performanceTests) {
      setCurrentTest(`Running ${test.name}...`);
      
      try {
        const result = await test.testFunction();
        
        let formattedResult;
        if (typeof result === 'object' && result.time !== undefined) {
          // Memory usage test result
          formattedResult = {
            name: test.name,
            description: test.description,
            executionTime: result.time,
            memoryUsed: result.memoryUsed,
            ordersProcessed: result.ordersProcessed,
            averageTimePerOrder: result.time / result.ordersProcessed,
            throughput: (result.ordersProcessed / result.time) * 1000, // orders per second
            success: true
          };
        } else {
          // Regular performance test result
          formattedResult = {
            name: test.name,
            description: test.description,
            executionTime: result,
            iterations: test.iterations,
            averageTimePerIteration: result / test.iterations,
            throughput: (test.iterations / result) * 1000, // iterations per second
            success: true
          };
        }
        
        testResults.push(formattedResult);
      } catch (error) {
        testResults.push({
          name: test.name,
          description: test.description,
          error: error.message,
          success: false
        });
      }
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setResults(testResults);
    setIsRunning(false);
    setCurrentTest('');
  };

  // Format time for display
  const formatTime = (milliseconds) => {
    if (milliseconds < 1) {
      return `${(milliseconds * 1000).toFixed(2)}μs`;
    } else if (milliseconds < 1000) {
      return `${milliseconds.toFixed(2)}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
  };

  // Format memory for display
  const formatMemory = (bytes) => {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
  };

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (results.length === 0) return null;

    const successfulTests = results.filter(r => r.success);
    const totalExecutionTime = successfulTests.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = totalExecutionTime / successfulTests.length;
    const fastestTest = successfulTests.reduce((fastest, current) => 
      current.executionTime < fastest.executionTime ? current : fastest
    );
    const slowestTest = successfulTests.reduce((slowest, current) => 
      current.executionTime > slowest.executionTime ? current : slowest
    );

    return {
      totalTests: results.length,
      successfulTests: successfulTests.length,
      failedTests: results.length - successfulTests.length,
      totalExecutionTime,
      averageExecutionTime,
      fastestTest,
      slowestTest
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaStopwatch className="mr-3 text-blue-600" />
              Price Calculation Performance Tests
            </h1>
            <button
              onClick={runPerformanceTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <FaStop className="mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <FaPlay className="mr-2" />
                  Run Performance Tests
                </>
              )}
            </button>
          </div>

          {/* Test Progress */}
          {isRunning && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">{currentTest}</span>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-800">{metrics.totalTests}</div>
                <div className="text-sm text-blue-600">Total Tests</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-800">{metrics.successfulTests}</div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-800">{formatTime(metrics.averageExecutionTime)}</div>
                <div className="text-sm text-yellow-600">Avg Time</div>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-800">{formatTime(metrics.totalExecutionTime)}</div>
                <div className="text-sm text-purple-600">Total Time</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaChartLine className="mr-2" />
                Performance Test Results
              </h2>
              
              <div className="grid gap-4">
                {results.map((result, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{result.name}</h3>
                        <p className="text-sm text-gray-600">{result.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {result.success ? 'Success' : 'Failed'}
                      </div>
                    </div>
                    
                    {result.success ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Execution Time:</span>
                          <div className="text-gray-700">{formatTime(result.executionTime)}</div>
                        </div>
                        
                        {result.iterations && (
                          <div>
                            <span className="font-medium">Iterations:</span>
                            <div className="text-gray-700">{result.iterations.toLocaleString()}</div>
                          </div>
                        )}
                        
                        {result.averageTimePerIteration && (
                          <div>
                            <span className="font-medium">Avg per Iteration:</span>
                            <div className="text-gray-700">{formatTime(result.averageTimePerIteration)}</div>
                          </div>
                        )}
                        
                        {result.throughput && (
                          <div>
                            <span className="font-medium">Throughput:</span>
                            <div className="text-gray-700">{result.throughput.toFixed(2)}/sec</div>
                          </div>
                        )}
                        
                        {result.memoryUsed && (
                          <div>
                            <span className="font-medium">Memory Used:</span>
                            <div className="text-gray-700">{formatMemory(result.memoryUsed)}</div>
                          </div>
                        )}
                        
                        {result.ordersProcessed && (
                          <div>
                            <span className="font-medium">Orders Processed:</span>
                            <div className="text-gray-700">{result.ordersProcessed.toLocaleString()}</div>
                          </div>
                        )}
                        
                        {result.averageTimePerOrder && (
                          <div>
                            <span className="font-medium">Avg per Order:</span>
                            <div className="text-gray-700">{formatTime(result.averageTimePerOrder)}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700 text-sm">
                        <span className="font-medium">Error:</span> {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Benchmarks */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">Performance Benchmarks</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div><strong>Excellent:</strong> &lt; 1ms per calculation</div>
              <div><strong>Good:</strong> 1-10ms per calculation</div>
              <div><strong>Acceptable:</strong> 10-100ms per calculation</div>
              <div><strong>Poor:</strong> &gt; 100ms per calculation</div>
            </div>
          </div>

          {/* Test Information */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Test Coverage</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Single calculation performance</li>
              <li>✓ Batch calculation performance (100 & 1000 orders)</li>
              <li>✓ Memory usage with large datasets</li>
              <li>✓ Concurrent calculation handling</li>
              <li>✓ Edge case performance</li>
              <li>✓ Throughput measurements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculationPerformanceTests;// Performance Tests for Price Calculation