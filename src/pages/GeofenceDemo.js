// src/pages/GeofenceDemo.js
import React, { useState, useEffect } from 'react';
import OpenLayersMapComponent from '../components/Common/OpenLayersMapComponent';
import GoogleMapComponent from '../components/Common/GoogleMapComponent';
import { useNairobiCBDGeofence } from '../hooks/useNairobiCBDGeofence';
import { FaPlay, FaStop, FaMapMarkerAlt, FaShieldAlt, FaExclamationTriangle, FaFlask } from 'react-icons/fa';
import { 
  NAIROBI_CBD_COORDINATES, 
  CBD_LANDMARKS, 
  isPointInNairobiCBD, 
  getCBDGeofenceStatus,
  distanceToNairobiCBD 
} from '../utils/nairobiCBDGeofence';
import { debugGeofence, validateCoordinates } from '../utils/debugGeofence';
import { distanceCalculator, DISTANCE_METHODS } from '../utils/enhancedDistanceCalculator';
import { preloadMapboxTiles } from '../utils/cachedMapboxSource';

const GeofenceDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bufferDistance, setBufferDistance] = useState(1);
  const [restrictToCBD, setRestrictToCBD] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mapType, setMapType] = useState('mapbox'); // 'openlayers' or 'mapbox' - default to Mapbox

  const {
    currentLocation,
    geofenceStatus,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
    isInCBD,
    isInBufferZone,
    distanceToCBD,
    zone
  } = useNairobiCBDGeofence({
    bufferDistance,
    enableRealTimeTracking: false,
    onEnterCBD: (status) => {
      addNotification('🎉 Entered Nairobi CBD!', 'success');
    },
    onExitCBD: (status) => {
      addNotification('👋 Left Nairobi CBD', 'info');
    },
    onEnterBufferZone: (status) => {
      addNotification(`⚠️ Entered CBD buffer zone (${bufferDistance}km)`, 'warning');
    },
    onExitBufferZone: (status) => {
      addNotification('📍 Left CBD buffer zone', 'info');
    },
    onStatusChange: (newStatus, oldStatus) => {
      console.log('Geofence status changed:', { newStatus, oldStatus });
    }
  });

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleGeofenceStatusChange = (status) => {
    // This is called from the map component when location changes
    console.log('Map geofence status:', status);
  };

  const getStatusIcon = (zone) => {
    switch (zone) {
      case 'inside_cbd':
        return <FaShieldAlt className="text-green-500" />;
      case 'buffer_zone':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'outside':
        return <FaMapMarkerAlt className="text-red-500" />;
      default:
        return <FaMapMarkerAlt className="text-gray-500" />;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const testCoordinates = () => {
    console.log('🧪 Testing Updated Nairobi CBD Coordinates...');
    
    // Test known locations
    const testLocations = [
      { name: 'University of Nairobi', lat: -1.2841, lng: 36.8193, expected: true },
      { name: 'Times Tower', lat: -1.2912, lng: 36.8256, expected: true },
      { name: 'Railway Station', lat: -1.2901, lng: 36.8290, expected: true },
      { name: 'Westlands (outside)', lat: -1.2676, lng: 36.8108, expected: false },
      { name: 'Karen (outside)', lat: -1.3197, lng: 36.6854, expected: false }
    ];
    
    let results = [];
    testLocations.forEach(location => {
      const isInCBD = isPointInNairobiCBD(location);
      const distance = distanceToNairobiCBD(location);
      const status = getCBDGeofenceStatus(location);
      
      const result = {
        name: location.name,
        expected: location.expected,
        actual: isInCBD,
        passed: location.expected === isInCBD,
        distance: distance.toFixed(3),
        zone: status.zone
      };
      
      results.push(result);
      console.log(`${result.passed ? '✅' : '❌'} ${result.name}: Expected ${result.expected ? 'IN' : 'OUT'}, Got ${result.actual ? 'IN' : 'OUT'} (${result.distance}km)`);
    });
    
    // Test landmarks
    console.log('\n🏛️ Testing CBD Landmarks:');
    Object.entries(CBD_LANDMARKS).forEach(([key, landmark]) => {
      const isInCBD = isPointInNairobiCBD(landmark);
      const distance = distanceToNairobiCBD(landmark);
      console.log(`${isInCBD ? '✅' : '❌'} ${landmark.name}: ${isInCBD ? 'IN' : 'OUT'} CBD (${distance.toFixed(3)}km)`);
    });
    
    // Show polygon info
    console.log(`\n📍 Polygon has ${NAIROBI_CBD_COORDINATES.length} points`);
    console.log('First point:', NAIROBI_CBD_COORDINATES[0]);
    console.log('Last point:', NAIROBI_CBD_COORDINATES[NAIROBI_CBD_COORDINATES.length - 1]);
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    addNotification(`🧪 Coordinate test completed: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warning');
    
    return results;
  };

  const runDebugTests = () => {
    console.log('🔧 Running debug tests...');
    
    // Validate coordinates
    const validation = validateCoordinates();
    console.log('Coordinate validation:', validation);
    
    if (!validation.isValid) {
      addNotification(`❌ Coordinate validation failed: ${validation.issues.join(', ')}`, 'error');
      return;
    }
    
    // Run debug
    debugGeofence();
    
    addNotification('🔧 Debug tests completed - check console for details', 'info');
  };

  const testDistanceCalculations = () => {
    console.log('📏 Testing Distance Calculations...');
    
    // Test locations with known distances
    const testLocations = [
      {
        name: 'CBD Center (University of Nairobi)',
        lat: -1.2841,
        lng: 36.8193,
        expectedDistance: 0, // Should be inside CBD
        description: 'Inside CBD - should return 0'
      },
      {
        name: 'Times Tower',
        lat: -1.2912,
        lng: 36.8256,
        expectedDistance: 0, // Should be inside CBD
        description: 'Inside CBD - should return 0'
      },
      {
        name: 'Westlands Shopping Mall',
        lat: -1.2676,
        lng: 36.8108,
        expectedDistance: 2.5, // Approximate distance
        description: 'Outside CBD - northwest'
      },
      {
        name: 'Karen Country Club',
        lat: -1.3197,
        lng: 36.6854,
        expectedDistance: 15, // Approximate distance
        description: 'Far outside CBD - southwest'
      },
      {
        name: 'JKIA Airport',
        lat: -1.3192,
        lng: 36.9278,
        expectedDistance: 12, // Approximate distance
        description: 'Far outside CBD - southeast'
      },
      {
        name: 'Kasarani Stadium',
        lat: -1.2194,
        lng: 36.8903,
        expectedDistance: 8, // Approximate distance
        description: 'Outside CBD - northeast'
      },
      {
        name: 'Just outside CBD (North)',
        lat: -1.2830,
        lng: 36.8200,
        expectedDistance: 0.2, // Very close
        description: 'Just outside north boundary'
      },
      {
        name: 'Just outside CBD (South)',
        lat: -1.2920,
        lng: 36.8250,
        expectedDistance: 0.1, // Very close
        description: 'Just outside south boundary'
      }
    ];
    
    console.log('\n📊 Distance Calculation Results:');
    console.log('='.repeat(80));
    
    let totalTests = 0;
    let passedTests = 0;
    
    testLocations.forEach((location, index) => {
      try {
        const calculatedDistance = distanceToNairobiCBD(location);
        const isInCBD = isPointInNairobiCBD(location);
        const status = getCBDGeofenceStatus(location);
        
        totalTests++;
        
        // Check if result makes sense
        const isReasonable = calculatedDistance >= 0 && calculatedDistance < 50; // Within 50km is reasonable
        const isExpectedInside = location.expectedDistance === 0;
        const isActuallyInside = calculatedDistance === 0;
        const insideTestPassed = isExpectedInside === isActuallyInside;
        
        if (isReasonable && insideTestPassed) {
          passedTests++;
        }
        
        console.log(`\n${index + 1}. ${location.name}`);
        console.log(`   📍 Coordinates: [${location.lng}, ${location.lat}]`);
        console.log(`   📏 Calculated Distance: ${calculatedDistance.toFixed(3)} km`);
        console.log(`   🎯 Expected Distance: ~${location.expectedDistance} km`);
        console.log(`   🔍 In CBD: ${isInCBD ? 'YES' : 'NO'}`);
        console.log(`   🏷️  Zone: ${status.zone}`);
        console.log(`   📝 Description: ${location.description}`);
        console.log(`   ✅ Test Result: ${isReasonable && insideTestPassed ? 'PASS' : 'FAIL'}`);
        
        if (!isReasonable) {
          console.log(`   ⚠️  Warning: Distance seems unreasonable (${calculatedDistance})`);
        }
        
        if (!insideTestPassed) {
          console.log(`   ⚠️  Warning: Inside/outside detection mismatch`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error calculating distance for ${location.name}:`, error);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 Distance Test Summary: ${passedTests}/${totalTests} tests passed`);
    
    // Test with current location if available
    if (currentLocation) {
      console.log('\n📍 Current Location Distance Test:');
      try {
        const currentDistance = distanceToNairobiCBD(currentLocation);
        const currentStatus = getCBDGeofenceStatus(currentLocation);
        
        console.log(`   📍 Current Position: [${currentLocation.longitude}, ${currentLocation.latitude}]`);
        console.log(`   📏 Distance to CBD: ${currentDistance.toFixed(3)} km`);
        console.log(`   🏷️  Zone: ${currentStatus.zone}`);
        console.log(`   📝 Status: ${currentStatus.message}`);
        
      } catch (error) {
        console.error('   ❌ Error calculating current location distance:', error);
      }
    }
    
    // Test with selected location if available
    if (selectedLocation) {
      console.log('\n🎯 Selected Location Distance Test:');
      try {
        const selectedDistance = distanceToNairobiCBD(selectedLocation);
        const selectedStatus = getCBDGeofenceStatus(selectedLocation);
        
        console.log(`   📍 Selected Position: [${selectedLocation.longitude}, ${selectedLocation.latitude}]`);
        console.log(`   📏 Distance to CBD: ${selectedDistance.toFixed(3)} km`);
        console.log(`   🏷️  Zone: ${selectedStatus.zone}`);
        console.log(`   📝 Status: ${selectedStatus.message}`);
        
      } catch (error) {
        console.error('   ❌ Error calculating selected location distance:', error);
      }
    }
    
    addNotification(`📏 Distance test completed: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'warning');
    
    return { totalTests, passedTests, testLocations };
  };

  const testEnhancedDistanceCalculations = () => {
    console.log('🚀 Testing Enhanced Distance Calculations...');
    
    // Test locations for comprehensive analysis
    const testLocations = [
      {
        name: 'CBD Center (University of Nairobi)',
        lat: -1.2841,
        lng: 36.8193,
        expectedInside: true
      },
      {
        name: 'Westlands Shopping Mall',
        lat: -1.2676,
        lng: 36.8108,
        expectedInside: false
      },
      {
        name: 'Karen Country Club',
        lat: -1.3197,
        lng: 36.6854,
        expectedInside: false
      },
      {
        name: 'Edge Case - Just outside CBD',
        lat: -1.2830,
        lng: 36.8200,
        expectedInside: false
      }
    ];

    console.log('\n🔬 Enhanced Distance Analysis:');
    console.log('='.repeat(100));

    testLocations.forEach((location, index) => {
      console.log(`\n${index + 1}. ${location.name}`);
      console.log(`   📍 Coordinates: [${location.lng}, ${location.lat}]`);
      
      try {
        // Test all distance calculation methods
        const comparison = distanceCalculator.compareDistanceMethods(location);
        
        console.log(`   ⏱️  Total Execution Time: ${comparison.totalExecutionTime.toFixed(2)}ms`);
        console.log(`   📊 Statistics:`);
        console.log(`      Mean Distance: ${comparison.statistics.mean.toFixed(4)} km`);
        console.log(`      Min Distance: ${comparison.statistics.min.toFixed(4)} km`);
        console.log(`      Max Distance: ${comparison.statistics.max.toFixed(4)} km`);
        console.log(`      Std Deviation: ${comparison.statistics.standardDeviation.toFixed(4)} km`);
        
        console.log(`   🎯 Recommended Method: ${comparison.recommendation.method}`);
        console.log(`   💡 Reason: ${comparison.recommendation.reason}`);
        console.log(`   📏 Recommended Distance: ${comparison.recommendation.distance.toFixed(4)} km`);
        
        console.log(`   📋 Method Comparison:`);
        Object.entries(comparison.results).forEach(([method, result]) => {
          const status = result.distance === 0 ? '🟢 INSIDE' : 
                        result.distance < 1 ? '🟡 NEAR' : 
                        result.distance < 5 ? '🟠 MEDIUM' : '🔴 FAR';
          
          console.log(`      ${method}: ${result.distance.toFixed(4)} km (${result.executionTime.toFixed(2)}ms) ${status}`);
          
          if (result.error) {
            console.log(`         ❌ Error: ${result.error}`);
          }
        });

        // Validate coordinate accuracy
        const validation = distanceCalculator.validateCoordinates(location);
        if (!validation.valid) {
          console.log(`   ⚠️  Coordinate Validation: ${validation.error}`);
        } else if (validation.warning) {
          console.log(`   ⚠️  Warning: ${validation.warning}`);
        } else {
          console.log(`   ✅ Coordinates Valid`);
        }

      } catch (error) {
        console.error(`   ❌ Error in enhanced distance calculation:`, error);
      }
    });

    // Test with current and selected locations
    if (currentLocation) {
      console.log('\n📍 Current Location Enhanced Analysis:');
      try {
        const comparison = distanceCalculator.compareDistanceMethods(currentLocation);
        console.log(`   🎯 Recommended Distance: ${comparison.recommendation.distance.toFixed(4)} km`);
        console.log(`   ⏱️  Execution Time: ${comparison.totalExecutionTime.toFixed(2)}ms`);
      } catch (error) {
        console.error('   ❌ Error analyzing current location:', error);
      }
    }

    if (selectedLocation) {
      console.log('\n🎯 Selected Location Enhanced Analysis:');
      try {
        const comparison = distanceCalculator.compareDistanceMethods(selectedLocation);
        console.log(`   🎯 Recommended Distance: ${comparison.recommendation.distance.toFixed(4)} km`);
        console.log(`   ⏱️  Execution Time: ${comparison.totalExecutionTime.toFixed(2)}ms`);
      } catch (error) {
        console.error('   ❌ Error analyzing selected location:', error);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('🎉 Enhanced Distance Analysis Complete!');
    
    addNotification('🚀 Enhanced distance analysis completed - check console for detailed results', 'success');
  };

  const testDistanceMethodComparison = () => {
    console.log('⚖️ Distance Method Comparison Test...');
    
    // Test point outside CBD
    const testPoint = { lat: -1.2676, lng: 36.8108 }; // Westlands
    
    console.log(`\n📍 Test Point: Westlands (${testPoint.lat}, ${testPoint.lng})`);
    console.log('🔄 Comparing all distance calculation methods...\n');
    
    try {
      const comparison = distanceCalculator.compareDistanceMethods(testPoint);
      
      // Display results in a formatted table
      console.log('📊 Method Comparison Results:');
      console.log('┌─────────────────────────┬──────────────┬──────────────┬─────────────┐');
      console.log('│ Method                  │ Distance (km)│ Time (ms)    │ Status      │');
      console.log('├─────────────────────────┼──────────────┼──────────────┼─────────────┤');
      
      Object.entries(comparison.results).forEach(([method, result]) => {
        const distance = result.distance === Infinity ? 'ERROR' : result.distance.toFixed(4);
        const time = result.executionTime.toFixed(2);
        const status = result.error ? 'ERROR' : 'OK';
        
        console.log(`│ ${method.padEnd(23)} │ ${distance.padEnd(12)} │ ${time.padEnd(12)} │ ${status.padEnd(11)} │`);
      });
      
      console.log('└─────────────────────────┴──────────────┴──────────────┴─────────────┘');
      
      console.log(`\n📈 Statistics:`);
      console.log(`   Mean: ${comparison.statistics.mean.toFixed(4)} km`);
      console.log(`   Range: ${comparison.statistics.min.toFixed(4)} - ${comparison.statistics.max.toFixed(4)} km`);
      console.log(`   Std Dev: ${comparison.statistics.standardDeviation.toFixed(4)} km`);
      
      console.log(`\n🏆 Recommendation: ${comparison.recommendation.method}`);
      console.log(`   Distance: ${comparison.recommendation.distance.toFixed(4)} km`);
      console.log(`   Reason: ${comparison.recommendation.reason}`);
      
      addNotification(`⚖️ Method comparison: ${comparison.recommendation.method} recommended (${comparison.recommendation.distance.toFixed(3)} km)`, 'info');
      
    } catch (error) {
      console.error('❌ Error in method comparison:', error);
      addNotification('❌ Error in distance method comparison', 'error');
    }
  };

  const preloadSatelliteTiles = async () => {
    try {
      addNotification('🚀 Starting satellite tile preloading...', 'info');
      console.log('🚀 Preloading satellite tiles for Nairobi CBD area...');
      
      await preloadMapboxTiles(['satellite_streets', 'satellite']);
      
      addNotification('✅ Satellite tiles preloaded successfully!', 'success');
      console.log('✅ Satellite tile preloading completed');
    } catch (error) {
      console.error('❌ Error preloading satellite tiles:', error);
      addNotification('❌ Error preloading satellite tiles', 'error');
    }
  };

  // Show caching info when switching to Mapbox
  React.useEffect(() => {
    if (mapType === 'mapbox') {
      addNotification('🛰️ Mapbox satellite maps with smart caching enabled - tiles will be cached for faster loading!', 'info');
    }
  }, [mapType]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Nairobi CBD Geofencing Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Interactive Geofenced Map</h2>
              
              {/* Map Controls */}
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={isTracking ? stopTracking : startTracking}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                      isTracking
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isTracking ? <FaStop className="mr-2" /> : <FaPlay className="mr-2" />}
                    {isTracking ? 'Stop Tracking' : 'Start Real-time Tracking'}
                  </button>
                  
                  <button
                    onClick={getCurrentLocation}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Get Current Location
                  </button>
                  
                  <button
                    onClick={testCoordinates}
                    className="flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
                  >
                    <FaFlask className="mr-2" />
                    Test Coordinates
                  </button>
                  
                  <button
                    onClick={runDebugTests}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                  >
                    Debug Geofence
                  </button>
                  
                  <button
                    onClick={testDistanceCalculations}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium"
                  >
                    Test Distances
                  </button>
                  
                  <button
                    onClick={testEnhancedDistanceCalculations}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  >
                    Enhanced Distance Test
                  </button>
                  
                  <button
                    onClick={testDistanceMethodComparison}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
                  >
                    Compare Methods
                  </button>
                  
                  <button
                    onClick={preloadSatelliteTiles}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    🛰️ Preload Tiles
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center">
                    <span className="mr-2 text-sm font-medium">Buffer Distance:</span>
                    <select
                      value={bufferDistance}
                      onChange={(e) => setBufferDistance(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={0.5}>0.5 km</option>
                      <option value={1}>1 km</option>
                      <option value={2}>2 km</option>
                      <option value={3}>3 km</option>
                      <option value={5}>5 km</option>
                    </select>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={restrictToCBD}
                      onChange={(e) => setRestrictToCBD(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Restrict to CBD only</span>
                  </label>
                </div>
                
                {/* Map Type Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Map Engine:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setMapType('openlayers')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        mapType === 'openlayers'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      OpenLayers
                    </button>
                    <button
                      onClick={() => setMapType('mapbox')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        mapType === 'mapbox'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Mapbox 🛰️
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Map Component */}
              {mapType === 'openlayers' ? (
                <OpenLayersMapComponent
                  onLocationSelect={handleLocationSelect}
                  onGeofenceStatusChange={handleGeofenceStatusChange}
                  selectedLocation={selectedLocation}
                  currentLocation={currentLocation}
                  bufferDistance={bufferDistance}
                  restrictToCBD={restrictToCBD}
                  showLandmarks={true}
                  showBufferZone={true}
                  height="500px"
                />
              ) : (
                <GoogleMapComponent
                  onLocationSelect={handleLocationSelect}
                  onGeofenceStatusChange={handleGeofenceStatusChange}
                  selectedLocation={selectedLocation}
                  currentLocation={currentLocation}
                  height="500px"
                  showControls={true}
                />
              )}
            </div>
          </div>
          
          {/* Status Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Geofence Status</h3>
              
              {geofenceStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    {getStatusIcon(geofenceStatus.zone)}
                    <span className="ml-2 font-medium">{geofenceStatus.zone.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  
                  <div className={`p-3 rounded-lg`} style={{
                    backgroundColor: geofenceStatus.backgroundColor,
                    color: geofenceStatus.color
                  }}>
                    <p className="text-sm font-medium">{geofenceStatus.message}</p>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><strong>In CBD:</strong> {isInCBD ? 'Yes' : 'No'}</p>
                    <p><strong>In Buffer Zone:</strong> {isInBufferZone ? 'Yes' : 'No'}</p>
                    <p><strong>Distance to CBD:</strong> {distanceToCBD.toFixed(3)} km</p>
                    <p><strong>Distance (meters):</strong> {(distanceToCBD * 1000).toFixed(0)} m</p>
                    {geofenceStatus.nearestEntry && (
                      <>
                        <p><strong>Nearest Entry:</strong> {geofenceStatus.nearestEntry.distance.toFixed(3)} km</p>
                        <p><strong>Entry Point:</strong> {geofenceStatus.nearestEntry.description}</p>
                      </>
                    )}
                    <p><strong>Zone:</strong> {geofenceStatus.zone.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No location data available</p>
              )}
            </div>
            
            {/* Real-time Tracking Status */}
            {isTracking && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Real-time Tracking</h3>
                
                {currentLocation ? (
                  <div className="text-sm space-y-1">
                    <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
                    {currentLocation.accuracy && (
                      <p><strong>Accuracy:</strong> ±{Math.round(currentLocation.accuracy)}m</p>
                    )}
                    {currentLocation.speed && (
                      <p><strong>Speed:</strong> {Math.round(currentLocation.speed * 3.6)} km/h</p>
                    )}
                    <p><strong>Last Update:</strong> {currentLocation.timestamp?.toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Waiting for location data...</p>
                )}
              </div>
            )}
            
            {/* Selected Location */}
            {selectedLocation && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Selected Location</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {selectedLocation.name}</p>
                  <p><strong>Latitude:</strong> {selectedLocation.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {selectedLocation.longitude.toFixed(6)}</p>
                  
                  {/* Calculate and display enhanced distance for selected location */}
                  {(() => {
                    try {
                      const selectedDistance = distanceToNairobiCBD(selectedLocation);
                      const selectedIsInCBD = isPointInNairobiCBD(selectedLocation);
                      const selectedStatus = getCBDGeofenceStatus(selectedLocation);
                      // Get enhanced distance analysis
                      let enhancedResult = null;
                      try {
                        enhancedResult = distanceCalculator.distanceToCBDBoundary(selectedLocation);
                      } catch (enhancedError) {
                        console.warn('Enhanced distance calculation failed:', enhancedError);
                      }
                      
                      return (
                        <>
                          <hr className="my-2" />
                          <p><strong>Distance to CBD:</strong> {selectedDistance.toFixed(3)} km</p>
                          <p><strong>Distance (meters):</strong> {(selectedDistance * 1000).toFixed(0)} m</p>
                          {enhancedResult && enhancedResult.method && (
                            <p><strong>Method:</strong> {enhancedResult.method.replace('_', ' ')}</p>
                          )}
                          <p><strong>In CBD:</strong> {selectedIsInCBD ? 'Yes' : 'No'}</p>
                          <p><strong>Zone:</strong> {selectedStatus.zone.replace('_', ' ').toUpperCase()}</p>
                          {enhancedResult && enhancedResult.nearestPoint && (
                            <p><strong>Nearest Point:</strong> {enhancedResult.nearestPoint.latitude.toFixed(6)}, {enhancedResult.nearestPoint.longitude.toFixed(6)}</p>
                          )}
                          <div className={`mt-2 p-2 rounded text-xs`} style={{
                            backgroundColor: selectedStatus.backgroundColor,
                            color: selectedStatus.color
                          }}>
                            {selectedStatus.message}
                          </div>
                          {enhancedResult && enhancedResult.calculationDetails && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                              <strong>Calculation:</strong> {enhancedResult.calculationDetails.method}
                              {enhancedResult.calculationDetails.note && (
                                <div className="text-gray-600">{enhancedResult.calculationDetails.note}</div>
                              )}
                            </div>
                          )}
                      
                        </>
                      );
                    } catch (error) {
                      return (
                        <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-xs">
                          Error calculating distance: {error.message}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
            
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-2 rounded text-sm ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <p>{notification.message}</p>
                      <p className="text-xs opacity-75">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No notifications yet</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Distance Calculator */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Manual Distance Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Test Any Coordinates:</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Latitude (e.g., -1.2876)"
                    step="0.000001"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    id="test-lat"
                  />
                  <input
                    type="number"
                    placeholder="Longitude (e.g., 36.8228)"
                    step="0.000001"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    id="test-lng"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const lat = parseFloat(document.getElementById('test-lat').value);
                      const lng = parseFloat(document.getElementById('test-lng').value);
                      
                      if (isNaN(lat) || isNaN(lng)) {
                        addNotification('Please enter valid coordinates', 'error');
                        return;
                      }
                      
                      try {
                        const testPoint = { lat, lng };
                        const distance = distanceToNairobiCBD(testPoint);
                          const isInCBD = isPointInNairobiCBD(testPoint);
                      const status = getCBDGeofenceStatus(testPoint);
                        
                        console.log(`\n📍 Manual Distance Test:`);
                        console.log(`   Coordinates: [${lng}, ${lat}]`);
                        console.log(`   Distance: ${distance.toFixed(3)} km`);
                          console.log(`   In CBD: ${isInCBD ? 'YES' : 'NO'}`);
                      console.log(`   Zone: ${status.zone}`);
                        console.log(`   Status: ${status.message}`);
                        
                        addNotification(`📏 Distance: ${distance.toFixed(3)} km | Zone: ${status.zone}`, 'info');
                      } catch (error) {
                        console.error('Error calculating distance:', error);
                        addNotification(`Error: ${error.message}`, 'error');
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Calculate Distance
                  </button>
                  
                  <button
                    onClick={() => {
                      const lat = parseFloat(document.getElementById('test-lat').value);
                      const lng = parseFloat(document.getElementById('test-lng').value);
                      
                      if (isNaN(lat) || isNaN(lng)) {
                        addNotification('Please enter valid coordinates', 'error');
                        return;
                      }
                      
                      try {
                        const testPoint = { lat, lng };
                        
                        console.log(`\n🚀 Enhanced Manual Distance Test:`);
                        console.log(`   Coordinates: [${lng}, ${lat}]`);
                        
                        // Run enhanced analysis
                        const comparison = distanceCalculator.compareDistanceMethods(testPoint);
                        
                        console.log(`   🎯 Recommended: ${comparison.recommendation.method}`);
                        console.log(`   📏 Distance: ${comparison.recommendation.distance.toFixed(4)} km`);
                        console.log(`   ⏱️  Time: ${comparison.totalExecutionTime.toFixed(2)}ms`);
                        
                        // Validate coordinates
                        const validation = distanceCalculator.validateCoordinates(testPoint);
                        if (validation.warning) {
                          console.log(`   ⚠️  ${validation.warning}`);
                        }
                        
                        addNotification(`🚀 Enhanced: ${comparison.recommendation.distance.toFixed(3)} km (${comparison.recommendation.method})`, 'success');
                      } catch (error) {
                        console.error('Error in enhanced calculation:', error);
                        addNotification(`Enhanced calculation error: ${error.message}`, 'error');
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm"
                  >
                    Enhanced Analysis
                  </button>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quick Test Locations:</h4>
              <div className="space-y-2">
                {[
                  { name: 'CBD Center', lat: -1.2876, lng: 36.8228 },
                  { name: 'Westlands', lat: -1.2676, lng: 36.8108 },
                  { name: 'Karen', lat: -1.3197, lng: 36.6854 },
                  { name: 'JKIA', lat: -1.3192, lng: 36.9278 }
                ].map((location, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      document.getElementById('test-lat').value = location.lat;
                      document.getElementById('test-lng').value = location.lng;
                    }}
                    className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    {location.name} ({location.lat}, {location.lng})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Map Interaction:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Click anywhere on the map to select a location</li>
                <li>• Switch between OpenLayers and Mapbox engines</li>
                <li>• Use style switcher for satellite/street views</li>
                <li>• Green area shows Nairobi CBD boundaries</li>
                <li>• Yellow dashed area shows buffer zone</li>
                <li>• Click markers for detailed location info</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Real-time Tracking:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Click "Start Real-time Tracking" to monitor your location</li>
                <li>• Notifications will appear when entering/leaving zones</li>
                <li>• Adjust buffer distance to change warning zone size</li>
                <li>• Enable "Restrict to CBD only" to limit location selection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Testing Features:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• "Test Coordinates" - Validate CBD boundary detection</li>
                <li>• "Test Distances" - Comprehensive distance calculations</li>
                <li>• "Enhanced Distance Test" - Multi-algorithm analysis</li>
                <li>• "Compare Methods" - Algorithm performance comparison</li>
                <li>• "🛰️ Preload Tiles" - Cache satellite maps for faster loading</li>
                <li>• "Debug Geofence" - Technical diagnostics</li>
                <li>• Manual calculator - Test any coordinates with enhanced analysis</li>
                <li>• Check console for detailed results and statistics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Caching Features:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Automatic tile caching for satellite maps</li>
                <li>• Cache statistics shown in map legend</li>
                <li>• 50MB cache limit with 7-day expiration</li>
                <li>• Preload tiles to reduce API usage</li>
                <li>• Clear cache option in map controls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeofenceDemo;