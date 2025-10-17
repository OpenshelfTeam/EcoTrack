# Bin Request Workflow - Complete Implementation

## Overview
The bin request system has been fully implemented with GPS location capture and automatic bin creation upon delivery completion.

---

## Features Implemented

### 1. ✅ Resident Can Only Request Bins (Cannot Create)
- **Bins Page**: "Add New Bin" button is **hidden** for residents
- **Bins Page Title**: Shows "My Assigned Bins" for residents
- **Help Text**: Directs residents to "Bin Requests" page to get new bins
- **Access Control**: Only Admin/Operator/Authority can create bins manually

**Code Location**: `frontend/src/pages/BinsPage.tsx` (Line 362)
```tsx
{(user?.role === 'admin' || user?.role === 'operator' || user?.role === 'authority') && (
  <button onClick={() => setShowAddModal(true)}>
    <Plus /> Add New Bin
  </button>
)}
```

---

### 2. ✅ GPS Location Capture in Bin Request Form
The bin request form now includes:

#### **Address Field with GPS Button**
- **Text Input**: For manual address entry
- **GPS Button**: Automatically gets current location using Navigator API
- **Map Button**: Placeholder for future map picker functionality
- **Location Confirmation**: Shows captured coordinates with checkmark

**Code Location**: `frontend/src/pages/BinRequestsPage.tsx` (Lines 243-283)

#### **Features:**
- Reverse geocoding using OpenStreetMap Nominatim API
- Converts GPS coordinates to human-readable address
- Shows latitude/longitude with 6 decimal precision
- Loading state while getting location
- Error handling for denied permissions

**Functions:**
- `getCurrentLocation()` - Lines 54-101
- Uses `navigator.geolocation.getCurrentPosition()`
- Fetches from: `https://nominatim.openstreetmap.org/reverse?format=json`

---

### 3. ✅ Automatic Bin Creation on Delivery

#### **New Workflow:**
```
Step 1: RESIDENT REQUESTS
  ├─ Opens "Bin Requests" page
  ├─ Clicks "Request Bin"
  ├─ Selects bin type (General/Recyclable/Organic/Hazardous)
  ├─ Clicks GPS button to capture location
  ├─ Adds optional notes
  └─ Submits request
  
Step 2: OPERATOR APPROVAL
  ├─ Receives notification about new request
  ├─ Reviews request details
  ├─ Approves request
  └─ Sets delivery date
  
Step 3: COLLECTOR DELIVERY
  ├─ Views scheduled deliveries
  ├─ Physically delivers bin to resident
  ├─ Updates delivery status to "DELIVERED"
  └─ System automatically triggers bin creation
  
Step 4: AUTOMATIC BIN CREATION ⚡
  ├─ System creates bin with:
  │   ├─ Status: "active" (immediately usable)
  │   ├─ Type: From original request
  │   ├─ Capacity: Auto-determined (80L/100L/120L)
  │   ├─ Location: From GPS coordinates
  │   ├─ Assigned to: Resident who requested
  │   └─ Created by: Collector who delivered
  ├─ Updates bin request status to "delivered"
  ├─ Links bin to request
  └─ Sends notification to resident
  
Step 5: RESIDENT RECEIVES BIN
  ├─ Gets notification: "Bin Delivered and Activated"
  ├─ Views bin in "My Bins" section
  └─ Can start using bin immediately
```

---

## Backend Implementation

### **File: `controllers/binRequest.controller.js`**

#### `approveAndAssignRequest()` (Lines 47-125)
**What Changed:**
- ❌ OLD: Created bin immediately with "in-transit" status
- ✅ NEW: Only creates delivery record, no bin creation

**New Logic:**
```javascript
// Update request status to approved (bin will be created when delivery is completed)
request.status = 'approved';
request.paymentVerified = paymentVerified;
await request.save();

// Create delivery record (bin will be created when delivery is marked as delivered)
const delivery = await Delivery.create({
  bin: null, // Will be set when bin is created on delivery completion
  resident: request.resident._id,
  scheduledDate: deliveryDate || request.preferredDeliveryDate || new Date()
});

// Store delivery info in request for later use
request.deliveryId = delivery._id;
await request.save();
```

