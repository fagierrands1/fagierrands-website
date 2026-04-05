// Test Utilities for Price Calculation Testing
import { calculateCommission } from '../utils/commissionCalculator';

// Test data generators
export const generateRandomLocation = (bounds = null) => {
  // Default to Nairobi area if no bounds specified
  const defaultBounds = {
    north: -1.1,
    south: -1.5,
    east: 37.1,
    west: 36.6
  };
  
  const useBounds = bounds || defaultBounds;
  
  return {
    latitude: Math.random() * (useBounds.north - useBounds.south) + useBounds.south,
    longitude: Math.random() * (useBounds.east - useBounds.west) + useBounds.west
  };
};

export const generateRandomOrder = (options = {}) => {
  const {
    minPrice = 500,
    maxPrice = 5000,
    maxItems = 5,
    includeLocation = true
  } = options;

  const order = {
    totalPrice: Math.random() * (maxPrice - minPrice) + minPrice,
    items: []
  };

  if (includeLocation) {
    order.pickupLocation = generateRandomLocation();
    order.deliveryLocation = generateRandomLocation();
  }

  // Generate random items
  const itemCount = Math.floor(Math.random() * maxItems) + 1;
  for (let i = 0; i < itemCount; i++) {
    order.items.push({
      name: `Item ${i + 1}`,
      price: Math.random() * 1000 + 50,
      quantity: Math.floor(Math.random() * 5) + 1
    });
  }

  return order;
};

export const generateTestDataset = (count, options = {}) => {
  const dataset = [];
  for (let i = 0; i < count; i++) {
    dataset.push(generateRandomOrder(options));
  }
  return dataset;
};

// Test validation utilities
export const validatePriceCalculation = (result, expected) => {
  const tolerance = 0.01; // 1 cent tolerance for floating point calculations
  
  return {
    basePrice: Math.abs(result.basePrice - expected.basePrice) < tolerance,
    distancePrice: Math.abs(result.distancePrice - expected.distancePrice) < tolerance,
    itemsPrice: Math.abs(result.itemsPrice - expected.itemsPrice) < tolerance,
    totalPrice: Math.abs(result.totalPrice - expected.totalPrice) < tolerance
  };
};

export const validateCommissionCalculation = (result, expected) => {
  const tolerance = 0.01;
  
  return {
    companyCommission: Math.abs(result.companyCommission - expected.companyCommission) < tolerance,
    assistantEarnings: Math.abs(result.assistantEarnings - expected.assistantEarnings) < tolerance,
    companyPercentage: result.companyPercentage === expected.companyPercentage,
    assistantPercentage: result.assistantPercentage === expected.assistantPercentage
  };
};

// Performance testing utilities
export const measureExecutionTime = async (fn, iterations = 1) => {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  
  const endTime = performance.now();
  return {
    totalTime: endTime - startTime,
    averageTime: (endTime - startTime) / iterations,
    iterations
  };
};

export const measureMemoryUsage = (fn) => {
  if (!performance.memory) {
    return { error: 'Memory measurement not supported in this browser' };
  }
  
  const startMemory = performance.memory.usedJSHeapSize;
  const result = fn();
  const endMemory = performance.memory.usedJSHeapSize;
  
  return {
    result,
    memoryUsed: endMemory - startMemory,
    startMemory,
    endMemory
  };
};

// Test assertion utilities
export const assertPriceCalculation = (actual, expected, testName) => {
  const validation = validatePriceCalculation(actual, expected);
  const passed = Object.values(validation).every(v => v);
  
  return {
    name: testName,
    passed,
    actual,
    expected,
    validation,
    details: passed ? 'All price calculations match expected values' : 'Price calculation mismatch'
  };
};

export const assertCommissionCalculation = (actual, expected, testName) => {
  const validation = validateCommissionCalculation(actual, expected);
  const passed = Object.values(validation).every(v => v);
  
  return {
    name: testName,
    passed,
    actual,
    expected,
    validation,
    details: passed ? 'All commission calculations match expected values' : 'Commission calculation mismatch'
  };
};

