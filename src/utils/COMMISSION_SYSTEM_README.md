# Universal Commission System with Geofencing Integration

This document explains the comprehensive commission calculation system that works for **ALL types of tasks** - not just pickup and delivery! The system has been integrated with Nairobi CBD geofencing functionality.

## Overview

The commission system automatically adjusts commission rates based on whether task locations are within the Nairobi Central Business District (CBD). This applies to:

- **Shopping Services** (grocery shopping, retail purchases, pharmacy runs)
- **Delivery Services** (pickup and delivery between locations)
- **Cleaning Services** (house cleaning, office cleaning, car wash)
- **Maintenance Services** (repairs, installations, technical support)
- **Multi-Stop Services** (errands involving multiple locations)
- **General Errands** (any other type of task or service)

The system incentivizes assistants fairly across all service types while maintaining location-based optimization.

## Commission Structure

### CBD Service (Enhanced Earnings)
- **Trigger**: Both pickup AND delivery locations within Nairobi CBD
- **Company Commission**: 30%
- **Assistant Earnings**: 70%
- **Benefits**: Higher earnings for assistants, faster service, priority handling

### Standard Service
- **Trigger**: At least one location outside CBD
- **Company Commission**: 25%
- **Assistant Earnings**: 75%
- **Benefits**: Enhanced rates for non-CBD service areas

### Premium Service
- **Trigger**: Express delivery or special handling services
- **Company Commission**: 40%
- **Assistant Earnings**: 60%
- **Benefits**: Enhanced rates for premium services

## Implementation Files

### Core Utilities
- `commissionCalculator.js` - Universal commission calculation logic for all task types
- `nairobiCBDGeofence.js` - Geofencing utilities for CBD detection

### Components
- `CommissionCalculator.js` - Standalone commission calculator (pickup/delivery focused)
- `UniversalCommissionCalculator.js` - Universal calculator for all task types
- `PriceCalculator.js` - Enhanced price calculator with commission breakdown
- `GeofencedPickupDelivery.js` - Example service integration

### Demo Pages
- `CommissionDemo.js` - Interactive demo for pickup/delivery commission calculations
- `AllTasksCommissionDemo.js` - Comprehensive demo for all task types
- `GeofenceDemo.js` - Geofencing system demonstration

## Key Features

### 1. Automatic Detection
```javascript
import { calculateCommission } from '../utils/commissionCalculator';

const commission = calculateCommission(
  totalPrice,
  pickupLocation,
  deliveryLocation,
  serviceType
);
```

### 2. Real-time Updates
- Commission rates update automatically when locations change
- Visual indicators show CBD status for both pickup and delivery
- Clear breakdown of earnings vs company commission

### 3. Geofence Integration
- Uses precise CBD boundary detection
- Shows visual overlays on maps
- Provides buffer zone warnings

### 4. Flexible Configuration
```javascript
export const COMMISSION_RATES = {
  CBD_SERVICE: {
    COMPANY_PERCENTAGE: 30,
    ASSISTANT_PERCENTAGE: 70
  },
  STANDARD_SERVICE: {
    COMPANY_PERCENTAGE: 25,
    ASSISTANT_PERCENTAGE: 75
  }
};
```

## Usage Examples

### Universal Commission Calculation
```javascript
import { 
  calculateCommissionForTask,
  calculateShoppingCommission,
  calculateServiceCommission,
  calculateErrandCommission 
} from '../utils/commissionCalculator';

// Shopping task at CBD location
const shoppingLocation = { latitude: -1.2921, longitude: 36.8219 }; // CBD
const shoppingCommission = calculateShoppingCommission(1000, shoppingLocation);
// Result: Assistant earns KES 700 (70%), Company gets KES 300 (30%)

// Cleaning service outside CBD
const cleaningLocation = { latitude: -1.3500, longitude: 36.9000 }; // Outside CBD
const cleaningCommission = calculateServiceCommission(1000, cleaningLocation);
// Result: Assistant earns KES 750 (75%), Company gets KES 250 (25%)

// Multi-stop task (some locations in CBD, some outside)
const multiStopLocations = [
  { latitude: -1.2921, longitude: 36.8219 }, // CBD
  { latitude: -1.3500, longitude: 36.9000 }  // Outside CBD
];
const multiStopCommission = calculateCommissionForTask(1000, multiStopLocations);
// Result: Assistant earns KES 750 (75%), Company gets KES 250 (25%) - any location outside CBD

// Delivery task (backward compatibility)
const deliveryCommission = calculateCommission(1000, pickupLocation, deliveryLocation);
// Result: Assistant earns KES 700 (70%), Company gets KES 300 (30%)
```

### Component Integration

#### Universal Calculator (All Task Types)
```javascript
import UniversalCommissionCalculator from '../components/Common/UniversalCommissionCalculator';

// Shopping task
<UniversalCommissionCalculator
  totalPrice={1000}
  taskType="shopping"
  taskLocation={storeLocation}
  serviceType="standard"
  showDetails={true}
/>

// Cleaning service
<UniversalCommissionCalculator
  totalPrice={800}
  taskType="cleaning"
  taskLocation={houseLocation}
  serviceType="standard"
  showDetails={true}
/>

// Multi-stop errand
<UniversalCommissionCalculator
  totalPrice={1500}
  taskType="multi-stop"
  taskLocation={[location1, location2, location3]}
  serviceType="standard"
  showDetails={true}
/>
```