---

### **File: `controllers/delivery.controller.js`**

#### `updateDeliveryStatus()` (Lines 29-85)
**What Changed:**
- ✅ NEW: When status = "delivered", automatically creates bin

**New Logic:**
```javascript
if (status === 'delivered') {
  delivery.confirmedAt = new Date();
  
  // Find the corresponding bin request
  const binRequest = await BinRequest.findOne({ 
    resident: delivery.resident._id, 
    status: 'approved',
    deliveryId: delivery._id 
  });
  
  if (binRequest) {
    // Create the actual bin now that delivery is completed
    const bin = await SmartBin.create({
      binType: binRequest.requestedBinType,
      capacity: determineCapacity(binRequest.requestedBinType),
      currentLevel: 0,
      status: 'active', // Bin is immediately active when delivered
      assignedTo: delivery.resident._id,
      createdBy: req.user._id, // Collector who delivered
      deliveryDate: delivery.scheduledDate,
      activationDate: new Date(),
      location: {
        type: 'Point',
        coordinates: [binRequest.coordinates.lng, binRequest.coordinates.lat],
        address: binRequest.address
      }
    });

    // Update delivery with bin reference
    delivery.bin = bin._id;
    
    // Update bin request with assigned bin
    binRequest.assignedBin = bin._id;
    binRequest.status = 'delivered'; // Mark request as completed
    await binRequest.save();

    // Create notification for resident
    await Notification.create({
      recipient: delivery.resident._id,
      type: 'bin-activated',
      title: 'Bin Delivered and Activated',
      message: `Your ${binType} bin has been delivered and is now active.`,
      priority: 'high'
    });
  }
}
```

**Bin Capacities:**
- Hazardous: 80L
- Organic: 100L
- General/Recyclable: 120L

---

### **File: `models/BinRequest.model.js`**

#### Added Fields:
```javascript
deliveryId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Delivery',
  default: null
}

status: {
  type: String,
  enum: ['pending', 'approved', 'rejected', 'cancelled', 'delivered'], // Added 'delivered'
  default: 'pending'
}
```

---

## Frontend Implementation

### **File: `pages/BinRequestsPage.tsx`**

#### State Management (Lines 14-18):
```typescript
const [gettingLocation, setGettingLocation] = useState(false);
const [requestCoordinates, setRequestCoordinates] = useState<{ lat: number; lng: number } | null>(null);
const [requestAddress, setRequestAddress] = useState('');
```

#### Form Submission (Lines 39-48):
```typescript
const handleCreateRequest = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  createMutation.mutate({
    requestedBinType: formData.get('binType') as string,
    preferredDeliveryDate: formData.get('deliveryDate') as string,
    notes: formData.get('notes') as string,
    address: requestAddress, // GPS-captured address
    coordinates: requestCoordinates // GPS coordinates
  });
};
```

#### GPS Function (Lines 54-101):
```typescript
const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setRequestCoordinates({ lat: latitude, lng: longitude });

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setRequestAddress(data.display_name);
      }
    }
  );
};
```

---

## Access Control Summary

| Role | Can Create Bins | Can Request Bins | Can View All Bins |
|------|----------------|------------------|-------------------|
| **Resident** | ❌ No | ✅ Yes | ❌ No (only own) |
| **Operator** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Authority** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Collector** | ❌ No | ❌ No | ✅ Yes (for route planning) |

---

## Notifications

### When Resident Requests:
- **Recipients**: All Operators + Admins
- **Type**: `bin-request`
- **Message**: "{Name} has requested a {type} bin at {address}"

### When Operator Approves:
- **Recipient**: Resident
- **Type**: `bin-delivered`
- **Message**: "Your {type} bin request has been approved. Delivery scheduled for {date}. Tracking: {trackingNumber}"