// Predefined test locations for consistent testing
export const TEST_LOCATIONS = {
  CBD_KICC: { name: 'Nairobi CBD - KICC', latitude: -1.2921, longitude: 36.8219 },
  CBD_CITY_HALL: { name: 'Nairobi CBD - City Hall', latitude: -1.2865, longitude: 36.8235 },
  WESTLANDS: { name: 'Westlands', latitude: -1.2676, longitude: 36.8108 },
  KAREN: { name: 'Karen', latitude: -1.3197, longitude: 36.6859 },
  EASTLEIGH: { name: 'Eastleigh', latitude: -1.2741, longitude: 36.8441 },
  KASARANI: { name: 'Kasarani', latitude: -1.2258, longitude: 36.8986 },
  EMBAKASI: { name: 'Embakasi', latitude: -1.3167, longitude: 36.8833 },
  NGONG_ROAD: { name: 'Ngong Road', latitude: -1.3032, longitude: 36.7827 },
  THIKA_ROAD: { name: 'Thika Road - Roysambu', latitude: -1.2167, longitude: 36.8833 },
  MOMBASA_ROAD: { name: 'Mombasa Road - South B', latitude: -1.3167, longitude: 36.8333 }
};

// Predefined test scenarios
export const TEST_SCENARIOS = {
  CBD_TO_CBD: {
    name: 'CBD to CBD Delivery',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.CBD_CITY_HALL,
    expectedCommissionRate: 30,
    expectedDistance: 1.5
  },
  CBD_TO_OUTSIDE: {
    name: 'CBD to Outside CBD',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.KAREN,
    expectedCommissionRate: 25,
    expectedDistance: 15
  },
  OUTSIDE_TO_CBD: {
    name: 'Outside CBD to CBD',
    pickup: TEST_LOCATIONS.WESTLANDS,
    delivery: TEST_LOCATIONS.CBD_KICC,
    expectedCommissionRate: 25,
    expectedDistance: 8
  },
  OUTSIDE_TO_OUTSIDE: {
    name: 'Outside CBD to Outside CBD',
    pickup: TEST_LOCATIONS.KAREN,
    delivery: TEST_LOCATIONS.KASARANI,
    expectedCommissionRate: 25,
    expectedDistance: 25
  },
  LONG_DISTANCE: {
    name: 'Long Distance Delivery',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.KASARANI,
    expectedCommissionRate: 25,
    expectedDistance: 20
  }
};

// Test item sets
export const TEST_ITEMS = {
  NO_ITEMS: [],
  SINGLE_ITEM: [{ name: 'Document', price: 0, quantity: 1 }],
  GROCERIES: [
    { name: 'Milk', price: 120, quantity: 2 },
    { name: 'Bread', price: 80, quantity: 1 },
    { name: 'Eggs', price: 300, quantity: 1 }
  ],
  ELECTRONICS: [
    { name: 'Laptop', price: 80000, quantity: 1 },
    { name: 'Phone', price: 45000, quantity: 1 },
    { name: 'Headphones', price: 5000, quantity: 1 }
  ],
  MIXED_ITEMS: [
    { name: 'Clothing', price: 2500, quantity: 3 },
    { name: 'Books', price: 800, quantity: 5 },
    { name: 'Stationery', price: 150, quantity: 10 }
  ]
};

// Benchmark utilities
export const PERFORMANCE_BENCHMARKS = {
  EXCELLENT: { threshold: 1, label: 'Excellent', color: 'green' },
  GOOD: { threshold: 10, label: 'Good', color: 'blue' },
  ACCEPTABLE: { threshold: 100, label: 'Acceptable', color: 'yellow' },
  POOR: { threshold: Infinity, label: 'Poor', color: 'red' }
};

