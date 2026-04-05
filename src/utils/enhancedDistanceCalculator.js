// src/utils/enhancedDistanceCalculator.js
// Enhanced distance calculation utilities with multiple algorithms and improved accuracy

import * as turf from '@turf/turf';
import { NAIROBI_CBD_COORDINATES, NAIROBI_CBD_POLYGON } from './nairobiCBDGeofence';

/**
 * Distance calculation methods enum
 */
export const DISTANCE_METHODS = {
  HAVERSINE: 'haversine',
  VINCENTY: 'vincenty',
  TURF_DISTANCE: 'turf_distance',
  TURF_POINT_TO_LINE: 'turf_point_to_line',
  GREAT_CIRCLE: 'great_circle'
};

/**
 * Enhanced distance calculator with multiple algorithms
 */
export class EnhancedDistanceCalculator {
  constructor() {
    this.cbdPolygon = NAIROBI_CBD_POLYGON;
    this.cbdBoundaryLine = turf.lineString(NAIROBI_CBD_COORDINATES);
    this.cbdCenter = turf.centroid(this.cbdPolygon);
  }

  /**
   * Calculate distance using Haversine formula (most accurate for short distances)
   * @param {object} point1 - {lat, lng} or {latitude, longitude}
   * @param {object} point2 - {lat, lng} or {latitude, longitude}
   * @returns {number} Distance in kilometers
   */
  haversineDistance(point1, point2) {
    const lat1 = point1.lat || point1.latitude;
    const lng1 = point1.lng || point1.longitude;
    const lat2 = point2.lat || point2.latitude;
    const lng2 = point2.lng || point2.longitude;

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate distance using Vincenty formula (most accurate for long distances)
   * @param {object} point1 - {lat, lng} or {latitude, longitude}
   * @param {object} point2 - {lat, lng} or {latitude, longitude}
   * @returns {number} Distance in kilometers
   */
  vincentyDistance(point1, point2) {
    const lat1 = this.toRadians(point1.lat || point1.latitude);
    const lng1 = this.toRadians(point1.lng || point1.longitude);
    const lat2 = this.toRadians(point2.lat || point2.latitude);
    const lng2 = this.toRadians(point2.lng || point2.longitude);

    const a = 6378137; // WGS-84 semi-major axis
    const b = 6356752.314245; // WGS-84 semi-minor axis
    const f = 1 / 298.257223563; // WGS-84 flattening

    const L = lng2 - lng1;
    const U1 = Math.atan((1 - f) * Math.tan(lat1));
    const U2 = Math.atan((1 - f) * Math.tan(lat2));
    const sinU1 = Math.sin(U1);
    const cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2);
    const cosU2 = Math.cos(U2);

    let lambda = L;
    let lambdaP;
    let iterLimit = 100;
    let cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;

    do {
      const sinLambda = Math.sin(lambda);
      const cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      
      if (sinSigma === 0) return 0; // co-incident points
      
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      
      if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line
      
      const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (iterLimit === 0) {
      // Formula failed to converge, fall back to haversine
      return this.haversineDistance(point1, point2);
    }

    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));

