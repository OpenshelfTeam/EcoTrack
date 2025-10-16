# Collection Workflow Implementation Guide

## Overview
This guide documents the complete waste collection workflow implementation for collectors in the EcoTrack system.

## Features Implemented

### 1. Collection Route Execution
- **Route Selection**: Collectors can view and select assigned routes
- **Interactive Map View**: Visual bin locations with status indicators
- **Progress Tracking**: Real-time collection progress display
- **Step-by-Step Navigation**: Navigate through bins sequentially

### 2. Bin Scanning & Status Recording
- **QR Code Simulation**: Bin scanning interface for verification
- **Status Options**:
  - ✅ **Collected** - Waste successfully collected
  - ⚪ **Empty** - No garbage in bin
  - ❌ **Exception** - Damaged/Inaccessible/Other issues

### 3. Exception Reporting
- **Issue Types**:
  - Bin Damaged
  - Bin Inaccessible
  - Bin Missing
  - Hazardous Material
  - Overfilled
  - Other
- **Photo Upload**: Capture evidence of issues
- **Detailed Notes**: Description of the problem
- **Automatic Notifications**: Alerts sent to bin owners and admins

### 4. Route Completion
- **Summary Statistics**: Collected, empty, and damaged bins count
- **Validation**: Confirms all bins processed or allows partial completion
- **Record Creation**: Collection records saved to database
- **Notifications**: Completion alerts to stakeholders

## User Journey

### For Collectors

#### 1. Login & View Routes
```
Login → Dashboard → My Routes
```
- View only assigned routes (role-based filtering)
- See route status: Pending, In-Progress, Completed
- Filter by date, area, status

#### 2. Start Collection Route
```
My Routes → Select Route → Click "Start Collection"
```
- Route status changes to "In-Progress"
- Map view displays all bin locations
- Current bin is highlighted
- Progress counter shows X/Y bins

#### 3. Collect Bins (Main Flow)
```
For each bin:
  1. Navigate to bin location
  2. Click "Scan Bin QR Code"
  3. Confirm scan
  4. Select status:
     - "Collected Successfully" → Records collection
     - "No Garbage (Empty)" → Records empty bin
     - "Damaged / Report Issue" → Opens exception form
  5. System records to database
  6. Auto-moves to next bin
```

#### 4. Report Exceptions (Alternative Flow)
```
Exception Flow:
  1. Select "Damaged / Report Issue"
  2. Upload photo (required)
  3. Select issue type (required)
  4. Enter description (required)
  5. Submit report
  6. Notifications sent to:
     - Bin owner
     - System admins
  7. Bin status marked as "maintenance-required"
```

#### 5. Complete Route
```
After all bins processed:
  1. Click "Complete Route"
  2. Review summary:
     - Total collected
     - Total empty
     - Total damaged
  3. Confirm completion
  4. Route status → "Completed"
  5. Notifications sent to all stakeholders
```

## Technical Implementation

### Frontend Components

#### RoutesPage.tsx
**Location**: `/frontend/src/pages/RoutesPage.tsx`

**Key Features**:
- Route list with "Start Collection" button for pending routes
- Interactive map view when route is active
- Bin grid display with status indicators
- Progress tracking panel
- Recent collections list

**State Management**:
```typescript
const [activeRoute, setActiveRoute] = useState<Route | null>(null);
const [currentBinIndex, setCurrentBinIndex] = useState(0);
const [collectedBins, setCollectedBins] = useState<any[]>([]);
const [showBinScanner, setShowBinScanner] = useState(false);
const [showBinStatusModal, setShowBinStatusModal] = useState(false);
const [showExceptionModal, setShowExceptionModal] = useState(false);
const [currentBin, setCurrentBin] = useState<any>(null);
```

**Key Functions**:
- `handleStartCollectionRoute()` - Starts route execution
- `handleScanBin()` - Simulates QR code scanning
- `handleMarkBinStatus()` - Records bin collection status
- `handleReportException()` - Submits exception reports
- `handleCompleteCollectionRoute()` - Finalizes route completion

### Backend Services

#### Collection Service
**Location**: `/frontend/src/services/collection.service.ts`