export const getBenchmarkCategory = (timeMs) => {
  for (const [category, benchmark] of Object.entries(PERFORMANCE_BENCHMARKS)) {
    if (timeMs < benchmark.threshold) {
      return { category, ...benchmark };
    }
  }
  return { category: 'POOR', ...PERFORMANCE_BENCHMARKS.POOR };
};

// Error simulation utilities
export const simulateNetworkError = () => {
  throw new Error('Network Error: Unable to connect to server');
};

export const simulateInvalidInput = () => {
  return {
    invalidLocation: { latitude: null, longitude: 'invalid' },
    invalidPrice: 'not a number',
    invalidItems: 'not an array'
  };
};

// Test result formatting utilities
export const formatTestResult = (result) => {
  return {
    ...result,
    timestamp: new Date().toISOString(),
    duration: result.endTime - result.startTime,
    success: !result.error && result.passed !== false
  };
};

export const formatPerformanceResult = (result) => {
  const benchmark = getBenchmarkCategory(result.averageTime);
  
  return {
    ...result,
    benchmark,
    throughput: result.iterations / (result.totalTime / 1000), // operations per second
    formatted: {
      totalTime: `${result.totalTime.toFixed(2)}ms`,
      averageTime: `${result.averageTime.toFixed(2)}ms`,
      throughput: `${(result.iterations / (result.totalTime / 1000)).toFixed(2)} ops/sec`
    }
  };
};

// Export all utilities
export default {
  generateRandomLocation,
  generateRandomOrder,
  generateTestDataset,
  validatePriceCalculation,
  validateCommissionCalculation,
  measureExecutionTime,
  measureMemoryUsage,
  assertPriceCalculation,
  assertCommissionCalculation,
  TEST_LOCATIONS,
  TEST_SCENARIOS,
  TEST_ITEMS,
  PERFORMANCE_BENCHMARKS,
  getBenchmarkCategory,
  simulateNetworkError,
  simulateInvalidInput,
  formatTestResult,
  formatPerformanceResult
};// Test Utilities for Price Calculation Testing
import { calculateCommission } from '../utils/commissionCalculator';

// Test data generators
export const generateRandomLocation = (bounds = null) => {
  // Default to Nairobi area if no bounds specified
  const defaultBounds = {
    north: -1.1,
    south: -1.5,
    east: 37.1,
    west: 36.6
  };
  
  const useBounds = bounds || defaultBounds;
  
  return {
    latitude: Math.random() * (useBounds.north - useBounds.south) + useBounds.south,
    longitude: Math.random() * (useBounds.east - useBounds.west) + useBounds.west
  };
};

export const generateRandomOrder = (options = {}) => {
  const {
    minPrice = 500,
    maxPrice = 5000,
    maxItems = 5,
    includeLocation = true
  } = options;

  const order = {
    totalPrice: Math.random() * (maxPrice - minPrice) + minPrice,
    items: []
  };

  if (includeLocation) {
    order.pickupLocation = generateRandomLocation();
    order.deliveryLocation = generateRandomLocation();
  }

  // Generate random items
  const itemCount = Math.floor(Math.random() * maxItems) + 1;
  for (let i = 0; i < itemCount; i++) {
    order.items.push({
      name: `Item ${i + 1}`,
      price: Math.random() * 1000 + 50,
      quantity: Math.floor(Math.random() * 5) + 1
    });
  }

  return order;
};

export const generateTestDataset = (count, options = {}) => {
  const dataset = [];
  for (let i = 0; i < count; i++) {
    dataset.push(generateRandomOrder(options));
  }
  return dataset;
};

// Test validation utilities
export const validatePriceCalculation = (result, expected) => {
  const tolerance = 0.01; // 1 cent tolerance for floating point calculations
  
  return {
    basePrice: Math.abs(result.basePrice - expected.basePrice) < tolerance,
    distancePrice: Math.abs(result.distancePrice - expected.distancePrice) < tolerance,
    itemsPrice: Math.abs(result.itemsPrice - expected.itemsPrice) < tolerance,
    totalPrice: Math.abs(result.totalPrice - expected.totalPrice) < tolerance
  };
};