    const s = b * A * (sigma - deltaSigma);
    return s / 1000; // Convert to kilometers
  }

  /**
   * Calculate distance to CBD boundary using multiple methods
   * @param {object} point - {lat, lng} or {latitude, longitude}
   * @param {string} method - Distance calculation method
   * @returns {object} Distance calculation result
   */
  distanceToCBDBoundary(point, method = DISTANCE_METHODS.TURF_POINT_TO_LINE) {
    if (!point) {
      return { distance: Infinity, error: 'No point provided' };
    }

    try {
      const lat = point.lat || point.latitude;
      const lng = point.lng || point.longitude;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return { distance: Infinity, error: 'Invalid coordinates' };
      }

      // Validate coordinate ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { distance: Infinity, error: 'Coordinates out of valid range' };
      }

      const turfPoint = turf.point([lng, lat]);

      // Check if point is inside CBD
      const isInside = turf.booleanPointInPolygon(turfPoint, this.cbdPolygon);
      if (isInside) {
        return {
          distance: 0,
          method,
          isInside: true,
          nearestPoint: { latitude: lat, longitude: lng },
          message: 'Point is inside CBD'
        };
      }

      let distance, nearestPoint, calculationDetails;

      switch (method) {
        case DISTANCE_METHODS.HAVERSINE:
          ({ distance, nearestPoint, calculationDetails } = this.calculateHaversineDistanceToBoundary(point));
          break;

        case DISTANCE_METHODS.VINCENTY:
          ({ distance, nearestPoint, calculationDetails } = this.calculateVincentyDistanceToBoundary(point));
          break;

        case DISTANCE_METHODS.TURF_DISTANCE:
          ({ distance, nearestPoint, calculationDetails } = this.calculateTurfDistanceToBoundary(point));
          break;

        case DISTANCE_METHODS.TURF_POINT_TO_LINE:
          ({ distance, nearestPoint, calculationDetails } = this.calculateTurfPointToLineDistance(point));
          break;

        case DISTANCE_METHODS.GREAT_CIRCLE:
          ({ distance, nearestPoint, calculationDetails } = this.calculateGreatCircleDistanceToBoundary(point));
          break;

        default:
          ({ distance, nearestPoint, calculationDetails } = this.calculateTurfPointToLineDistance(point));
      }

      return {
        distance,
        method,
        isInside: false,
        nearestPoint,
        calculationDetails,
        message: `Distance to CBD: ${distance.toFixed(3)} km`
      };

    } catch (error) {
      return {
        distance: Infinity,
        error: error.message,
        method,
        message: 'Error calculating distance'
      };
    }
  }

  /**
   * Calculate distance using Haversine to find nearest boundary point
   */
  calculateHaversineDistanceToBoundary(point) {
    let minDistance = Infinity;
    let nearestPoint = null;
    const calculations = [];

    // Check distance to each boundary point
    NAIROBI_CBD_COORDINATES.forEach((coord, index) => {
      const boundaryPoint = { latitude: coord[1], longitude: coord[0] };
      const distance = this.haversineDistance(point, boundaryPoint);
      
      calculations.push({
        boundaryPointIndex: index,
        boundaryPoint,
        distance
      });

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = boundaryPoint;
      }
    });

    // Also check distance to line segments
    for (let i = 0; i < NAIROBI_CBD_COORDINATES.length - 1; i++) {
      const segmentDistance = this.distanceToLineSegment(
        point,
        { latitude: NAIROBI_CBD_COORDINATES[i][1], longitude: NAIROBI_CBD_COORDINATES[i][0] },
        { latitude: NAIROBI_CBD_COORDINATES[i + 1][1], longitude: NAIROBI_CBD_COORDINATES[i + 1][0] }
      );

      if (segmentDistance.distance < minDistance) {
        minDistance = segmentDistance.distance;
        nearestPoint = segmentDistance.nearestPoint;
      }
    }

    return {
      distance: minDistance,
      nearestPoint,
      calculationDetails: {
        method: 'Haversine',
        pointsChecked: calculations.length,
        calculations: calculations.slice(0, 5) // Limit for performance
      }
    };
  }

  /**
   * Calculate distance using Vincenty to find nearest boundary point
   */
  calculateVincentyDistanceToBoundary(point) {
    let minDistance = Infinity;
    let nearestPoint = null;

    NAIROBI_CBD_COORDINATES.forEach(coord => {
      const boundaryPoint = { latitude: coord[1], longitude: coord[0] };
      const distance = this.vincentyDistance(point, boundaryPoint);

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = boundaryPoint;
      }
    });

    return {
      distance: minDistance,
      nearestPoint,
      calculationDetails: {
        method: 'Vincenty',
        note: 'Most accurate for long distances'
      }
    };
  }

  /**
   * Calculate distance using Turf.js distance function
   */
  calculateTurfDistanceToBoundary(point) {
    const turfPoint = turf.point([point.lng || point.longitude, point.lat || point.latitude]);
    const nearestPointOnLine = turf.nearestPointOnLine(this.cbdBoundaryLine, turfPoint);
    const distance = turf.distance(turfPoint, nearestPointOnLine, { units: 'kilometers' });

    return {
      distance,
      nearestPoint: {
        latitude: nearestPointOnLine.geometry.coordinates[1],
        longitude: nearestPointOnLine.geometry.coordinates[0]
      },
      calculationDetails: {
        method: 'Turf.js distance',
        nearestPointProperties: nearestPointOnLine.properties
      }
    };
  }

  /**
   * Calculate distance using Turf.js pointToLineDistance (most reliable)
   */
  calculateTurfPointToLineDistance(point) {
    const turfPoint = turf.point([point.lng || point.longitude, point.lat || point.latitude]);
    const distance = turf.pointToLineDistance(turfPoint, this.cbdBoundaryLine, { units: 'kilometers' });
    
    // Also get the nearest point for additional info
    const nearestPointOnLine = turf.nearestPointOnLine(this.cbdBoundaryLine, turfPoint);

    return {
      distance,
      nearestPoint: {
        latitude: nearestPointOnLine.geometry.coordinates[1],
        longitude: nearestPointOnLine.geometry.coordinates[0]
      },
      calculationDetails: {
        method: 'Turf.js pointToLineDistance',
        note: 'Most reliable for polygon boundaries'
      }
    };
  }

  /**
   * Calculate distance using Great Circle method
   */
  calculateGreatCircleDistanceToBoundary(point) {
    const turfPoint = turf.point([point.lng || point.longitude, point.lat || point.latitude]);
    const nearestPointOnLine = turf.nearestPointOnLine(this.cbdBoundaryLine, turfPoint);
    const distance = turf.distance(turfPoint, nearestPointOnLine, { units: 'kilometers' });

    return {
      distance,
      nearestPoint: {
        latitude: nearestPointOnLine.geometry.coordinates[1],
        longitude: nearestPointOnLine.geometry.coordinates[0]
      },
      calculationDetails: {
        method: 'Great Circle',
        note: 'Standard spherical distance calculation'
      }
    };
  }

  /**
   * Calculate distance from point to line segment
   */
  distanceToLineSegment(point, lineStart, lineEnd) {
    const A = point.latitude - lineStart.latitude;
    const B = point.longitude - lineStart.longitude;
    const C = lineEnd.latitude - lineStart.latitude;
    const D = lineEnd.longitude - lineStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.latitude;
      yy = lineStart.longitude;
    } else if (param > 1) {
      xx = lineEnd.latitude;
      yy = lineEnd.longitude;
    } else {
      xx = lineStart.latitude + param * C;
      yy = lineStart.longitude + param * D;
    }

    const nearestPoint = { latitude: xx, longitude: yy };
    const distance = this.haversineDistance(point, nearestPoint);

    return { distance, nearestPoint };
  }

  /**
   * Compare multiple distance calculation methods
   * @param {object} point - Point to calculate distance from
   * @returns {object} Comparison of all methods
   */
  compareDistanceMethods(point) {
    const methods = Object.values(DISTANCE_METHODS);
    const results = {};
    const startTime = performance.now();

    methods.forEach(method => {
      const methodStartTime = performance.now();
      const result = this.distanceToCBDBoundary(point, method);
      const methodEndTime = performance.now();
      
      results[method] = {
        ...result,
        executionTime: methodEndTime - methodStartTime
      };
    });

    const endTime = performance.now();

    // Calculate statistics
    const distances = Object.values(results)
      .filter(r => r.distance !== Infinity)
      .map(r => r.distance);

    const stats = {
      mean: distances.reduce((a, b) => a + b, 0) / distances.length,
      min: Math.min(...distances),
      max: Math.max(...distances),
      standardDeviation: this.calculateStandardDeviation(distances)
    };

    return {
      results,
      statistics: stats,
      totalExecutionTime: endTime - startTime,
      recommendation: this.getRecommendedMethod(results),
      point: {
        latitude: point.lat || point.latitude,
        longitude: point.lng || point.longitude
      }
    };
  }

  /**
   * Get recommended method based on accuracy and performance
   */
  getRecommendedMethod(results) {
    // For CBD geofencing, Turf.js pointToLineDistance is most reliable
    const turfPointToLine = results[DISTANCE_METHODS.TURF_POINT_TO_LINE];
    
    if (turfPointToLine && turfPointToLine.distance !== Infinity) {
      return {
        method: DISTANCE_METHODS.TURF_POINT_TO_LINE,
        reason: 'Most reliable for polygon boundary calculations',
        distance: turfPointToLine.distance
      };
    }

    // Fallback to Haversine for reliability
    return {
      method: DISTANCE_METHODS.HAVERSINE,
      reason: 'Reliable fallback method',
      distance: results[DISTANCE_METHODS.HAVERSINE]?.distance || Infinity
    };
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(point) {
    const lat = point.lat || point.latitude;
    const lng = point.lng || point.longitude;

    if (!lat || !lng) {
      return { valid: false, error: 'Missing coordinates' };
    }

    if (isNaN(lat) || isNaN(lng)) {
      return { valid: false, error: 'Non-numeric coordinates' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude out of range (-90 to 90)' };
    }

    if (lng < -180 || lng > 180) {
      return { valid: false, error: 'Longitude out of range (-180 to 180)' };
    }

    // Check if coordinates are in reasonable range for Nairobi
    if (lat < -2 || lat > -1 || lng < 36 || lng > 37.5) {
      return { 
        valid: true, 
        warning: 'Coordinates outside typical Nairobi area',
        suggestion: 'Verify coordinates are correct'
      };
    }

    return { valid: true };
  }
}

// Create singleton instance
export const distanceCalculator = new EnhancedDistanceCalculator();

// Enhanced wrapper function for backward compatibility
export const enhancedDistanceToNairobiCBD = (point, method = DISTANCE_METHODS.TURF_POINT_TO_LINE) => {
  const result = distanceCalculator.distanceToCBDBoundary(point, method);
  return result.distance;
};

// Export for testing and advanced usage
export default {
  EnhancedDistanceCalculator,
  distanceCalculator,
  DISTANCE_METHODS,
  enhancedDistanceToNairobiCBD
};