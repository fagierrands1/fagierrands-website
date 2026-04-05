// src/utils/debugGeofence.js
// Debug utilities for geofencing issues

import * as turf from '@turf/turf';
import { NAIROBI_CBD_COORDINATES, NAIROBI_CBD_POLYGON } from './nairobiCBDGeofence';

export const debugGeofence = () => {
  console.log('🔍 Debugging Geofence Setup...');
  
  // Test 1: Check coordinates
  console.log('📍 CBD Coordinates:', NAIROBI_CBD_COORDINATES);
  console.log('📍 Coordinates length:', NAIROBI_CBD_COORDINATES.length);
  
  // Test 2: Check polygon creation
  console.log('🔷 CBD Polygon:', NAIROBI_CBD_POLYGON);
  console.log('🔷 Polygon type:', NAIROBI_CBD_POLYGON.type);
  console.log('🔷 Polygon geometry:', NAIROBI_CBD_POLYGON.geometry);
  
  // Test 3: Test basic turf operations
  try {
    const testPoint = turf.point([36.8228, -1.2876]); // CBD center
    console.log('📍 Test point:', testPoint);
    
    const isInside = turf.booleanPointInPolygon(testPoint, NAIROBI_CBD_POLYGON);
    console.log('✅ Point in polygon test:', isInside);
    
    // Test LineString creation
    const boundaryLine = turf.lineString(NAIROBI_CBD_COORDINATES);
    console.log('📏 Boundary line:', boundaryLine);
    
    // Test distance calculation
    const distance = turf.pointToLineDistance(testPoint, boundaryLine, { units: 'kilometers' });
    console.log('📏 Distance to line:', distance);
    
    // Test nearest point
    const nearestPoint = turf.nearestPointOnLine(boundaryLine, testPoint);
    console.log('📍 Nearest point:', nearestPoint);
    
  } catch (error) {
    console.error('❌ Error in basic turf operations:', error);
  }
  
  // Test 4: Test with outside point
  try {
    const outsidePoint = turf.point([36.8108, -1.2676]); // Westlands
    console.log('📍 Outside test point:', outsidePoint);
    
    const isInside = turf.booleanPointInPolygon(outsidePoint, NAIROBI_CBD_POLYGON);
    console.log('✅ Outside point in polygon test:', isInside);
    
    const boundaryLine = turf.lineString(NAIROBI_CBD_COORDINATES);
    const distance = turf.pointToLineDistance(outsidePoint, boundaryLine, { units: 'kilometers' });
    console.log('📏 Distance from outside point:', distance);
    
  } catch (error) {
    console.error('❌ Error testing outside point:', error);
  }
  
  console.log('🎉 Debug complete!');
};

export const validateCoordinates = () => {
  const issues = [];
  
  // Check if coordinates are valid
  if (!NAIROBI_CBD_COORDINATES || !Array.isArray(NAIROBI_CBD_COORDINATES)) {
    issues.push('CBD coordinates are not an array');
  }
  
  if (NAIROBI_CBD_COORDINATES.length < 4) {
    issues.push('Not enough coordinates for a polygon (minimum 4 required)');
  }
  
  // Check if polygon is closed
  const first = NAIROBI_CBD_COORDINATES[0];
  const last = NAIROBI_CBD_COORDINATES[NAIROBI_CBD_COORDINATES.length - 1];
  
  if (first[0] !== last[0] || first[1] !== last[1]) {
    issues.push('Polygon is not closed (first and last points do not match)');
  }
  
  // Check coordinate format
  NAIROBI_CBD_COORDINATES.forEach((coord, index) => {
    if (!Array.isArray(coord) || coord.length !== 2) {
      issues.push(`Invalid coordinate at index ${index}: ${coord}`);
    }
    
    const [lng, lat] = coord;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      issues.push(`Non-numeric coordinates at index ${index}: [${lng}, ${lat}]`);
    }
    
    // Check if coordinates are in reasonable range for Nairobi
    if (lng < 36.5 || lng > 37.5 || lat < -1.5 || lat > -1.0) {
      issues.push(`Coordinates out of Nairobi range at index ${index}: [${lng}, ${lat}]`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

export default {
  debugGeofence,
  validateCoordinates
};