export const getDirectionsRoute = async (waypoints) => {
  if (!window.google?.maps?.DirectionsService) {
    console.warn('[directionsService] Google Maps Directions API not available');
    return null;
  }

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    console.warn('[directionsService] Invalid waypoints:', waypoints);
    return null;
  }

  const directionsService = new window.google.maps.DirectionsService();

  try {
    const origin = {
      lat: Number(waypoints[0].latitude),
      lng: Number(waypoints[0].longitude)
    };

    const destination = {
      lat: Number(waypoints[waypoints.length - 1].latitude),
      lng: Number(waypoints[waypoints.length - 1].longitude)
    };

    const intermediateWaypoints = waypoints.slice(1, -1).map(wp => ({
      location: {
        lat: Number(wp.latitude),
        lng: Number(wp.longitude)
      },
      stopover: true
    }));

    console.log('[directionsService] Requesting route from', origin, 'to', destination, 'via', intermediateWaypoints.length, 'waypoints');

    const response = await new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          waypoints: intermediateWaypoints,
          travelMode: 'DRIVING',
          optimizeWaypoints: false
        },
        (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions API error: ${status}`));
          }
        }
      );
    });

    if (response && response.routes && response.routes[0]) {
      const route = response.routes[0];
      const overviewPolyline = route.overview_polyline;
      
      if (overviewPolyline) {
        console.log('[directionsService] Got route with polyline');
        return {
          polyline: overviewPolyline,
          legs: route.legs,
          bounds: route.bounds,
          distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
          duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0)
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[directionsService] Error getting directions:', error);
    return null;
  }
};

export const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const poly = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return poly;
};