export const validateCommissionCalculation = (result, expected) => {
  const tolerance = 0.01;
  
  return {
    companyCommission: Math.abs(result.companyCommission - expected.companyCommission) < tolerance,
    assistantEarnings: Math.abs(result.assistantEarnings - expected.assistantEarnings) < tolerance,
    companyPercentage: result.companyPercentage === expected.companyPercentage,
    assistantPercentage: result.assistantPercentage === expected.assistantPercentage
  };
};

// Performance testing utilities
export const measureExecutionTime = async (fn, iterations = 1) => {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  
  const endTime = performance.now();
  return {
    totalTime: endTime - startTime,
    averageTime: (endTime - startTime) / iterations,
    iterations
  };
};

export const measureMemoryUsage = (fn) => {
  if (!performance.memory) {
    return { error: 'Memory measurement not supported in this browser' };
  }
  
  const startMemory = performance.memory.usedJSHeapSize;
  const result = fn();
  const endMemory = performance.memory.usedJSHeapSize;
  
  return {
    result,
    memoryUsed: endMemory - startMemory,
    startMemory,
    endMemory
  };
};

// Test assertion utilities
export const assertPriceCalculation = (actual, expected, testName) => {
  const validation = validatePriceCalculation(actual, expected);
  const passed = Object.values(validation).every(v => v);
  
  return {
    name: testName,
    passed,
    actual,
    expected,
    validation,
    details: passed ? 'All price calculations match expected values' : 'Price calculation mismatch'
  };
};

export const assertCommissionCalculation = (actual, expected, testName) => {
  const validation = validateCommissionCalculation(actual, expected);
  const passed = Object.values(validation).every(v => v);
  
  return {
    name: testName,
    passed,
    actual,
    expected,
    validation,
    details: passed ? 'All commission calculations match expected values' : 'Commission calculation mismatch'
  };
};

// Predefined test locations for consistent testing
export const TEST_LOCATIONS = {
  CBD_KICC: { name: 'Nairobi CBD - KICC', latitude: -1.2921, longitude: 36.8219 },
  CBD_CITY_HALL: { name: 'Nairobi CBD - City Hall', latitude: -1.2865, longitude: 36.8235 },
  WESTLANDS: { name: 'Westlands', latitude: -1.2676, longitude: 36.8108 },
  KAREN: { name: 'Karen', latitude: -1.3197, longitude: 36.6859 },
  EASTLEIGH: { name: 'Eastleigh', latitude: -1.2741, longitude: 36.8441 },
  KASARANI: { name: 'Kasarani', latitude: -1.2258, longitude: 36.8986 },
  EMBAKASI: { name: 'Embakasi', latitude: -1.3167, longitude: 36.8833 },
  NGONG_ROAD: { name: 'Ngong Road', latitude: -1.3032, longitude: 36.7827 },
  THIKA_ROAD: { name: 'Thika Road - Roysambu', latitude: -1.2167, longitude: 36.8833 },
  MOMBASA_ROAD: { name: 'Mombasa Road - South B', latitude: -1.3167, longitude: 36.8333 }
};

// Predefined test scenarios
export const TEST_SCENARIOS = {
  CBD_TO_CBD: {
    name: 'CBD to CBD Delivery',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.CBD_CITY_HALL,
    expectedCommissionRate: 30,
    expectedDistance: 1.5
  },
  CBD_TO_OUTSIDE: {
    name: 'CBD to Outside CBD',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.KAREN,
    expectedCommissionRate: 25,
    expectedDistance: 15
  },
  OUTSIDE_TO_CBD: {
    name: 'Outside CBD to CBD',
    pickup: TEST_LOCATIONS.WESTLANDS,
    delivery: TEST_LOCATIONS.CBD_KICC,
    expectedCommissionRate: 25,
    expectedDistance: 8
  },
  OUTSIDE_TO_OUTSIDE: {
    name: 'Outside CBD to Outside CBD',
    pickup: TEST_LOCATIONS.KAREN,
    delivery: TEST_LOCATIONS.KASARANI,
    expectedCommissionRate: 25,
    expectedDistance: 25
  },
  LONG_DISTANCE: {
    name: 'Long Distance Delivery',
    pickup: TEST_LOCATIONS.CBD_KICC,
    delivery: TEST_LOCATIONS.KASARANI,
    expectedCommissionRate: 25,
    expectedDistance: 20
  }
};

