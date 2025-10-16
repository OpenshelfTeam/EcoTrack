# Bin Location & Notification Feature

## Overview
Enhanced bin registration system with GPS location detection and automatic notifications to collectors, residents, and admins when new bins are added.

## Features Implemented

### 1. 🌍 **GPS Location Detection**

#### "Use Current Location" Button
- **One-Click Location Capture**: Get precise GPS coordinates instantly
- **Automatic Address Lookup**: Uses OpenStreetMap reverse geocoding
- **Real-Time Feedback**: Visual confirmation of captured coordinates
- **Permission Handling**: Guides users if location access is denied

#### How It Works
```typescript
// Click "Current Location" button
→ Browser requests location permission
→ GPS captures coordinates (latitude, longitude)
→ System reverse-geocodes to get address
→ Address auto-fills in the form
→ Coordinates saved with bin data
```

### 2. 🔔 **Automatic Notifications**

When a resident adds a new bin, the system automatically sends notifications to:

#### **Collectors** 🚛
- **Notification Type**: New Bin Alert
- **Priority**: Medium
- **Channels**: In-App + Push Notification
- **Message**: "A new [type] waste bin has been registered at [address]"
- **Action**: "View on Map" → Direct link to map page
- **Purpose**: Immediate awareness for collection planning

#### **Admins** 👨‍💼
- **Notification Type**: Bin Registration
- **Priority**: Low
- **Channels**: In-App
- **Message**: "[User] registered a new [type] bin (ID: [binId]) at [address]"
- **Action**: "View Bins" → Direct link to bins management
- **Purpose**: System oversight and monitoring

#### **Resident (Creator)** 🏠
- **Notification Type**: Confirmation
- **Priority**: High
- **Channels**: In-App + Email
- **Message**: "Your [type] waste bin at [address] has been successfully registered"
- **Action**: "View My Bins" → See all registered bins
- **Purpose**: Confirmation and peace of mind

### 3. 📍 **Enhanced Location Data**

#### Coordinate Storage
```javascript
{
  location: {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON format
    address: "123 Main St, Colombo, Sri Lanka"
  }
}
```

#### Map Integration
- Bins appear on map with exact GPS coordinates
- Auto-refresh shows new bins within 30 seconds
- Color-coded markers based on fill level
- Click markers to see full bin details

## User Experience

### Resident Adding a Bin

1. **Navigate to Bins Page** (`/bins`)
2. **Click "Add New Bin"** button
3. **Fill Basic Info**:
   - Location Name
   - Bin Type (General/Recyclable/Organic/Hazardous)
   - Capacity
4. **Get Location**:
   - Click "Current Location" button
   - Allow browser location permission
   - Wait 2-3 seconds for GPS lock
   - Address auto-fills from coordinates
   - See confirmation: "Location captured: 6.927100, 79.861200"
5. **Complete Form**:
   - Verify/edit address if needed
   - Set current fill level
   - Choose status
6. **Submit**:
   - Click "Add Bin"
   - Receive success notification
   - Bin appears on map immediately

### Collector Receiving Notification

1. **Notification Badge** appears in header
2. **Click Notifications** icon
3. **See Alert**: "🗑️ New Bin Added"
4. **Read Details**: Location, bin type, address
5. **Click "View on Map"**:
   - Redirects to map page
   - Bin highlighted with marker
   - Can plan collection route

### Admin Monitoring

1. **Receive In-App Notification**
2. **Review**: Who added bin, location, type
3. **Click "View Bins"**:
   - See all bins in system
   - Can edit/manage if needed
4. **Check Analytics**: Monitor bin distribution

## Technical Implementation

### Frontend (BinsPage.tsx)

#### State Management
```typescript
const [gettingLocation, setGettingLocation] = useState(false);
const [binCoordinates, setBinCoordinates] = useState<{ lat: number; lng: number } | null>(null);
```

#### GPS Location Function
```typescript
const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setBinCoordinates({ lat: latitude, lng: longitude });
      
      // Reverse geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      setNewBin({ ...newBin, address: data.display_name });
    },
    (error) => {
      alert('Unable to get location. Please enable location permissions.');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};
```

#### UI Components
```tsx
<button onClick={getCurrentLocation} disabled={gettingLocation}>
  {gettingLocation ? (
    <>
      <Loader2 className="animate-spin" />
      Getting...
    </>
  ) : (
    <>
      <MapPin />
      Current Location
    </>
  )}
</button>

{binCoordinates && (
  <p className="text-emerald-600">
    ✓ Location captured: {binCoordinates.lat.toFixed(6)}, {binCoordinates.lng.toFixed(6)}
  </p>
)}
```

