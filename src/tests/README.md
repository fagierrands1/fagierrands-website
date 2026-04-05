# Price Calculation Test Suite

This comprehensive test suite provides thorough testing for all price calculation functionality in the Fagi Errands application.

## Test Components

### 1. PriceCalculationTestSuite.js
Main test runner that provides a unified interface for all testing components.

**Access URL:** `/price-calculation-tests`

### 2. PriceCalculationTests.js
Functional tests covering:
- Distance-based pricing calculations
- Items pricing calculations
- Commission calculations with geofencing
- Edge cases and input validation
- Service-specific pricing logic
- Integration tests

### 3. PriceCalculationPerformanceTests.js
Performance tests covering:
- Single calculation speed
- Batch processing performance
- Memory usage monitoring
- Concurrent calculation handling
- Edge case performance

### 4. InteractivePriceCalculatorTest.js
Interactive testing interface with:
- Real-time price calculator
- Predefined test scenarios
- Custom location and item configuration
- Visual commission breakdown

## How to Use

### Quick Start
1. Start your React development server
2. Navigate to `/price-calculation-tests` in your browser
3. Use the tab navigation to access different test types

### Running Functional Tests
1. Go to the "Functional Tests" tab
2. Click "Run All Tests" button
3. Review test results by category
4. Check for any failing tests and investigate

### Running Performance Tests
1. Go to the "Performance Tests" tab
2. Click "Run Performance Tests" button
3. Monitor execution times and throughput
4. Compare against performance benchmarks

### Interactive Testing
1. Go to the "Interactive Testing" tab
2. Select a predefined scenario or create custom test
3. Configure locations and items
4. Review real-time price calculations

## Test Coverage

### Distance Pricing
- ✅ Short distance (under 15km) - Free distance charge
- ✅ Medium distance (exactly 15km) - Boundary condition
- ✅ Long distance (over 15km) - Per-km charging
- ✅ Very long distance - High distance charges

### Items Pricing
- ✅ No items - Zero items price
- ✅ Single item - Basic calculation
- ✅ Multiple items same type - Quantity multiplication
- ✅ Multiple different items - Complex totaling
- ✅ Decimal prices - Precision handling

### Commission Calculations
- ✅ CBD to CBD - 30% commission rate
- ✅ CBD to outside CBD - 25% commission rate
- ✅ Outside CBD to CBD - 25% commission rate
- ✅ Outside CBD to outside CBD - 25% commission rate
- ✅ Premium service - 40% commission rate

### Edge Cases
- ✅ Zero price validation
- ✅ Negative price validation
- ✅ Invalid coordinates handling
- ✅ Missing location handling
- ✅ Null/undefined input handling

### Service Types
- ✅ Shopping service pricing
- ✅ Handyman service pricing
- ✅ Banking service pricing
- ✅ Pickup & delivery pricing
- ✅ Cargo delivery pricing

### Performance Metrics
- ✅ Single calculation speed (target: < 1ms)
- ✅ Batch processing (target: < 100ms for 1000 orders)
- ✅ Memory usage (target: < 10MB for large datasets)
- ✅ Concurrent processing (no blocking/errors)
- ✅ Edge case handling (graceful error handling)

## Test Data

### Predefined Locations
- Nairobi CBD - KICC (-1.2921, 36.8219)
- Nairobi CBD - City Hall (-1.2865, 36.8235)
- Westlands (-1.2676, 36.8108)
- Karen (-1.3197, 36.6859)
- Eastleigh (-1.2741, 36.8441)
- Kasarani (-1.2258, 36.8986)
- Embakasi (-1.3167, 36.8833)
- Ngong Road (-1.3032, 36.7827)
- Thika Road - Roysambu (-1.2167, 36.8833)
- Mombasa Road - South B (-1.3167, 36.8333)

### Test Scenarios
1. **CBD to CBD Delivery** - Short distance within CBD
2. **Shopping Trip - Westlands** - Shopping with multiple items
3. **Long Distance Delivery** - Long distance delivery test
4. **High Value Items** - High value items test
5. **Multiple Small Items** - Multiple small items with quantities

## Expected Results

### Pricing Model
- **Base Price:** KES 500 (up to 15km)
- **Distance Charge:** KES 30 per km (beyond 15km)
- **Items Price:** Sum of (item price × quantity)

### Commission Rates
- **CBD Service:** 30% company, 70% assistant
- **Standard Service:** 25% company, 75% assistant
- **Premium Service:** 40% company, 60% assistant

## Troubleshooting

### Common Issues
1. **Tests not loading:** Ensure all test files are in the correct directory
2. **API errors:** Check if backend endpoints are available
3. **Performance issues:** Monitor browser console for errors
4. **Calculation discrepancies:** Verify test data and expected results

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL for additional logging.

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add performance considerations
4. Update this README with new test coverage

## Dependencies

- React (for UI components)
- @turf/turf (for distance calculations)
- Commission calculator utility
- Nairobi CBD geofence utility
- Price calculator component# Price Calculation Test Suite

