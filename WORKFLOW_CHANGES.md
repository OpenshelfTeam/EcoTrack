# Bin Request & Delivery Workflow Changes

## Overview
Updated the bin request and delivery workflow to allow operators to assign collectors when approving requests, and restrict delivery updates to only assigned collectors.

---

## Backend Changes

### 1. **binRequest.controller.js**
#### Modified `approveAndAssignRequest` function:
- **Added**: `collectorId` parameter to accept collector assignment
- **Added**: Validation to ensure collectorId is a valid collector user
- **Added**: Assigns collector to `deliveryTeam` field when creating delivery
- **Added**: Creates notification for assigned collector about new delivery

**New Flow:**
```
1. Operator approves bin request
2. Optional: Operator assigns a collector
3. Delivery is created with assigned collector
4. Notifications sent to:
   - Resident: "Bin request approved"
   - Collector: "New delivery assignment" (if assigned)
```

---

### 2. **delivery.controller.js**
#### Modified `updateDeliveryStatus` function:
- **Added**: Authorization check - only assigned collector, operator, or admin can update
- **Returns 403** if non-assigned collector tries to update delivery

#### Added `reassignCollector` function:
- **Purpose**: Allows operators/admins to reassign delivery to different collector
- **Authorization**: Only operators and admins
- **Actions**:
  - Validates new collector exists and has collector role
  - Updates `deliveryTeam` field
  - Sends notification to new collector
  - Sends notification to old collector (if exists)

#### Modified `getDeliveries` function:
- **Added**: Filter for collectors - they only see their assigned deliveries
- **Filter logic**:
  - Resident: sees own deliveries
  - Collector: sees only assigned deliveries
  - Operator/Admin: sees all deliveries

---

### 3. **delivery.routes.js**
#### Added new route:
```javascript
router.patch('/:id/reassign', authorize('operator', 'admin'), reassignCollector);
```

---

### 4. **Delivery.model.js**
#### Existing field utilized:
- `deliveryTeam`: ObjectId reference to User (collector)

---

## Frontend Changes

### 1. **binRequest.service.ts**
#### Updated `approveRequest` function:
- **Added**: `collectorId` parameter support

```typescript
approveRequest(requestId: string, data: { 
  binId?: string; 
  deliveryDate?: string; 
  collectorId?: string  // NEW
})
```

---

### 2. **delivery.service.ts**
#### Added `reassignCollector` function:
```typescript
async reassignCollector(deliveryId: string, data: { collectorId: string }) {
  const response = await api.patch(`/deliveries/${deliveryId}/reassign`, data);
  return response.data;
}
```

---

### 3. **BinRequestsPage.tsx**
#### Added Features:
1. **Collector Selection in Approve Modal**
   - Fetches list of collectors from API
   - Dropdown to select collector (optional)
   - Sends collectorId when approving request

#### UI Changes:
```tsx
// New dropdown in approval modal
<select name="collectorId">
  <option value="">-- No collector assigned --</option>
  {collectors.map(collector => (
    <option value={collector._id}>
      {collector.firstName} {collector.lastName} ({collector.email})
    </option>
  ))}
</select>
```

---

### 4. **DeliveriesPage.tsx**
#### Added Features:
1. **Display Assigned Collector**
   - Shows collector name and email in delivery card
   - Shows "Not assigned" if no collector

2. **Reassign Collector Button**
   - Visible to operators and admins only
   - Opens reassignment modal

3. **Collector Authorization**
   - Collectors only see "Update Status" button for their assigned deliveries
   - Operators/admins see both "Update Status" and "Reassign Collector"

#### UI Changes:
```tsx
// Display collector info
<div className="flex items-start gap-2">
  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
  <div>
    <p className="text-sm font-medium text-gray-700">Assigned Collector</p>
    <p className="text-sm text-gray-600">
      {delivery.deliveryTeam 
        ? `${delivery.deliveryTeam.firstName} ${delivery.deliveryTeam.lastName}`
        : 'Not assigned'}
    </p>
  </div>
</div>

// Reassign button (operator/admin only)
<button onClick={() => setShowReassignModal(true)}>
  Reassign Collector
</button>
```