**New Method**: `recordBinCollection()`
```typescript
async recordBinCollection(data: {
  route: string;
  bin: string;
  status: 'collected' | 'empty' | 'exception';
  wasteWeight?: number;
  binLevelBefore?: number;
  binLevelAfter?: number;
  notes?: string;
  exception?: {
    issueType: string;
    description: string;
    photo?: File;
  };
})
```

**Features**:
- Sends collection data to backend
- Handles photo uploads via FormData
- Records exception details
- Updates bin status

#### Route Controller
**Location**: `/backend/controllers/route.controller.js`

**Endpoints**:
- `PATCH /api/routes/:id/start` - Start route execution
- `PATCH /api/routes/:id/complete` - Complete route
- `POST /api/collections` - Create collection record

**Authorization**:
- Collectors can only access assigned routes
- Route ownership verified before actions

#### Collection Record Controller
**Location**: `/backend/controllers/collection.controller.js`

**Features**:
- Creates collection records with bin status
- Handles exception reporting
- Updates bin levels after collection
- Marks damaged bins for maintenance
- Increments route collected bins counter

### Database Models

#### CollectionRecord
**Location**: `/backend/models/CollectionRecord.model.js`

**Key Fields**:
```javascript
{
  route: ObjectId,           // Reference to Route
  bin: ObjectId,             // Reference to SmartBin
  collector: ObjectId,       // Reference to User (collector)
  resident: ObjectId,        // Reference to User (bin owner)
  collectionDate: Date,
  wasteWeight: Number,
  wasteType: String,
  binLevelBefore: Number,
  binLevelAfter: Number,
  status: String,            // collected, empty, exception
  exception: {
    reported: Boolean,
    reason: String,
    description: String,
    resolvedAt: Date
  },
  notes: String,
  images: [{ url, type, uploadedAt }]
}
```

## API Integration

### Collection Recording Flow
```
Frontend:
  handleMarkBinStatus('collected')
    ↓
  collectionService.recordBinCollection({
    route: activeRoute._id,
    bin: currentBin._id,
    status: 'collected',
    binLevelBefore: 75,
    binLevelAfter: 0,
    wasteWeight: 37.5
  })
    ↓
Backend:
  POST /api/collections
    ↓
  createCollectionRecord()
    ↓
  - Create CollectionRecord
  - Update SmartBin (currentLevel = 0, lastEmptied = now)
  - Increment Route.collectedBins
  - Return populated record
    ↓
Frontend:
  - Add to collectedBins array
  - Invalidate route queries
  - Move to next bin
```

### Exception Reporting Flow
```
Frontend:
  handleReportException()
    ↓
  collectionService.recordBinCollection({
    route: activeRoute._id,
    bin: currentBin._id,
    status: 'exception',
    notes: 'Bin is damaged and inaccessible',
    exception: {
      issueType: 'damaged',
      description: 'Front lid is broken',
      photo: File
    }
  })
    ↓
Backend:
  POST /api/collections
    ↓
  createCollectionRecord()
    ↓
  - Create CollectionRecord with exception data
  - Update SmartBin status to 'maintenance-required'
  - Save photo upload
  - Send notifications
  - Return populated record
    ↓
Frontend:
  - Add to collectedBins array
  - Show success message
  - Move to next bin
```

## UI Components

### Route List View
**Features**:
- Grid of route cards
- Status badges (Pending, In-Progress, Completed)
- Progress bars for active routes
- "Start Collection" button for pending routes
- Filters: Status, Area, Date

### Collection Map View
**Features**:
- **Bin Grid**: Visual representation of all bins on route
  - ✅ Green with checkmark - Collected
  - 🟡 Yellow with pulse - Current bin
  - ⚪ White - Not yet collected
- **Current Bin Panel**:
  - Location address
  - Bin type
  - Distance to bin
  - "Scan Bin QR Code" button
- **Progress Panel**:
  - X/Y bins counter
  - Progress bar
  - Statistics: Collected, Empty, Damaged
- **Quick Actions**:
  - Report Issue
  - Cancel Route
- **Recent Collections List**:
  - Last 5 collections
  - Status indicators

### Modals

#### 1. Bin Scanner Modal
- QR code animation
- Bin location display
- "Confirm Scan" button
- Cancel option

