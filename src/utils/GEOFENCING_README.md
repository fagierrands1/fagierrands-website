# Nairobi CBD Geofencing System

This geofencing system provides comprehensive location-based services for the Nairobi Central Business District (CBD). It includes boundary detection, distance calculations, and real-time location tracking with customizable buffer zones.

## Features

- **CBD Boundary Detection**: Accurately detect if a location is within Nairobi CBD
- **Buffer Zones**: Configurable warning zones around the CBD
- **Real-time Tracking**: Monitor user location with geofence notifications
- **Distance Calculations**: Calculate distance to CBD and nearest entry points
- **Route Analysis**: Check if routes intersect with CBD boundaries
- **Visual Map Integration**: Interactive maps with geofence overlays
- **Flexible Integration**: Easy to integrate into existing components

## Files Overview

### Core Utilities
- `nairobiCBDGeofence.js` - Main geofencing utility functions
- `geospatial.js` - General geospatial calculations using Turf.js

### React Components
- `GeofencedMapComponent.js` - Map component with geofencing features
- `MapComponent.js` - Enhanced original map component with optional geofencing

### Hooks
- `useNairobiCBDGeofence.js` - React hook for geofencing functionality

### Examples
- `GeofenceDemo.js` - Complete demo page showing all features
- `GeofencedPickupDelivery.js` - Example service integration

## Quick Start

### 1. Basic Geofence Check

```javascript
import { isPointInNairobiCBD, getCBDGeofenceStatus } from '../utils/nairobiCBDGeofence';

// Check if a location is in CBD
const location = { latitude: -1.2921, longitude: 36.8219 };
const isInCBD = isPointInNairobiCBD(location);

// Get detailed status
const status = getCBDGeofenceStatus(location, 1); // 1km buffer
console.log(status.zone); // 'inside_cbd', 'buffer_zone', or 'outside'
```

### 2. Using the React Hook

```javascript
import { useNairobiCBDGeofence } from '../hooks/useNairobiCBDGeofence';

function MyComponent() {
  const {
    currentLocation,
    geofenceStatus,
    isTracking,
    startTracking,
    stopTracking,
    isInCBD,
    distanceToCBD
  } = useNairobiCBDGeofence({
    bufferDistance: 2,
    onEnterCBD: (status) => console.log('Entered CBD!'),
    onExitCBD: (status) => console.log('Left CBD!')
  });

  return (
    <div>
      <button onClick={startTracking}>Start Tracking</button>
      <p>In CBD: {isInCBD ? 'Yes' : 'No'}</p>
      <p>Distance: {distanceToCBD.toFixed(2)}km</p>
    </div>
  );
}
```

### 3. Using the Geofenced Map Component

```javascript
import GeofencedMapComponent from '../components/Common/GeofencedMapComponent';

function MyService() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geofenceStatus, setGeofenceStatus] = useState(null);

  return (
    <GeofencedMapComponent
      onLocationSelect={setSelectedLocation}
      onGeofenceStatusChange={setGeofenceStatus}
      showCBDGeofence={true}
      bufferDistance={1}
      restrictToCBD={false}
    />
  );
}
```

### 4. Enhancing Existing Map Component

```javascript
import MapComponent from '../components/Common/MapComponent';

function MyExistingService() {
  return (
    <MapComponent
      onLocationSelect={handleLocationSelect}
      enableGeofencing={true}
      restrictToCBD={true}
      bufferDistance={2}
      onGeofenceStatusChange={handleGeofenceChange}
    />
  );
}
```

## API Reference

### Core Functions

#### `isPointInNairobiCBD(point)`
Check if a point is within Nairobi CBD boundaries.

**Parameters:**
- `point` (Object): Location with `lat`/`latitude` and `lng`/`longitude`

**Returns:** Boolean

#### `getCBDGeofenceStatus(point, bufferDistance)`
Get comprehensive geofence status for a location.

**Parameters:**
- `point` (Object): Location coordinates
- `bufferDistance` (Number): Buffer zone distance in kilometers

**Returns:** Object with zone, distances, and status information

#### `distanceToNairobiCBD(point)`
Calculate distance from point to nearest CBD boundary.

**Parameters:**
- `point` (Object): Location coordinates

**Returns:** Number (distance in kilometers)

#### `getNearestCBDEntryPoint(point)`
Find the nearest entry point to CBD.

**Parameters:**
- `point` (Object): Location coordinates

**Returns:** Object with entry point coordinates and description

### Hook: useNairobiCBDGeofence(options)

**Options:**
- `bufferDistance` (Number): Buffer zone distance (default: 1km)
- `enableRealTimeTracking` (Boolean): Auto-start location tracking
- `onEnterCBD` (Function): Callback when entering CBD
- `onExitCBD` (Function): Callback when leaving CBD
- `onEnterBufferZone` (Function): Callback when entering buffer zone
- `onExitBufferZone` (Function): Callback when leaving buffer zone
- `onStatusChange` (Function): Callback for any status change

**Returns:**
- `currentLocation`: Current user location
- `geofenceStatus`: Current geofence status
- `isTracking`: Whether real-time tracking is active
- `startTracking()`: Start location tracking
- `stopTracking()`: Stop location tracking
- `isInCBD`: Boolean if currently in CBD
- `distanceToCBD`: Distance to CBD in kilometers
- `zone`: Current zone ('inside_cbd', 'buffer_zone', 'outside')

### Component Props

#### GeofencedMapComponent
- `onLocationSelect`: Callback when location is selected
- `onGeofenceStatusChange`: Callback when geofence status changes
- `showCBDGeofence`: Show CBD boundary overlay
- `bufferDistance`: Buffer zone distance
- `restrictToCBD`: Restrict location selection to CBD only
- `isTracking`: Enable tracking mode
- `location`: Current tracking location
- `destination`: Destination for tracking