### Backend (smartBin.controller.js)

#### Create Bin with Notifications
```javascript
export const createSmartBin = async (req, res) => {
  // 1. Create the bin
  const bin = await SmartBin.create(req.body);
  
  // 2. Get creator info
  const creator = await User.findById(req.user.id);
  
  // 3. Notify collectors
  const collectors = await User.find({ role: 'collector', status: 'active' });
  collectors.forEach(collector => {
    Notification.create({
      recipient: collector._id,
      type: 'bin-delivered',
      title: '🗑️ New Bin Added',
      message: `A new ${bin.binType} waste bin at ${bin.location?.address}`,
      priority: 'medium',
      channel: ['in-app', 'push'],
      relatedEntity: { entityType: 'bin', entityId: bin._id },
      metadata: { actionUrl: '/map', actionLabel: 'View on Map' }
    });
  });
  
  // 4. Notify admins
  // 5. Notify creator
  // ...
};
```

## API Integration

### Reverse Geocoding
**Service**: OpenStreetMap Nominatim
**Endpoint**: `https://nominatim.openstreetmap.org/reverse`
**Free**: Yes, no API key required
**Rate Limit**: 1 request per second

#### Request
```
GET https://nominatim.openstreetmap.org/reverse
  ?format=json
  &lat=6.9271
  &lon=79.8612
```

#### Response
```json
{
  "display_name": "Fort, Colombo, Western Province, Sri Lanka",
  "address": {
    "suburb": "Fort",
    "city": "Colombo",
    "state": "Western Province",
    "country": "Sri Lanka"
  }
}
```

## Notification Types

### Bin-Delivered
- **When**: New bin added to system
- **Recipients**: All active collectors
- **Priority**: Medium
- **Channels**: In-App, Push

### Bin-Activated
- **When**: Bin successfully registered
- **Recipients**: Bin creator
- **Priority**: High
- **Channels**: In-App, Email

### System-Alert (Admin)
- **When**: New bin registered
- **Recipients**: All admins
- **Priority**: Low
- **Channels**: In-App

## Testing Guide

### Test 1: GPS Location Capture

1. Open Bins page in browser
2. Click "Add New Bin"
3. Click "Current Location" button
4. **Expected**:
   - Browser asks for location permission
   - "Getting..." text appears with spinner
   - After 2-3 seconds, address fills automatically
   - Green confirmation message shows coordinates
   - Submit creates bin with exact GPS location

### Test 2: Manual Address Entry

1. Add new bin without clicking "Current Location"
2. Type address manually
3. Submit
4. **Expected**:
   - Bin created with default Colombo coordinates
   - Works fine, no errors

### Test 3: Notification to Collectors

**Setup**: Login as resident
1. Add a new bin with current location
2. **Expected**: Success message
3. Logout, login as collector
4. **Expected**:
   - Notification badge shows "1"
   - Notification: "🗑️ New Bin Added"
   - Click "View on Map" → Redirects to map
   - Bin visible on map

### Test 4: Notification to Admin

**Setup**: Login as resident
1. Add new bin
2. Logout, login as admin
3. **Expected**:
   - Notification appears
   - Shows who added bin, location, bin ID
   - Click "View Bins" → See in bins list

### Test 5: Creator Confirmation

**Setup**: Login as resident
1. Add new bin
2. **Expected**:
   - Immediate success notification
   - In-app notification: "✅ Bin Successfully Registered"
   - Email sent (check email)
   - Click "View My Bins" → See bin in list

### Test 6: Map Auto-Update

**Setup**: Collector viewing map
1. In another browser/tab: Resident adds bin
2. Wait 30 seconds (or click Refresh)
3. **Expected**:
   - New bin marker appears
   - Statistics update
   - Marker clickable for details

## Browser Permissions

### Location Permission States

#### Granted ✅
- GPS works instantly
- Accurate coordinates (±10 meters)
- Fast address lookup

#### Denied ❌
- Alert: "Unable to get location"
- User must enter address manually
- Can re-enable in browser settings

#### Prompt 🔔
- First-time use asks permission
- User clicks "Allow" or "Block"
- Choice saved for future visits

### How to Enable Location

**Chrome**:
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Location"
4. Select "Allow"

**Firefox**:
1. Click lock icon
2. Click "Connection secure"
3. More Information → Permissions
4. Allow Location