#### 2. Bin Status Modal
- Bin details display
- Three action buttons:
  - ✅ "Collected Successfully" (Green)
  - ⚪ "No Garbage (Empty)" (Yellow)
  - ❌ "Damaged / Report Issue" (Red)

#### 3. Exception Report Modal
- Photo upload section (required)
- Issue type dropdown (required)
- Description textarea (required)
- Warning notification message
- Submit and Cancel buttons

## Role-Based Access

### Collector Role
- **Can View**: Only assigned routes
- **Can Start**: Pending/Active routes assigned to them
- **Can Record**: Collections for their active routes
- **Can Report**: Exceptions during collection
- **Can Complete**: Their own in-progress routes

### Admin/Operator Role
- **Can View**: All routes
- **Can Create**: New routes
- **Can Assign**: Routes to collectors
- **Can Edit**: Route details
- **Can Delete**: Routes
- **Can Optimize**: Route bin order

### Resident Role
- **Can View**: Collection records for their bins
- **Can Receive**: Notifications about collections
- **No Access**: Route execution features

## Testing Workflow

### 1. Setup Test Data
```bash
# Create test bins (already done - 14 bins in Colombo)
# Create test route with assigned bins
# Assign route to collector user
```

### 2. Test as Collector
```
1. Login as collector
2. Navigate to My Routes
3. See only assigned routes
4. Click "Start Collection" on a pending route
5. Map view loads with bins displayed
6. Click on first bin → Scan modal opens
7. Confirm scan → Status modal opens
8. Select "Collected Successfully"
9. Verify:
   - Bin marked as collected (green checkmark)
   - Progress updates (1/14)
   - Auto-moves to next bin
   - Recent collections shows entry
```

### 3. Test Exception Reporting
```
1. During collection, select a bin
2. Click "Damaged / Report Issue"
3. Upload photo
4. Select "Bin Damaged"
5. Enter description
6. Submit report
7. Verify:
   - Bin marked with red X
   - Exception recorded in database
   - Bin owner receives notification
   - Admin receives notification
   - Bin status changed to "maintenance-required"
```

### 4. Test Route Completion
```
1. Collect/process all bins
2. Click "Complete Route"
3. Review summary
4. Confirm completion
5. Verify:
   - Route status changed to "completed"
   - All collection records saved
   - Bin levels updated
   - Notifications sent
   - Return to route list
```

## Database Records Created

### Example Collection Record (Successful)
```json
{
  "_id": "...",
  "route": "route_id",
  "bin": "bin_id",
  "collector": "collector_user_id",
  "resident": "resident_user_id",
  "collectionDate": "2024-01-15T10:30:00Z",
  "wasteWeight": 37.5,
  "wasteType": "general",
  "binLevelBefore": 75,
  "binLevelAfter": 0,
  "status": "collected",
  "location": { type: "Point", coordinates: [79.8612, 6.9271] },
  "notes": "Successfully collected",
  "exception": { reported: false }
}
```

### Example Collection Record (Exception)
```json
{
  "_id": "...",
  "route": "route_id",
  "bin": "bin_id",
  "collector": "collector_user_id",
  "resident": "resident_user_id",
  "collectionDate": "2024-01-15T10:45:00Z",
  "wasteWeight": 0,
  "wasteType": "general",
  "binLevelBefore": 80,
  "binLevelAfter": 80,
  "status": "exception",
  "location": { type: "Point", coordinates: [79.8612, 6.9271] },
  "notes": "Bin is damaged and inaccessible",
  "exception": {
    "reported": true,
    "reason": "damaged",
    "description": "Front lid is broken, cannot access waste"
  },
  "images": [
    { url: "/uploads/exception_12345.jpg", type: "exception", uploadedAt: "2024-01-15T10:45:00Z" }
  ]
}
```

## Notifications Sent

### On Bin Collection
**Recipients**: Bin Owner
**Message**: "Your bin at [address] has been collected."
**Channels**: In-app, Email, Push

### On Empty Bin
**Recipients**: Bin Owner, Admin
**Message**: "Your bin at [address] was marked as empty during collection."
**Channels**: In-app, Email