This comprehensive test suite provides thorough testing for all price calculation functionality in the Fagi Errands application.

## Test Components

### 1. PriceCalculationTestSuite.js
Main test runner that provides a unified interface for all testing components.

**Access URL:** `/price-calculation-tests`

### 2. PriceCalculationTests.js
Functional tests covering:
- Distance-based pricing calculations
- Items pricing calculations
- Commission calculations with geofencing
- Edge cases and input validation
- Service-specific pricing logic
- Integration tests

### 3. PriceCalculationPerformanceTests.js
Performance tests covering:
- Single calculation speed
- Batch processing performance
- Memory usage monitoring
- Concurrent calculation handling
- Edge case performance

### 4. InteractivePriceCalculatorTest.js
Interactive testing interface with:
- Real-time price calculator
- Predefined test scenarios
- Custom location and item configuration
- Visual commission breakdown

## How to Use

### Quick Start
1. Start your React development server
2. Navigate to `/price-calculation-tests` in your browser
3. Use the tab navigation to access different test types

### Running Functional Tests
1. Go to the "Functional Tests" tab
2. Click "Run All Tests" button
3. Review test results by category
4. Check for any failing tests and investigate

### Running Performance Tests
1. Go to the "Performance Tests" tab
2. Click "Run Performance Tests" button
3. Monitor execution times and throughput
4. Compare against performance benchmarks

### Interactive Testing
1. Go to the "Interactive Testing" tab
2. Select a predefined scenario or create custom test
3. Configure locations and items
4. Review real-time price calculations

## Test Coverage

### Distance Pricing
- ✅ Short distance (under 15km) - Free distance charge
- ✅ Medium distance (exactly 15km) - Boundary condition
- ✅ Long distance (over 15km) - Per-km charging
- ✅ Very long distance - High distance charges

### Items Pricing
- ✅ No items - Zero items price
- ✅ Single item - Basic calculation
- ✅ Multiple items same type - Quantity multiplication
- ✅ Multiple different items - Complex totaling
- ✅ Decimal prices - Precision handling

### Commission Calculations
- ✅ CBD to CBD - 30% commission rate
- ✅ CBD to outside CBD - 25% commission rate
- ✅ Outside CBD to CBD - 25% commission rate
- ✅ Outside CBD to outside CBD - 25% commission rate
- ✅ Premium service - 40% commission rate

### Edge Cases
- ✅ Zero price validation
- ✅ Negative price validation
- ✅ Invalid coordinates handling
- ✅ Missing location handling
- ✅ Null/undefined input handling

### Service Types
- ✅ Shopping service pricing
- ✅ Handyman service pricing
- ✅ Banking service pricing
- ✅ Pickup & delivery pricing
- ✅ Cargo delivery pricing

### Performance Metrics
- ✅ Single calculation speed (target: < 1ms)
- ✅ Batch processing (target: < 100ms for 1000 orders)
- ✅ Memory usage (target: < 10MB for large datasets)
- ✅ Concurrent processing (no blocking/errors)
- ✅ Edge case handling (graceful error handling)

## Test Data

### Predefined Locations
- Nairobi CBD - KICC (-1.2921, 36.8219)
- Nairobi CBD - City Hall (-1.2865, 36.8235)
- Westlands (-1.2676, 36.8108)
- Karen (-1.3197, 36.6859)
- Eastleigh (-1.2741, 36.8441)
- Kasarani (-1.2258, 36.8986)
- Embakasi (-1.3167, 36.8833)
- Ngong Road (-1.3032, 36.7827)
- Thika Road - Roysambu (-1.2167, 36.8833)
- Mombasa Road - South B (-1.3167, 36.8333)

### Test Scenarios
1. **CBD to CBD Delivery** - Short distance within CBD
2. **Shopping Trip - Westlands** - Shopping with multiple items
3. **Long Distance Delivery** - Long distance delivery test
4. **High Value Items** - High value items test
5. **Multiple Small Items** - Multiple small items with quantities

## Expected Results

### Pricing Model
- **Base Price:** KES 500 (up to 15km)
- **Distance Charge:** KES 30 per km (beyond 15km)
- **Items Price:** Sum of (item price × quantity)

### Commission Rates
- **CBD Service:** 30% company, 70% assistant
- **Standard Service:** 25% company, 75% assistant
- **Premium Service:** 40% company, 60% assistant

## Troubleshooting

### Common Issues
1. **Tests not loading:** Ensure all test files are in the correct directory
2. **API errors:** Check if backend endpoints are available
3. **Performance issues:** Monitor browser console for errors
4. **Calculation discrepancies:** Verify test data and expected results

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL for additional logging.

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add performance considerations
4. Update this README with new test coverage

## Dependencies

- React (for UI components)
- @turf/turf (for distance calculations)
- Commission calculator utility
- Nairobi CBD geofence utility
- Price calculator component