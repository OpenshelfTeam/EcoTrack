# Bin Request & Delivery Features

This document describes the new Bin Request and Delivery features added to EcoTrack.

## 🎯 Overview

The system now supports a complete workflow for residents to request smart bins, operators to approve and assign bins, and tracking delivery status.

## 📋 Features Added

### Backend API

#### 1. Bin Request System
- **Model**: `BinRequest.model.js`
- **Routes**: `/api/bin-requests`
- **Endpoints**:
  - `POST /api/bin-requests` - Resident creates a bin request
  - `GET /api/bin-requests` - List all requests (filtered by role)
  - `POST /api/bin-requests/:requestId/approve` - Operator approves and assigns bin

#### 2. Delivery Tracking System
- **Model**: `Delivery.model.js`
- **Routes**: `/api/deliveries`
- **Endpoints**:
  - `POST /api/deliveries` - Create delivery record
  - `GET /api/deliveries` - List deliveries
  - `PATCH /api/deliveries/:id/status` - Update delivery status
  - `POST /api/deliveries/:id/confirm` - Resident confirms receipt

#### 3. Enhanced Bin Assignment
- Updated `assignBin` controller to:
  - Verify resident has completed payment
  - Create delivery record automatically
  - Return both bin and delivery data

### Frontend UI

#### 1. Bin Requests Page
- **Path**: `/bin-requests`
- **Features**:
  - Residents can submit bin requests with preferred delivery date
  - Operators can view all pending requests
  - Operators can approve and assign bins to requests
  - Shows request status (pending, approved, rejected)

#### 2. Deliveries Page
- **Path**: `/deliveries`
- **Features**:
  - Track all deliveries with tracking numbers
  - View delivery status (scheduled, in-transit, delivered, failed)
  - Operators/collectors can update delivery status
  - Residents can confirm receipt
  - Shows delivery attempt history

#### 3. Navigation Updates
- Added "Bin Requests" and "Deliveries" to resident navigation
- Added "Bin Requests" and "Deliveries" to operator navigation

## 🔄 Workflow

### Resident Request Flow
1. Resident goes to "Bin Requests" page
2. Clicks "New Request" button
3. Selects bin type and preferred delivery date
4. Submits request (status: pending)

### Operator Approval Flow
1. Operator views pending requests
2. Clicks "Approve & Assign" on a request
3. Sets delivery date
4. System:
   - Verifies resident's payment
   - Finds available bin of requested type
   - Assigns bin to resident (status: assigned)
   - Creates delivery record with tracking number
   - Updates request status to approved

### Delivery Tracking Flow
1. Delivery record created with status "scheduled"
2. Operator/collector updates status to "in-transit"
3. Resident can view delivery tracking number
4. When delivered, resident clicks "Confirm Receipt"
5. System:
   - Updates delivery status to "delivered"
   - Updates bin status to "active"
   - Sets bin activation date

## 🔐 Permissions

### Bin Requests
- **Create**: Resident
- **View**: Resident (own), Operator, Admin (all)
- **Approve**: Operator, Admin

### Deliveries
- **Create**: Operator, Admin
- **View**: All authenticated users
- **Update Status**: Operator, Collector, Admin
- **Confirm Receipt**: Resident, Operator, Admin

## 📊 Data Models

### BinRequest
```javascript
{
  requestId: "BR1729140482001",
  resident: ObjectId,
  requestedBinType: "general|recyclable|organic|hazardous",
  preferredDeliveryDate: Date,
  status: "pending|approved|rejected|cancelled",
  assignedBin: ObjectId,
  paymentVerified: Boolean,
  notes: String
}
```

### Delivery
```javascript
{
  deliveryId: "DLV1729140482001",
  trackingNumber: "TRK1729140482000001",
  bin: ObjectId,
  resident: ObjectId,
  scheduledDate: Date,
  status: "scheduled|in-transit|delivered|failed|rescheduled",
  deliveryTeam: ObjectId,
  attempts: [{ date, note, performedBy }],
  confirmedAt: Date,
  notes: String
}
```

## 🧪 Testing

### Test Bin Request Creation
```bash
POST http://localhost:5000/api/bin-requests
Authorization: Bearer <resident-token>
Content-Type: application/json

{
  "requestedBinType": "recyclable",
  "preferredDeliveryDate": "2025-10-25",
  "notes": "Please deliver in the morning"
}
```

### Test Approval
```bash
POST http://localhost:5000/api/bin-requests/:requestId/approve
Authorization: Bearer <operator-token>
Content-Type: application/json

{
  "deliveryDate": "2025-10-25"
}
```

### Test Delivery Confirmation
```bash
POST http://localhost:5000/api/deliveries/:deliveryId/confirm
Authorization: Bearer <resident-token>
```

## 🚀 Future Enhancements

- [ ] Email/SMS notifications when request is approved
- [ ] Notification when delivery is scheduled
- [ ] Real-time delivery tracking integration
- [ ] Delivery team assignment and management
- [ ] Automated reminders for unconfirmed deliveries
- [ ] Inventory management and stock alerts
- [ ] Alternative bin suggestion when type unavailable
- [ ] Delivery rescheduling workflow
- [ ] QR code verification for delivery
- [ ] Photo proof of delivery

## 📝 Notes

- Payment verification currently checks for any completed payment of type `installation-fee` or `service-charge`
- Bin assignment automatically selects first available bin of requested type
- Tracking numbers are auto-generated in format `TRK{timestamp}{count}`
- Delivery IDs are auto-generated in format `DLV{timestamp}{count}`
- Request IDs are auto-generated in format `BR{timestamp}{count}`