### On Exception Report
**Recipients**: Bin Owner, Admin, System Operators
**Message**: "Your bin at [address] is damaged and needs attention. Issue: [description]"
**Channels**: In-app, Email, Push (High Priority)

### On Route Completion
**Recipients**: All bin owners on route, Admin
**Message**: "Collection route [route_name] completed. [X] bins collected."
**Channels**: In-app, Email

## Performance Optimizations

### Frontend
- **React Query Caching**: Route and collection data cached
- **Auto-Refresh**: Invalidates queries after mutations
- **Optimistic Updates**: UI updates immediately, then syncs
- **Progressive Loading**: Modals lazy-loaded

### Backend
- **Population**: Eagerly loads related data (bins, collectors)
- **Indexing**: GeoJSON 2dsphere index on bin locations
- **Batch Updates**: Single save operations for multiple changes
- **Role Filtering**: Database-level query filtering

## Future Enhancements

### Planned Features
1. **GPS Tracking**: Real-time collector location
2. **Route Optimization**: AI-powered shortest path calculation
3. **Offline Mode**: Collect data offline, sync when online
4. **Analytics Dashboard**: Collection statistics and trends
5. **Photo Recognition**: AI to verify waste levels
6. **Voice Commands**: Hands-free bin status recording
7. **Navigation Integration**: Turn-by-turn directions to bins
8. **Weight Sensors**: Automatic waste weight recording
9. **Resident Feedback**: Rate collection service
10. **Multi-Language**: Internationalization support

## Troubleshooting

### Common Issues

#### 1. "Failed to record bin collection"
**Cause**: Backend API error or network issue
**Solution**: Check console logs, verify token, retry

#### 2. Route not starting
**Cause**: Route already in-progress or completed
**Solution**: Refresh page, check route status

#### 3. Bins not displaying
**Cause**: Route has no assigned bins
**Solution**: Admin must assign bins to route first

#### 4. Photo upload fails
**Cause**: File size too large (>10MB)
**Solution**: Compress image, use smaller file

#### 5. Can't see assigned routes
**Cause**: Not logged in as collector or no routes assigned
**Solution**: Verify user role, ask admin to assign routes

## Security Considerations

### Authorization
- ✅ Collectors can only access their assigned routes
- ✅ Route ownership verified on every action
- ✅ Collection records linked to authenticated user
- ✅ Exception reports require collector authentication

### Data Validation
- ✅ Route and bin IDs validated
- ✅ Status values restricted to enum
- ✅ Photo file type and size validated
- ✅ Required fields enforced

### Privacy
- ✅ Residents only see their own bins
- ✅ Collection records filtered by role
- ✅ Location data protected

## Conclusion

The collection workflow implementation provides a complete end-to-end solution for waste collectors to:
- View assigned routes
- Execute collections with interactive map guidance
- Record bin statuses (collected, empty, exception)
- Report issues with photo evidence
- Complete routes with summary statistics

All actions are properly recorded in the database, notifications are sent to stakeholders, and the UI provides real-time feedback for a smooth user experience.

## Quick Reference

### Collector Actions
| Action | Route | Method | Status Change |
|--------|-------|--------|---------------|
| View Routes | GET /api/routes | GET | - |
| Start Route | PATCH /api/routes/:id/start | PATCH | pending → in-progress |
| Record Collection | POST /api/collections | POST | - |
| Complete Route | PATCH /api/routes/:id/complete | PATCH | in-progress → completed |

### Collection Statuses
| Status | Meaning | Bin Update | Route Update |
|--------|---------|------------|--------------|
| collected | Waste collected | currentLevel = 0, lastEmptied = now | collectedBins++ |
| empty | No garbage | No change | No change |
| exception | Issue reported | status = maintenance-required | No change |

### UI Navigation
```
Login → My Routes → [Select Route] → Start Collection
  ↓
Map View (Active Route)
  ↓
[For Each Bin]
  → Scan QR Code → Confirm Scan → Select Status
  → [If Collected] → Next Bin
  → [If Empty] → Next Bin
  → [If Exception] → Report Form → Upload Photo → Submit → Next Bin
  ↓
Complete Route → Review Summary → Confirm → Route List
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Author**: EcoTrack Development Team