// Test item sets
export const TEST_ITEMS = {
  NO_ITEMS: [],
  SINGLE_ITEM: [{ name: 'Document', price: 0, quantity: 1 }],
  GROCERIES: [
    { name: 'Milk', price: 120, quantity: 2 },
    { name: 'Bread', price: 80, quantity: 1 },
    { name: 'Eggs', price: 300, quantity: 1 }
  ],
  ELECTRONICS: [
    { name: 'Laptop', price: 80000, quantity: 1 },
    { name: 'Phone', price: 45000, quantity: 1 },
    { name: 'Headphones', price: 5000, quantity: 1 }
  ],
  MIXED_ITEMS: [
    { name: 'Clothing', price: 2500, quantity: 3 },
    { name: 'Books', price: 800, quantity: 5 },
    { name: 'Stationery', price: 150, quantity: 10 }
  ]
};

// Benchmark utilities
export const PERFORMANCE_BENCHMARKS = {
  EXCELLENT: { threshold: 1, label: 'Excellent', color: 'green' },
  GOOD: { threshold: 10, label: 'Good', color: 'blue' },
  ACCEPTABLE: { threshold: 100, label: 'Acceptable', color: 'yellow' },
  POOR: { threshold: Infinity, label: 'Poor', color: 'red' }
};

export const getBenchmarkCategory = (timeMs) => {
  for (const [category, benchmark] of Object.entries(PERFORMANCE_BENCHMARKS)) {
    if (timeMs < benchmark.threshold) {
      return { category, ...benchmark };
    }
  }
  return { category: 'POOR', ...PERFORMANCE_BENCHMARKS.POOR };
};

// Error simulation utilities
export const simulateNetworkError = () => {
  throw new Error('Network Error: Unable to connect to server');
};

export const simulateInvalidInput = () => {
  return {
    invalidLocation: { latitude: null, longitude: 'invalid' },
    invalidPrice: 'not a number',
    invalidItems: 'not an array'
  };
};

// Test result formatting utilities
export const formatTestResult = (result) => {
  return {
    ...result,
    timestamp: new Date().toISOString(),
    duration: result.endTime - result.startTime,
    success: !result.error && result.passed !== false
  };
};

export const formatPerformanceResult = (result) => {
  const benchmark = getBenchmarkCategory(result.averageTime);
  
  return {
    ...result,
    benchmark,
    throughput: result.iterations / (result.totalTime / 1000), // operations per second
    formatted: {
      totalTime: `${result.totalTime.toFixed(2)}ms`,
      averageTime: `${result.averageTime.toFixed(2)}ms`,
      throughput: `${(result.iterations / (result.totalTime / 1000)).toFixed(2)} ops/sec`
    }
  };
};

// Export all utilities
export default {
  generateRandomLocation,
  generateRandomOrder,
  generateTestDataset,
  validatePriceCalculation,
  validateCommissionCalculation,
  measureExecutionTime,
  measureMemoryUsage,
  assertPriceCalculation,
  assertCommissionCalculation,
  TEST_LOCATIONS,
  TEST_SCENARIOS,
  TEST_ITEMS,
  PERFORMANCE_BENCHMARKS,
  getBenchmarkCategory,
  simulateNetworkError,
  simulateInvalidInput,
  formatTestResult,
  formatPerformanceResult
};