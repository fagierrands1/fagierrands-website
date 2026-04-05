// src/utils/testNairobiCBDCoordinates.js
// Test file to validate the updated Nairobi CBD coordinates

import {
  NAIROBI_CBD_COORDINATES,
  NAIROBI_CBD_CENTER,
  CBD_LANDMARKS,
  isPointInNairobiCBD,
  getCBDGeofenceStatus,
  formatGeofenceStatus,
  distanceToNairobiCBD,
  getNearestCBDEntryPoint
} from './nairobiCBDGeofence';

/**
 * Test the updated Nairobi CBD coordinates
 */
export const testNairobiCBDCoordinates = () => {
  console.log('🧪 Testing Updated Nairobi CBD Coordinates...\n');
  
  // Test 1: Verify polygon coordinates
  console.log('📍 Updated CBD Coordinates:');
  NAIROBI_CBD_COORDINATES.forEach((coord, index) => {
    console.log(`  ${index + 1}. [${coord[0]}, ${coord[1]}]`);
  });
  console.log(`\n🎯 CBD Center: [${NAIROBI_CBD_CENTER.longitude}, ${NAIROBI_CBD_CENTER.latitude}]\n`);
  
  // Test 2: Test known locations within CBD
  console.log('✅ Testing Known CBD Locations:');
  
  const testLocations = [
    {
      name: 'University of Nairobi (should be IN)',
      lat: -1.2841,
      lng: 36.8193
    },
    {
      name: 'Times Tower (should be IN)',
      lat: -1.2912,
      lng: 36.8256
    },
    {
      name: 'Harambee House (should be IN)',
      lat: -1.2910,
      lng: 36.8212
    },
    {
      name: 'Railway Station (should be IN)',
      lat: -1.2901,
      lng: 36.8290
    },
    {
      name: 'Jeevanjee Gardens (should be IN)',
      lat: -1.2870,
      lng: 36.8170
    },
    {
      name: 'Westlands (should be OUT)',
      lat: -1.2676,
      lng: 36.8108
    },
    {
      name: 'Karen (should be OUT)',
      lat: -1.3197,
      lng: 36.6854
    },
    {
      name: 'JKIA (should be OUT)',
      lat: -1.3192,
      lng: 36.9278
    }
  ];
  
  testLocations.forEach(location => {
    const isInCBD = isPointInNairobiCBD(location);
    const status = getCBDGeofenceStatus(location);
    const formattedStatus = formatGeofenceStatus(status);
    
    console.log(`  ${location.name}:`);
    console.log(`    In CBD: ${isInCBD ? '✅ YES' : '❌ NO'}`);
    console.log(`    Zone: ${formattedStatus.zone}`);
    console.log(`    Distance: ${formattedStatus.distance.toFixed(3)} km`);
    console.log(`    Status: ${formattedStatus.message}`);
    console.log('');
  });
  
  // Test 3: Test landmarks
  console.log('🏛️ Testing CBD Landmarks:');
  Object.entries(CBD_LANDMARKS).forEach(([key, landmark]) => {
    const isInCBD = isPointInNairobiCBD(landmark);
    const distance = distanceToNairobiCBD(landmark);
    
    console.log(`  ${landmark.name}:`);
    console.log(`    Coordinates: [${landmark.longitude}, ${landmark.latitude}]`);
    console.log(`    In CBD: ${isInCBD ? '✅ YES' : '❌ NO'}`);
    console.log(`    Distance: ${distance.toFixed(3)} km`);
    console.log('');
  });
  
  // Test 4: Test boundary edge cases
  console.log('🔍 Testing Boundary Edge Cases:');
  
  const boundaryTests = [
    {
      name: 'Just outside University area',
      lat: -1.2840,
      lng: 36.8190
    },
    {
      name: 'Just outside Railway area',
      lat: -1.2905,
      lng: 36.8295
    },
    {
      name: 'Just outside Jeevanjee area',
      lat: -1.2875,
      lng: 36.8160
    }
  ];
  
  boundaryTests.forEach(location => {
    const isInCBD = isPointInNairobiCBD(location);
    const distance = distanceToNairobiCBD(location);
    const nearestEntry = getNearestCBDEntryPoint(location);
    
    console.log(`  ${location.name}:`);
    console.log(`    In CBD: ${isInCBD ? '✅ YES' : '❌ NO'}`);
    console.log(`    Distance: ${distance.toFixed(3)} km`);
    if (nearestEntry) {
      console.log(`    Nearest Entry: ${nearestEntry.description} (${nearestEntry.distance.toFixed(3)} km)`);
    }
    console.log('');
  });
  
  // Test 5: Validate polygon closure
  console.log('🔄 Validating Polygon Closure:');
  const firstPoint = NAIROBI_CBD_COORDINATES[0];
  const lastPoint = NAIROBI_CBD_COORDINATES[NAIROBI_CBD_COORDINATES.length - 1];
  const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
  
  console.log(`  First point: [${firstPoint[0]}, ${firstPoint[1]}]`);
  console.log(`  Last point: [${lastPoint[0]}, ${lastPoint[1]}]`);
  console.log(`  Polygon closed: ${isClosed ? '✅ YES' : '❌ NO'}`);
  
  if (!isClosed) {
    console.log('  ⚠️ Warning: Polygon is not properly closed!');
  }
  
  console.log('\n🎉 Coordinate testing completed!');
  
  return {
    coordinatesCount: NAIROBI_CBD_COORDINATES.length,
    isClosed,
    testResults: testLocations.map(loc => ({
      ...loc,
      inCBD: isPointInNairobiCBD(loc),
      distance: distanceToNairobiCBD(loc)
    }))
  };
};

/**
 * Quick validation function for production use
 */
export const validateCBDCoordinates = () => {
  try {
    // Test basic functionality
    const testPoint = { lat: -1.2876, lng: 36.8228 }; // CBD center
    const isInCBD = isPointInNairobiCBD(testPoint);
    const status = getCBDGeofenceStatus(testPoint);
    
    if (!isInCBD) {
      throw new Error('CBD center point is not detected as inside CBD');
    }
    
    if (status.zone !== 'inside_cbd') {
      throw new Error('CBD center point status is incorrect');
    }
    
    // Test polygon closure
    const firstPoint = NAIROBI_CBD_COORDINATES[0];
    const lastPoint = NAIROBI_CBD_COORDINATES[NAIROBI_CBD_COORDINATES.length - 1];
    const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
    
    if (!isClosed) {
      throw new Error('CBD polygon is not properly closed');
    }
    
    console.log('✅ CBD coordinates validation passed');
    return true;
  } catch (error) {
    console.error('❌ CBD coordinates validation failed:', error.message);
    return false;
  }
};

// Export for use in other components
export default {
  testNairobiCBDCoordinates,
  validateCBDCoordinates
};