---

## Test Coverage

### Added Tests in **binRequest.test.js**:
1. ✅ Should assign collector when approving bin request
2. ✅ Should return 404 if collector not found
3. ✅ Should return 400 if assigned user is not a collector
4. ✅ Should create notification for assigned collector

### Added Tests in **delivery.test.js**:
1. ✅ Should allow assigned collector to update delivery status
2. ✅ Should reject non-assigned collector from updating delivery
3. ✅ Should allow admin/operator to update any delivery
4. ✅ Should allow delivery update when no collector assigned
5. ✅ Should get only assigned deliveries for collector
6. ✅ Should reassign collector successfully
7. ✅ Should allow admin to reassign collector
8. ✅ Should reject collector from reassigning
9. ✅ Should reject resident from reassigning
10. ✅ Should return 404 for non-existent delivery
11. ✅ Should return 404 for non-existent collector
12. ✅ Should return 400 when assigning non-collector user
13. ✅ Should handle reassignment when no previous collector

---

## User Roles & Permissions

### Resident:
- ✅ Create bin requests
- ✅ View own bin requests
- ✅ View own deliveries
- ✅ Confirm receipt of deliveries

### Collector:
- ✅ View assigned deliveries only
- ✅ Update status of assigned deliveries only
- ❌ Cannot update other collectors' deliveries
- ❌ Cannot reassign deliveries

### Operator/Admin:
- ✅ View all bin requests
- ✅ Approve bin requests
- ✅ Assign collectors to deliveries
- ✅ View all deliveries
- ✅ Update any delivery status
- ✅ Reassign collectors to deliveries

---

## Workflow Diagram

```
┌─────────────┐
│  Resident   │
│  Creates    │
│  Request    │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│  Operator Reviews Request   │
│  Status: pending            │
└──────┬──────────────────────┘
       │
       v
┌──────────────────────────────────┐
│  Operator Approves & Assigns     │
│  - Sets delivery date            │
│  - Optional: Assigns collector   │
│  Status: approved                │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│  Delivery Created                │
│  - deliveryTeam: collector._id   │
│  - Status: scheduled             │
└──────┬───────────────────────────┘
       │
       ├────────> [Operator can reassign collector]
       │
       v
┌──────────────────────────────────┐
│  Assigned Collector Updates      │
│  Status: in-transit              │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│  Collector Marks as Delivered    │
│  - SmartBin created              │
│  - BinRequest status: delivered  │
│  - Notification sent             │
└──────────────────────────────────┘
```

---

## API Endpoints

### Bin Requests:
```
POST   /api/bin-requests/:requestId/approve
Body: {
  deliveryDate: "2025-12-01",
  collectorId: "collector_id" // optional
}
```

### Deliveries:
```
GET    /api/deliveries
       - Returns all deliveries (operator/admin)
       - Returns assigned deliveries (collector)
       - Returns own deliveries (resident)

PATCH  /api/deliveries/:id/status
Body: { status: "in-transit", note: "On the way" }
Auth: Assigned collector, operator, or admin

PATCH  /api/deliveries/:id/reassign
Body: { collectorId: "new_collector_id" }
Auth: Operator or admin only
```

---

## Benefits of Changes

1. **Better Accountability**: Each delivery is assigned to a specific collector
2. **Improved Security**: Collectors can only update their own deliveries
3. **Flexibility**: Operators can reassign deliveries if needed
4. **Better Tracking**: Clear visibility of who is responsible for each delivery
5. **Role Separation**: Clear distinction between operator and collector responsibilities
6. **Notifications**: All parties are notified of assignments and changes

---

## Future Enhancements (Optional)

1. **Collector Workload View**: Dashboard showing number of assigned deliveries per collector
2. **Route Optimization**: Auto-assign collectors based on location/route
3. **Performance Metrics**: Track collector delivery completion rates
4. **Real-time Updates**: WebSocket for live delivery status updates
5. **Delivery History**: View past deliveries completed by each collector
