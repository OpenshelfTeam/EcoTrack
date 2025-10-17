# QR Scan & Notification Feature Implementation

## Overview
Enhanced the bin collection system with QR code scanning functionality and automatic notifications to residents and admins when bins are collected, found empty, or damaged.

## Features Implemented

### 1. Sri Lanka Map View (Routes Page)
✅ **Location**: `frontend/src/pages/RoutesPage.tsx`

**Map Bounds Restricted to Sri Lanka:**
- Southwest corner: `[5.5°N, 79.0°E]`
- Northeast corner: `[10.2°N, 82.5°E]`
- `minZoom`: 7 (prevents zooming out beyond Sri Lanka)
- `maxZoom`: 18 (allows street-level detail)
- `maxBoundsViscosity`: 1.0 (prevents panning outside boundaries)

**Smart Auto-Zoom:**
- Automatically calculates route center and appropriate zoom level
- Large routes (>0.5° spread): Zoom 10
- Medium routes (>0.2° spread): Zoom 12
- City-level routes (default): Zoom 13
- Small neighborhoods (<0.05° spread): Zoom 14

**Route Visualization:**
- Blue polyline connecting all bins in collection order
- White dashed overlay for better visibility
- Numbered markers (1, 2, 3...) for each bin
- Color-coded status:
  - 🟡 Yellow: Current bin to collect
  - 🔵 Blue: Upcoming bins
  - 🟢 Green: Already collected (✓)

### 2. Enhanced QR Code Scanning
✅ **Location**: `frontend/src/pages/RoutesPage.tsx` (lines 1403-1520)

**Scan Bin QR Code Modal:**
- Visual QR code scanner interface
- Shows bin location details
- "Confirm Scan" button triggers status selection

**Bin Status Selection Modal:**
Three collection options:
1. **Collected Successfully** (Green) - Bin was collected normally
2. **No Garbage (Empty)** (Yellow) - Bin was empty
3. **Damaged / Report Issue** (Red) - Bin needs attention or is damaged

### 3. Automatic Notifications System
✅ **Location**: `backend/controllers/collection.controller.js`

**Backend Notification Logic:**
When a collector marks a bin status, the system automatically:

#### For Residents (Bin Owners):
- **Collected**: "✅ Bin Collected Successfully - Your bin at [address] has been collected. Thank you for using EcoTrack!"
- **Empty**: "📭 Bin Was Empty - Your bin at [address] was checked but found to be empty."
- **Damaged/Exception**: "⚠️ Bin Requires Attention - Your bin at [address] needs attention. [Issue description]"

#### For Admins & Authorities:
- **Collected**: "Bin [BIN_ID] collected by [Collector Name] on route [Route Name]."
- **Empty**: "Bin [BIN_ID] was empty during collection on route [Route Name]."
- **Exception**: "⚠️ Exception reported for bin [BIN_ID] on route [Route Name]: [Issue details]"

**Notification Priority:**
- Exception/Damaged: **High Priority** 🔴
- Collected: **Normal Priority**
- Empty: **Normal Priority**
- Admin notifications for regular collections: **Low Priority**

**Notification Data Includes:**
- Collection ID
- Bin ID
- Route ID (for admins)
- Collector name
- Status (collected/empty/exception)
- Collection date/time
- Issue description (if exception)

### 4. Database Updates
✅ **Automatic Bin Status Updates:**
- **Collected**: Sets `currentLevel` to 0, updates `lastEmptied` timestamp
- **Empty**: Records empty status in collection record
- **Exception/Damaged**: Marks bin status as `maintenance-required`

✅ **Route Progress Tracking:**
- Increments `collectedBins` counter on successful collections
- Updates route completion status

## Technical Implementation

### Frontend Changes

**File**: `frontend/src/pages/RoutesPage.tsx`

1. **Map Configuration** (lines 806-820):
```tsx
<MapContainer
  center={[7.8731, 80.7718]} // Center of Sri Lanka
  zoom={10}
  minZoom={7}
  maxZoom={18}
  maxBounds={[
    [5.5, 79.0],  // Southwest
    [10.2, 82.5]  // Northeast
  ]}
  maxBoundsViscosity={1.0}
  style={{ height: '100%', width: '100%' }}
  className="z-0"
>
```

2. **Smart Zoom Calculator** (lines 18-45):
- Calculates route center from bin coordinates
- Determines optimal zoom based on route spread
- Animates map view transitions

3. **QR Scanner Flow**:
- Click "Scan Bin QR Code" → Scanner Modal
- Confirm Scan → Status Selection Modal
- Select Status (Collected/Empty/Damaged) → Records collection
- Automatic notification sent to resident & admins

