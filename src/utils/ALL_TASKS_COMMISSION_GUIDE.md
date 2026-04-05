# Universal Commission System - All Tasks Guide

## 🎯 **YES! This applies to ALL tasks, not just pickup and delivery!**

The commission system has been designed to work with **every type of task** your platform offers. Here's how it works:

## 📋 **Supported Task Types**

### 1. **Shopping Services** 🛒
- Grocery shopping
- Retail purchases
- Pharmacy runs
- Electronics shopping
- Clothing purchases

**How it works:**
```javascript
import { calculateShoppingCommission } from '../utils/commissionCalculator';

const storeLocation = { latitude: -1.2921, longitude: 36.8219 }; // Nakumatt CBD
const commission = calculateShoppingCommission(1000, storeLocation);
// CBD store: Assistant gets KES 700 (70%), Company gets KES 300 (30%)

const outsideStore = { latitude: -1.3500, longitude: 36.9000 }; // Tuskys Kilimani
const commissionOutside = calculateShoppingCommission(1000, outsideStore);
// Non-CBD store: Assistant gets KES 750 (75%), Company gets KES 250 (25%)
```

### 2. **Cleaning Services** 🧹
- House cleaning
- Office cleaning
- Car washing
- Deep cleaning
- Maintenance cleaning

**How it works:**
```javascript
import { calculateServiceCommission } from '../utils/commissionCalculator';

const houseLocation = { latitude: -1.2921, longitude: 36.8219 }; // CBD apartment
const commission = calculateServiceCommission(800, houseLocation);
// CBD cleaning: Assistant gets KES 560 (70%), Company gets KES 240 (30%)

const suburbHouse = { latitude: -1.3500, longitude: 36.9000 }; // Kilimani house
const commissionSuburb = calculateServiceCommission(800, suburbHouse);
// Non-CBD cleaning: Assistant gets KES 600 (75%), Company gets KES 200 (25%)
```

### 3. **Maintenance Services** 🔧
- Plumbing repairs
- Electrical work
- Appliance repair
- Installation services
- Technical support

**How it works:**
```javascript
import { calculateServiceCommission } from '../utils/commissionCalculator';

const officeLocation = { latitude: -1.2921, longitude: 36.8219 }; // CBD office
const commission = calculateServiceCommission(1200, officeLocation);
// CBD maintenance: Assistant gets KES 840 (70%), Company gets KES 360 (30%)
```

### 4. **Multi-Stop Services** 🗺️
- Shopping at multiple stores
- Multi-location deliveries
- Business errands
- Document collection rounds

**How it works:**
```javascript
import { calculateMultiStopCommission } from '../utils/commissionCalculator';

const locations = [
  { latitude: -1.2921, longitude: 36.8219 }, // CBD location
  { latitude: -1.2950, longitude: 36.8200 }, // Another CBD location
  { latitude: -1.3500, longitude: 36.9000 }  // Outside CBD location
];

const commission = calculateMultiStopCommission(1500, locations);
// Any location outside CBD: Assistant gets KES 1125 (75%), Company gets KES 375 (25%)
// All locations in CBD: Assistant gets KES 1050 (70%), Company gets KES 450 (30%)
```

### 5. **General Errands** 📝
- Queue for services
- Document processing
- Personal assistance
- Custom tasks

**How it works:**
```javascript
import { calculateErrandCommission } from '../utils/commissionCalculator';

const taskLocation = { latitude: -1.2921, longitude: 36.8219 }; // Government office CBD
const commission = calculateErrandCommission(600, taskLocation, 'document_processing');
// CBD errand: Assistant gets KES 420 (70%), Company gets KES 180 (30%)
```

### 6. **Delivery Services** 🚚
- Pickup and delivery
- Package transport
- Food delivery
- Document delivery

**How it works:**
```javascript
import { calculateCommission } from '../utils/commissionCalculator';

const pickup = { latitude: -1.2921, longitude: 36.8219 }; // CBD pickup
const delivery = { latitude: -1.2950, longitude: 36.8200 }; // CBD delivery
const commission = calculateCommission(1000, pickup, delivery);
// Both in CBD: Assistant gets KES 700 (70%), Company gets KES 300 (30%)
```

## 🎯 **Commission Rules (Universal)**