**Safari**:
1. Safari → Settings → Websites
2. Location
3. Allow for EcoTrack

## Security Considerations

### GPS Data Privacy
- ✅ Location only captured when user clicks button
- ✅ Permission requested before access
- ✅ Coordinates stored only with bin (not tracked)
- ✅ No continuous location monitoring

### Notification Security
- ✅ Only authenticated users receive notifications
- ✅ Notifications tied to user roles
- ✅ Can't access others' notification data
- ✅ HTTPS encryption in transit

### API Security
- ✅ OpenStreetMap Nominatim is public service
- ✅ No API keys exposed
- ✅ Rate limiting respected (1 req/sec)
- ✅ Graceful error handling

## Performance Optimization

### Location Capture
- **Timeout**: 10 seconds max
- **High Accuracy**: Enabled for precision
- **Cache**: No caching (always fresh)
- **Fallback**: Manual address if GPS fails

### Notifications
- **Batch Creation**: Promise.all() for parallel
- **Non-Blocking**: Doesn't delay bin creation
- **Error Handling**: Individual failures don't break flow
- **Async**: Background processing

### Map Updates
- **Auto-Refresh**: Every 30 seconds
- **Smart Polling**: Only when page visible
- **Efficient Queries**: MongoDB GeoJSON indexes
- **Cached Icons**: Leaflet marker optimization

## Troubleshooting

### Location Not Working

**Problem**: "Unable to get location" error
**Solutions**:
1. Check browser location permission
2. Ensure HTTPS (required for geolocation)
3. Try different browser
4. Check device location services enabled

**Problem**: Inaccurate location
**Solutions**:
1. Wait for better GPS signal
2. Move near window (better satellite view)
3. Disable WiFi location (use GPS only)
4. Manually adjust address

### Notifications Not Received

**Problem**: Collector not seeing notification
**Solutions**:
1. Refresh the page
2. Check user is logged in
3. Verify user role is 'collector'
4. Check user status is 'active'
5. Look in backend logs for errors

**Problem**: Email not sent
**Solutions**:
1. Check email service configured
2. Verify email in user profile
3. Check spam folder
4. Backend logs for SMTP errors

### Address Lookup Fails

**Problem**: Coordinates captured but no address
**Solutions**:
1. Check internet connection
2. OpenStreetMap may be rate-limited
3. Manually type address
4. Coordinates still saved correctly

## Future Enhancements

### Planned Features

1. **Map Picker** 📍
   - Visual map interface in modal
   - Drag marker to set location
   - Alternative to GPS

2. **Location History** 📜
   - Save frequently used locations
   - Quick-select from dropdown
   - Auto-suggest based on past bins

3. **Batch Import** 📊
   - CSV upload with coordinates
   - Bulk bin registration
   - Mass notifications

4. **Real-Time Push** ⚡
   - WebSocket integration
   - Instant notifications
   - No 30-second delay

5. **Photo Upload** 📸
   - Add bin photos
   - Visual verification
   - Damage documentation

6. **QR Code Generation** 🏷️
   - Auto-generate QR codes
   - Print labels
   - Mobile scanning

## API Endpoints

### Create Bin with Location
```http
POST /api/smart-bins
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "Fort, Colombo, Sri Lanka"
  },
  "capacity": 100,
  "binType": "general",
  "currentLevel": 0,
  "status": "active"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "67123abc...",
    "binId": "BIN00015",
    "location": {
      "type": "Point",
      "coordinates": [79.8612, 6.9271],
      "address": "Fort, Colombo, Sri Lanka"
    },
    "capacity": 100,
    "currentLevel": 0,
    "binType": "general",
    "status": "active",
    "createdAt": "2025-10-17T10:30:00.000Z"
  },
  "message": "Bin created successfully and notifications sent"
}
```

## Summary

This feature enhancement provides:

✅ **Easy Location Capture**: One-click GPS with automatic address lookup
✅ **Instant Notifications**: Collectors, admins, and residents stay informed
✅ **Improved Coordination**: Real-time bin registration awareness
✅ **Better Map Accuracy**: Precise GPS coordinates for collection planning
✅ **Enhanced UX**: Visual feedback, loading states, error handling
✅ **Privacy Respected**: Permission-based, transparent location access
✅ **Scalable Design**: Efficient notifications, optimized queries

**Result**: Streamlined bin registration process with automatic stakeholder communication, leading to faster collection response times and better waste management coordination.