### Backend Changes

**File**: `backend/controllers/collection.controller.js`

1. **Added Imports** (lines 1-5):
```javascript
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
```

2. **Notification Logic** (lines 174-257):
```javascript
// Send notifications to resident and admins
try {
  const notifications = [];
  
  // Resident notification
  if (bin.createdBy) {
    notifications.push({
      recipient: bin.createdBy._id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      data: { /* collection details */ },
      priority: status === 'exception' ? 'high' : 'normal'
    });
  }
  
  // Admin notifications
  const admins = await User.find({ 
    role: { $in: ['admin', 'authority'] },
    isActive: true 
  });
  
  admins.forEach(admin => {
    notifications.push({ /* admin notification */ });
  });
  
  await Notification.insertMany(notifications);
} catch (notifError) {
  console.error('Failed to send notifications:', notifError);
}
```

## User Flow

### Collector Workflow:
1. Start route from "My Routes" page
2. Navigate to first bin location
3. Click "Scan Bin QR Code"
4. Scanner modal appears
5. Click "Confirm Scan"
6. Select bin status:
   - ✅ Collected Successfully
   - 📭 No Garbage (Empty)
   - ⚠️ Damaged / Report Issue
7. System records collection
8. Notifications automatically sent
9. Move to next bin

### Resident Experience:
1. Receives real-time notification when bin is collected
2. Notification shows:
   - Status (collected/empty/needs attention)
   - Bin location
   - Collection date/time
   - Collector name
3. Can view in Notifications page
4. For exceptions: Receives high-priority alert

### Admin Experience:
1. Receives notifications for all collections
2. High-priority alerts for exceptions
3. Can monitor collection progress
4. Track issues requiring attention

## Benefits

✅ **Real-time Communication**: Residents know exactly when bins are collected
✅ **Issue Tracking**: Damaged bins automatically flagged for maintenance
✅ **Transparency**: Complete visibility of collection activities
✅ **Efficiency**: Collectors can quickly mark status without lengthy forms
✅ **Accountability**: Full audit trail of all collection activities
✅ **User Satisfaction**: Residents informed and engaged with service

## Testing Checklist

- [ ] Map loads showing only Sri Lanka
- [ ] Route path displays correctly with numbered markers
- [ ] Can't pan outside Sri Lanka boundaries
- [ ] QR scanner modal opens on button click
- [ ] Status selection modal shows three options
- [ ] Collection records successfully in database
- [ ] Resident receives notification for collected bin
- [ ] Resident receives notification for empty bin
- [ ] Resident receives notification for damaged bin
- [ ] Admins receive notifications for all collections
- [ ] Exception notifications marked as high priority
- [ ] Bin status updates correctly (currentLevel, lastEmptied)
- [ ] Route progress updates (collectedBins counter)
- [ ] Map auto-zooms to show complete route
- [ ] Next bin highlights after current collection

## Future Enhancements

🔮 **Potential Improvements:**
- Actual QR code camera scanning
- NFC tap-to-collect functionality
- Photo upload for damaged bins
- GPS verification of collector location
- Estimated time of arrival for residents
- Push notifications (mobile app)
- SMS notifications option
- Email notifications option
- Notification preferences per user
- Collection history timeline
- Real-time route tracking on map
- Voice commands for hands-free operation

## API Endpoints Used

**POST** `/api/collections` - Record bin collection
- Sends notifications to residents and admins
- Updates bin status
- Updates route progress

**GET** `/api/notifications` - Fetch user notifications
- Supports filtering by type, status, priority
- Pagination support

## Notification Types

- `collection` - Regular collection updates
- `system` - Exceptions and issues
- `pickup` - Pickup requests (existing)
- `payment` - Payment notifications (existing)
- `ticket` - Support ticket updates (existing)

## Files Modified

1. ✅ `frontend/src/pages/RoutesPage.tsx` - Map view & QR scanning
2. ✅ `backend/controllers/collection.controller.js` - Notification logic
3. ✅ `frontend/src/pages/MapPage.tsx` - Sri Lanka bounds
4. ✅ `frontend/src/pages/BinsPage.tsx` - Map picker bounds
5. ✅ `frontend/src/pages/PickupsPage.tsx` - Map picker bounds

## Summary

The system now provides a complete end-to-end solution for waste collection with:
- **Beautiful Sri Lanka-focused map** showing routes and bin locations
- **Simple QR code scanning** workflow for collectors
- **Automatic notifications** to all stakeholders
- **Real-time status updates** for bins and routes
- **Full audit trail** of all collection activities

Residents stay informed, collectors work efficiently, and admins maintain oversight - all automatically! 🎉