#### MapComponent (Enhanced)
All original props plus:
- `enableGeofencing`: Enable geofencing features
- `restrictToCBD`: Restrict selection to CBD
- `bufferDistance`: Buffer zone distance
- `onGeofenceStatusChange`: Status change callback

## Geofence Zones

### Inside CBD
- **Zone**: `inside_cbd`
- **Color**: Green
- **Icon**: 📍
- **Description**: Location is within Nairobi CBD boundaries

### Buffer Zone
- **Zone**: `buffer_zone`
- **Color**: Amber/Yellow
- **Icon**: ⚠️
- **Description**: Location is within buffer distance of CBD

### Outside
- **Zone**: `outside`
- **Color**: Red
- **Icon**: 🚫
- **Description**: Location is outside CBD and buffer zone

## CBD Boundaries

The system uses the following approximate boundaries for Nairobi CBD:
- **North**: University Way area
- **South**: Uhuru Highway area
- **East**: Moi Avenue/Haile Selassie Avenue area
- **West**: Kenyatta Avenue area

Key landmarks included:
- Kenyatta International Conference Center
- Times Tower
- Kencom House
- Nairobi City Hall
- Central Park

## Use Cases

### 1. Service Restrictions
Restrict certain services to CBD areas only:

```javascript
const handleLocationSelect = (location) => {
  if (serviceType === 'express' && !isPointInNairobiCBD(location)) {
    alert('Express service is only available within CBD');
    return;
  }
  setSelectedLocation(location);
};
```

### 2. Dynamic Pricing
Adjust pricing based on location:

```javascript
const calculatePrice = (pickupLocation, deliveryLocation) => {
  const pickupInCBD = isPointInNairobiCBD(pickupLocation);
  const deliveryInCBD = isPointInNairobiCBD(deliveryLocation);
  
  let basePrice = 500;
  if (pickupInCBD && deliveryInCBD) {
    basePrice *= 0.9; // Slight CBD adjustment
  } else if (!pickupInCBD && !deliveryInCBD) {
    basePrice *= 1.2; // Outside CBD adjustment
  }
  
  return basePrice;
};
```

### 3. Real-time Notifications
Notify users when entering/leaving zones:

```javascript
const { geofenceStatus } = useNairobiCBDGeofence({
  onEnterCBD: () => showNotification('Welcome to Nairobi CBD! Express services available.'),
  onExitCBD: () => showNotification('You have left CBD. Standard delivery times apply.'),
  onEnterBufferZone: () => showNotification('Approaching CBD area.')
});
```

### 4. Route Optimization
Check if routes pass through CBD:

```javascript
import { doesRouteIntersectCBD } from '../utils/nairobiCBDGeofence';

const routeCoordinates = [[36.8150, -1.2850], [36.8280, -1.2950]];
const intersectsCBD = doesRouteIntersectCBD(routeCoordinates);

if (intersectsCBD) {
  console.log('Route passes through CBD - traffic considerations apply');
}
```

## Configuration

### Buffer Distance
Adjust the warning zone around CBD:
- `0.5km` - Tight buffer for precise services
- `1km` - Standard buffer (default)
- `2km` - Extended buffer for broader coverage
- `5km` - Wide buffer for metropolitan area

### Restriction Levels
- **No Restriction**: Allow selection anywhere
- **CBD Preferred**: Show warnings for non-CBD locations
- **CBD Required**: Only allow CBD locations
- **Buffer Zone**: Allow CBD + buffer zone only

## Integration Examples

### Express Delivery Service
```javascript
const expressDeliverySettings = {
  enableGeofencing: true,
  restrictToCBD: true,
  bufferDistance: 0.5,
  requireCBDForExpress: true
};
```

### Standard Service with Warnings
```javascript
const standardServiceSettings = {
  enableGeofencing: true,
  restrictToCBD: false,
  bufferDistance: 2,
  showWarningsForNonCBD: true
};
```

### Real-time Tracking
```javascript
const trackingSettings = {
  enableGeofencing: true,
  enableRealTimeTracking: true,
  bufferDistance: 1,
  notifyOnZoneChange: true
};
```

## Dependencies

- **@turf/turf**: Geospatial calculations
- **react-leaflet**: Map components
- **leaflet**: Base mapping library
- **leaflet-geosearch**: Location search functionality

## Browser Support

- **Geolocation API**: Required for real-time tracking
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Mobile**: iOS Safari 11+, Chrome Mobile 60+

## Performance Considerations

- Geofence calculations are optimized using Turf.js
- Real-time tracking uses efficient position watching
- Map overlays are rendered only when needed
- Debounced status updates prevent excessive callbacks

## Troubleshooting

### Common Issues

1. **Location not detected**: Ensure HTTPS and location permissions
2. **Geofence not showing**: Check if `enableGeofencing` is true
3. **Inaccurate boundaries**: Verify coordinate format (lat, lng)
4. **Performance issues**: Reduce buffer distance or disable real-time tracking

### Debug Mode
Enable console logging for debugging:

```javascript
const debugGeofence = true;
if (debugGeofence) {
  console.log('Geofence status:', geofenceStatus);
  console.log('Location:', currentLocation);
}
```

## Future Enhancements

- Multiple geofence zones (Westlands, Kilimani, etc.)
- Custom polygon drawing for dynamic zones
- Integration with traffic data
- Offline geofence support
- Advanced route optimization
- Machine learning for zone prediction

## Support

For issues or questions about the geofencing system:
1. Check the console for error messages
2. Verify location permissions are granted
3. Ensure all dependencies are installed
4. Test with the demo page first
5. Check network connectivity for map tiles

## License

This geofencing system is part of the FagiErrands project and follows the same licensing terms.