#### Delivery-Specific Calculator (Backward Compatibility)
```javascript
import CommissionCalculator from '../components/Common/CommissionCalculator';

<CommissionCalculator
  pickupLocation={pickupLocation}
  deliveryLocation={deliveryLocation}
  totalPrice={1000}
  serviceType="standard"
  showDetails={true}
/>
```

### Price Calculator with Commission
```javascript
import PriceCalculator from '../components/Common/PriceCalculator';

<PriceCalculator
  pickupLocation={pickupLocation}
  deliveryLocation={deliveryLocation}
  orderTypeId={orderTypeId}
  items={items}
/>
// Automatically shows commission breakdown
```

## Business Logic

### CBD Service Benefits
1. **Optimized Earnings**: 70% for CBD vs 75% for non-CBD areas
2. **Faster Delivery**: CBD locations are closer together
3. **Better Infrastructure**: More reliable service within CBD
4. **Priority Handling**: CBD orders get priority processing

### Incentive Structure
- **Non-CBD Areas**: Higher assistant earnings (75%) to compensate for longer distances
- **CBD Areas**: Optimized earnings (70%) with faster delivery benefits
- **Premium Services**: Enhanced rates (60%) for special handling
- Provides clear earning expectations across all service areas
- Supports business growth while maintaining fair compensation

## Visual Indicators

### Map Overlays
- **Green Area**: Nairobi CBD boundaries
- **Yellow Dashed**: Buffer zone around CBD
- **Icons**: Visual status indicators for each location

### Status Messages
- ✅ "CBD Service - Enhanced assistant earnings!"
- ⚠️ "Standard Service - Regular commission rates"
- 📍 "Location outside CBD"

## API Integration

### Backend Compatibility
The system is designed to work with your existing backend:

```javascript
// Frontend calculation (fallback)
const commission = calculateCommission(totalPrice, pickup, delivery);

// Backend integration (when available)
const response = await axios.post('/orders/calculate-commission/', {
  total_price: totalPrice,
  pickup_location: pickup,
  delivery_location: delivery,
  service_type: serviceType
});
```

### Order Submission
Commission data is included in order submissions:

```javascript
const orderData = {
  // ... other order data
  commission_breakdown: {
    company_commission: commission.companyCommission,
    assistant_earnings: commission.assistantEarnings,
    service_type: commission.serviceType,
    geofence_status: {
      pickup_in_cbd: commission.isPickupInCBD,
      delivery_in_cbd: commission.isDeliveryInCBD
    }
  }
};
```

## Configuration Options

### Commission Rates
Easily adjustable in `commissionCalculator.js`:

```javascript
export const COMMISSION_RATES = {
  CBD_SERVICE: {
    COMPANY_PERCENTAGE: 30,    // Adjust as needed
    ASSISTANT_PERCENTAGE: 70   // Adjust as needed
  }
  // ... other rates
};
```

### Geofence Settings
Configurable in components:

```javascript
const geofenceSettings = {
  enableGeofencing: true,
  restrictToCBD: false,
  bufferDistance: 2,
  requireCBDForExpress: true
};
```

## Testing and Validation

### Demo Pages
1. **CommissionDemo.js**: Interactive commission calculator
2. **GeofenceDemo.js**: Geofencing system testing
3. **GeofencedPickupDelivery.js**: Full service integration example

### Test Scenarios
1. **Both in CBD**: Should show 30/70 split
2. **One outside CBD**: Should show 50/50 split
3. **Express service**: Should show premium rates
4. **Invalid locations**: Should handle errors gracefully

## Performance Considerations

### Optimizations
- Efficient geofence calculations using Turf.js
- Cached CBD polygon for repeated checks
- Debounced updates to prevent excessive calculations
- Minimal re-renders with proper state management

### Browser Support
- Modern browsers with geolocation support
- Fallback calculations for offline scenarios
- Progressive enhancement for older browsers

## Future Enhancements

### Planned Features
1. **Multiple Zones**: Westlands, Kilimani, etc.
2. **Time-based Rates**: Peak hour adjustments
3. **Distance Modifiers**: Longer distances get different rates
4. **Assistant Tiers**: Different rates for different assistant levels
5. **Dynamic Pricing**: AI-based rate adjustments

### Analytics Integration
- Track commission distribution
- Monitor CBD vs non-CBD order ratios
- Analyze assistant earnings patterns
- Optimize rates based on data

## Support and Maintenance

### Monitoring
- Commission calculation accuracy
- Geofence boundary precision
- Performance metrics
- Error tracking

### Updates
- Commission rates can be updated without code changes
- Geofence boundaries can be refined
- New service types can be added easily
- A/B testing support for different rate structures

## Conclusion

This commission system provides:
1. **Fair Compensation**: Balanced rates for all service types
2. **Clear Incentives**: Higher earnings for CBD services
3. **Automatic Calculation**: No manual intervention required
4. **Flexible Configuration**: Easy to adjust rates and rules
5. **Visual Feedback**: Clear indicators for users
6. **Scalable Architecture**: Ready for future enhancements

The system encourages assistants to take on CBD orders while maintaining fair compensation across all service areas, supporting both business growth and assistant satisfaction.