### **CBD Tasks** (Location within Nairobi CBD)
- **Company**: 30%
- **Assistant**: 70%
- **Benefits**: Faster service, better infrastructure, priority handling

### **Non-CBD Tasks** (Location outside CBD)
- **Company**: 25%
- **Assistant**: 75%
- **Benefits**: Higher earnings to compensate for travel time and distance

### **Premium/Express Tasks** (Any location)
- **Company**: 40%
- **Assistant**: 60%
- **Benefits**: Enhanced rates for urgent or special handling

## 🔧 **Implementation Examples**

### React Component Usage
```javascript
import UniversalCommissionCalculator from '../components/Common/UniversalCommissionCalculator';

// For any task type
<UniversalCommissionCalculator
  totalPrice={1000}
  taskType="shopping" // or "cleaning", "maintenance", "delivery", etc.
  taskLocation={taskLocation}
  deliveryLocation={deliveryLocation} // only for delivery tasks
  serviceType="standard"
  showDetails={true}
/>
```

### Backend Integration
```javascript
// When creating any order/task
const orderData = {
  task_type: 'shopping', // or any other type
  total_price: 1000,
  task_location: { latitude: -1.2921, longitude: 36.8219 },
  service_type: 'standard',
  
  // Commission is calculated automatically
  commission_breakdown: calculateShoppingCommission(1000, taskLocation)
};
```

## 📊 **Real Examples**

### Shopping at Sarit Centre (Non-CBD)
```
Task: Grocery shopping
Price: KES 2000
Location: Sarit Centre (Outside CBD)
Result: Assistant earns KES 1500 (75%), Company gets KES 500 (25%)
```

### Office Cleaning in CBD
```
Task: Office cleaning
Price: KES 1500
Location: Times Tower (CBD)
Result: Assistant earns KES 1050 (70%), Company gets KES 450 (30%)
```

### Multi-Stop Business Errands
```
Task: Document collection at 3 locations
Price: KES 1200
Locations: 2 in CBD, 1 in Westlands
Result: Assistant earns KES 900 (75%), Company gets KES 300 (25%)
(Because one location is outside CBD)
```

### Express Maintenance Service
```
Task: Urgent plumbing repair
Price: KES 2500
Location: Anywhere
Service Type: Express
Result: Assistant earns KES 1500 (60%), Company gets KES 1000 (40%)
```

## 🎨 **Visual Indicators**

The system provides clear visual feedback:

- **Green indicators**: CBD locations (70% assistant earnings)
- **Blue indicators**: Non-CBD locations (75% assistant earnings)
- **Purple indicators**: Premium services (60% assistant earnings)
- **Map overlays**: Show CBD boundaries and buffer zones

## 🚀 **Benefits for All Task Types**

### For Assistants:
- **Clear earnings expectations** for any task
- **Higher rates for non-CBD tasks** (75% vs 70%)
- **Premium rates for express services** (60%)
- **Transparent calculation** shown upfront

### For Customers:
- **Consistent pricing structure** across all services
- **Clear breakdown** of costs and commissions
- **Location-based optimization** for better service

### For Business:
- **Flexible commission system** for all service types
- **Location-based incentives** to optimize service areas
- **Scalable structure** for new service types
- **Automated calculations** reduce manual work

## 🔄 **Easy Integration**

Adding commission calculation to any new task type is simple:

```javascript
// For any new task type
import { calculateCommissionForTask } from '../utils/commissionCalculator';

const newTaskCommission = calculateCommissionForTask(
  totalPrice,
  taskLocation, // single location or array of locations
  null, // delivery location (if applicable)
  serviceType // 'standard', 'premium', 'express'
);
```

## 📈 **Scalability**

The system is designed to handle:
- **New task types** without code changes
- **Multiple locations** per task
- **Different service levels** (standard, premium, express)
- **Custom commission rates** per task type if needed
- **Geographic expansion** to other cities

## ✅ **Conclusion**

**YES, the commission system works for ALL tasks!** Whether it's shopping, cleaning, maintenance, delivery, or any other errand, the system automatically calculates fair commission rates based on:

1. **Task location(s)** (CBD vs non-CBD)
2. **Service type** (standard vs premium)
3. **Task complexity** (single vs multi-location)

The 75% assistant earnings for non-CBD tasks and 70% for CBD tasks apply universally across all service types, ensuring fair compensation while incentivizing service in all areas of Nairobi.