### When Collector Delivers (Bin Created):
- **Recipient**: Resident
- **Type**: `bin-activated`
- **Message**: "Your {type} bin has been delivered and is now active. You can start using it immediately."

---

## Testing Checklist

### Test 1: Resident Bin Request with GPS
- [ ] Login as resident
- [ ] Go to "Bin Requests" page
- [ ] Click "Request Bin"
- [ ] Click GPS button
- [ ] Verify address is captured
- [ ] Verify coordinates are shown
- [ ] Submit request
- [ ] Verify success message

### Test 2: Operator Approval
- [ ] Login as operator
- [ ] Check notifications for new bin request
- [ ] Go to "Bin Requests" page
- [ ] Click "Approve" on pending request
- [ ] Set delivery date
- [ ] Verify approval success
- [ ] Verify resident receives notification

### Test 3: Collector Delivery (Auto Bin Creation)
- [ ] Login as collector/operator
- [ ] Go to "Deliveries" page
- [ ] Find scheduled delivery
- [ ] Update status to "DELIVERED"
- [ ] Verify bin is created in database
- [ ] Login as resident
- [ ] Go to "My Bins" page
- [ ] Verify new bin appears
- [ ] Verify bin status is "active"
- [ ] Verify location matches request

### Test 4: Access Control
- [ ] Login as resident
- [ ] Go to "Bins" page
- [ ] Verify "Add New Bin" button is hidden
- [ ] Verify only own bins are visible
- [ ] Login as operator
- [ ] Verify "Add New Bin" button is visible
- [ ] Verify all bins in system are visible

---

## API Endpoints

### Bin Request Endpoints:
```
POST   /api/bin-requests              - Create new request (resident)
GET    /api/bin-requests              - Get requests (filtered by role)
POST   /api/bin-requests/:id/approve  - Approve request (operator/admin)
POST   /api/bin-requests/:id/cancel   - Cancel request (resident)
```

### Delivery Endpoints:
```
POST   /api/deliveries                - Create delivery
GET    /api/deliveries                - Get deliveries
PUT    /api/deliveries/:id/status     - Update delivery status (triggers bin creation)
```

### Smart Bin Endpoints:
```
GET    /api/smart-bins                - Get bins (filtered by role)
POST   /api/smart-bins                - Create bin (operator/admin/authority only)
PUT    /api/smart-bins/:id            - Update bin
DELETE /api/smart-bins/:id            - Delete bin
```

---

## Database Schema Changes

### BinRequest Model:
```javascript
{
  // ... existing fields
  address: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  deliveryId: ObjectId, // NEW: Links to Delivery
  status: ['pending', 'approved', 'rejected', 'cancelled', 'delivered'], // Added 'delivered'
}
```

### Delivery Model:
```javascript
{
  bin: ObjectId, // Initially null, set when bin is created
  resident: ObjectId,
  scheduledDate: Date,
  status: ['scheduled', 'in-transit', 'delivered', 'failed', 'rescheduled'],
  confirmedAt: Date
}
```

---

## Key Benefits

1. **Real-World Workflow**: Matches actual delivery process
2. **No Phantom Bins**: Bins only created when physically delivered
3. **Better Tracking**: Clear delivery status with tracking numbers
4. **Accurate Location**: GPS coordinates from actual delivery address
5. **Resident-Friendly**: Simple request process with location help
6. **Automatic Process**: No manual bin creation step needed
7. **Proper Access Control**: Residents can't create bins directly

---

## Future Enhancements

- [ ] Add map picker UI for location selection
- [ ] Add photo upload for proof of delivery
- [ ] Add QR code scanning for bin activation
- [ ] Add delivery signature capture
- [ ] Add real-time delivery tracking
- [ ] Add SMS notifications for delivery updates
- [ ] Add estimated delivery time window
- [ ] Add delivery route optimization

---

*Last Updated: October 17, 2025*
*Status: ✅ Fully Implemented and Ready for Testing*
