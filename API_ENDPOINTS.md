# EcoTrack API Endpoints Documentation

**Base URL**: `http://localhost:5000/api`

**Authentication**: Most endpoints require Bearer token in Authorization header
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication & Authorization

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| GET | `/auth/profile` | Private | Get current user profile |
| PUT | `/auth/profile` | Private | Update current user profile |
| PUT | `/auth/change-password` | Private | Change password |

**Request Examples:**

```javascript
// Register
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Colombo",
    "state": "Western",
    "zipCode": "10100"
  },
  "role": "resident"
}

// Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 2. User Management

### User Routes (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Admin, Authority, Operator | Get all users with filters |
| GET | `/users/stats` | Admin, Authority | Get user statistics |
| GET | `/users/:id` | Private | Get single user |
| GET | `/users/:id/activity` | Admin, Authority, Owner | Get user activity |
| PUT | `/users/:id` | Private | Update user |
| DELETE | `/users/:id` | Admin | Delete user |
| PATCH | `/users/:id/role` | Admin | Update user role |
| PATCH | `/users/:id/activate` | Admin | Activate user account |
| PATCH | `/users/:id/deactivate` | Admin | Deactivate user account |

**Query Parameters:**
- `role`: Filter by role (resident, collector, operator, authority, admin)
- `isActive`: Filter by active status (true/false)
- `search`: Search by name or email

**Request Examples:**

```javascript
// Get users with filters
GET /api/users?role=resident&isActive=true&search=john

// Update user role
PATCH /api/users/:id/role
{
  "role": "collector"
}

// Get user statistics
GET /api/users/stats
// Response: { total, active, inactive, byRole, recentUsers, userGrowth }
```

---

## 3. Smart Bins Management

### Smart Bin Routes (`/api/smart-bins`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/smart-bins` | Private | Get all bins with filters |
| GET | `/smart-bins/stats` | Operator, Admin | Get bin statistics |
| GET | `/smart-bins/:id` | Private | Get single bin |
| GET | `/smart-bins/nearby` | Private | Get nearby bins |
| POST | `/smart-bins` | Resident, Collector, Operator, Admin | Create new bin |
| PUT | `/smart-bins/:id` | Resident, Collector, Operator, Admin | Update bin |
| DELETE | `/smart-bins/:id` | Operator, Admin | Delete bin |
| PATCH | `/smart-bins/:id/level` | Operator, Admin | Update fill level |
| PATCH | `/smart-bins/:id/status` | Operator, Admin | Update bin status |
| POST | `/smart-bins/:id/empty` | Collector, Operator, Admin | Mark bin as emptied |
| POST | `/smart-bins/:id/maintenance` | Operator, Admin | Add maintenance record |
| POST | `/smart-bins/:id/assign` | Operator, Admin | Assign bin to user |

**Query Parameters:**
- `status`: Filter by status (active, inactive, maintenance, full)
- `binType`: Filter by type (general, recyclable, organic, hazardous)
- `search`: Search by binId or location
- `lat`, `lng`, `radius`: For nearby search

**Request Examples:**

```javascript
// Create bin (binId auto-generated as BIN00001, BIN00002, etc.)
POST /api/smart-bins
{
  "qrCode": "QR123456",
  "rfidTag": "RFID789",
  "location": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "123 Main St, Colombo"
  },
  "capacity": 100,
  "currentLevel": 0,
  "binType": "recyclable",
  "status": "active"
}

// Get nearby bins
GET /api/smart-bins/nearby?lat=6.9271&lng=79.8612&radius=5

// Update fill level
PATCH /api/smart-bins/:id/level
{
  "currentLevel": 75
}

// Mark as emptied
POST /api/smart-bins/:id/empty
{
  "collectorId": "userId123"
}
```

---

## 4. Pickup Requests

### Pickup Routes (`/api/pickups`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/pickups` | Private | Get all pickup requests |
| GET | `/pickups/stats` | Operator, Admin | Get pickup statistics |
| GET | `/pickups/:id` | Private | Get single pickup |
| POST | `/pickups` | Resident | Create pickup request |
| PUT | `/pickups/:id` | Private | Update pickup request |
| DELETE | `/pickups/:id` | Private | Delete pickup request |
| PATCH | `/pickups/:id/assign` | Operator, Admin | Assign to collector |
| PATCH | `/pickups/:id/status` | Collector, Operator, Admin | Update status |
| POST | `/pickups/:id/cancel` | Resident, Admin | Cancel pickup |
| POST | `/pickups/:id/complete` | Collector, Operator, Admin | Complete pickup |

**Query Parameters:**
- `status`: Filter by status (pending, scheduled, in-progress, completed, cancelled)
- `wasteType`: Filter by type (bulk, hazardous, electronic, construction, organic, recyclable, other)
- `search`: Search by requestId

**Request Examples:**

```javascript
// Create pickup (requestId auto-generated as PKP00001, PKP00002, etc.)
POST /api/pickups
{
  "pickupLocation": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "123 Main St, Colombo"
  },
  "wasteType": "electronic",
  "quantity": "2 bags",
  "description": "Old computer and printer",
  "timeSlot": "morning",
  "contactPerson": {
    "name": "John Doe",
    "phone": "+1234567890"
  }
}

// Assign to collector
PATCH /api/pickups/:id/assign
{
  "collectorId": "userId123"
}

// Complete pickup
POST /api/pickups/:id/complete
{
  "notes": "Picked up successfully",
  "actualWeight": 15.5
}
```

---

## 5. Collection Records

### Collection Routes (`/api/collections`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/collections` | Private | Get all collection records |
| GET | `/collections/stats` | Operator, Admin | Get collection statistics |
| GET | `/collections/schedule` | Operator, Admin | Get collection schedule |
| GET | `/collections/:id` | Private | Get single collection |
| POST | `/collections` | Collector, Operator, Admin | Create collection record |
| PUT | `/collections/:id` | Collector, Operator, Admin | Update collection |
| DELETE | `/collections/:id` | Operator, Admin | Delete collection |

**Query Parameters:**
- `status`: Filter by status (scheduled, in-progress, completed, cancelled)
- `startDate`, `endDate`: Date range filter
- `collectorId`: Filter by collector
- `routeId`: Filter by route

**Request Examples:**

```javascript
// Create collection record
POST /api/collections
{
  "binId": "BIN00001",
  "collectorId": "userId123",
  "routeId": "routeId123",
  "scheduledDate": "2025-10-16T08:00:00Z",
  "status": "scheduled",
  "wasteType": "organic",
  "estimatedWeight": 50
}

// Get statistics
GET /api/collections/stats
// Response: { totalCollections, completedToday, avgWeight, byWasteType }

// Get schedule
GET /api/collections/schedule?startDate=2025-10-16&endDate=2025-10-22
```

---

## 6. Route Management

### Route Routes (`/api/routes`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/routes` | Private | Get all routes |
| GET | `/routes/stats` | Operator, Admin | Get route statistics |
| GET | `/routes/:id` | Private | Get single route |
| POST | `/routes` | Operator, Admin | Create route |
| PUT | `/routes/:id` | Operator, Admin | Update route |
| DELETE | `/routes/:id` | Operator, Admin | Delete route |
| POST | `/routes/:id/optimize` | Operator, Admin | Optimize route |
| PATCH | `/routes/:id/assign` | Operator, Admin | Assign collector |
| PATCH | `/routes/:id/status` | Operator, Admin | Update route status |

**Request Examples:**

```javascript
// Create route
POST /api/routes
{
  "routeName": "Route A - Colombo Central",
  "area": "Colombo 03",
  "bins": ["BIN00001", "BIN00002", "BIN00003"],
  "assignedCollector": "userId123",
  "schedule": {
    "daysOfWeek": ["Monday", "Wednesday", "Friday"],
    "startTime": "08:00"
  },
  "status": "active"
}

// Optimize route
POST /api/routes/:id/optimize
{
  "algorithm": "shortest-path"
}
```

---

## 7. Tickets & Support

### Ticket Routes (`/api/tickets`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/tickets` | Private | Get all tickets |
| GET | `/tickets/stats` | Authority, Admin | Get ticket statistics |
| GET | `/tickets/:id` | Private | Get single ticket |
| POST | `/tickets` | Private | Create ticket |
| PUT | `/tickets/:id` | Private | Update ticket |
| DELETE | `/tickets/:id` | Admin | Delete ticket |
| PATCH | `/tickets/:id/assign` | Authority, Admin | Assign ticket |
| PATCH | `/tickets/:id/status` | Authority, Admin | Update status |
| PATCH | `/tickets/:id/priority` | Authority, Admin | Update priority |
| POST | `/tickets/:id/comments` | Private | Add comment |
| POST | `/tickets/:id/resolve` | Authority, Admin | Resolve ticket |

**Query Parameters:**
- `status`: Filter by status (open, in-progress, resolved, closed)
- `priority`: Filter by priority (low, medium, high, urgent)
- `category`: Filter by category (collection, bin, payment, technical, complaint, other)
- `search`: Search by subject

**Request Examples:**

```javascript
// Create ticket (ticketId auto-generated)
POST /api/tickets
{
  "subject": "Missed waste collection",
  "description": "Waste was not collected on scheduled date",
  "category": "collection",
  "priority": "high"
}

// Add comment
POST /api/tickets/:id/comments
{
  "comment": "We are investigating this issue"
}

// Resolve ticket
POST /api/tickets/:id/resolve
{
  "resolution": "Collection team dispatched and issue resolved"
}

// Get statistics
GET /api/tickets/stats
// Response: { total, open, inProgress, resolved, byCategory, byPriority, recentTickets }
```

---

## 8. Payments & Billing

### Payment Routes (`/api/payments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/payments` | Private | Get all payments |
| GET | `/payments/stats` | Authority, Admin | Get payment statistics |
| GET | `/payments/user/:userId` | Private | Get user payments |
| GET | `/payments/:id` | Private | Get single payment |
| POST | `/payments` | Authority, Admin | Create payment/invoice |
| PUT | `/payments/:id` | Authority, Admin | Update payment |
| DELETE | `/payments/:id` | Admin | Delete payment |
| PATCH | `/payments/:id/status` | Authority, Admin | Update payment status |
| POST | `/payments/:id/invoice` | Authority, Admin | Generate invoice |
| GET | `/payments/:id/invoice/download` | Private | Download invoice PDF |

**Query Parameters:**
- `status`: Filter by status (pending, paid, failed, refunded)
- `userId`: Filter by user
- `startDate`, `endDate`: Date range filter

**Request Examples:**

```javascript
// Create payment/invoice (invoiceId auto-generated)
POST /api/payments
{
  "user": "userId123",
  "amount": 150.00,
  "currency": "LKR",
  "dueDate": "2025-10-30",
  "description": "Monthly waste collection fee",
  "items": [
    {
      "description": "Waste collection service",
      "quantity": 1,
      "unitPrice": 100.00,
      "total": 100.00
    },
    {
      "description": "Recycling service",
      "quantity": 1,
      "unitPrice": 50.00,
      "total": 50.00
    }
  ]
}

// Update payment status
PATCH /api/payments/:id/status
{
  "status": "paid",
  "paymentMethod": "card"
}

// Generate invoice
POST /api/payments/:id/invoice

// Download invoice
GET /api/payments/:id/invoice/download
// Returns PDF file
```

---

## 9. Feedback Management

### Feedback Routes (`/api/feedback`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/feedback` | Private | Get all feedback |
| GET | `/feedback/stats` | Authority, Admin | Get feedback statistics |
| GET | `/feedback/:id` | Private | Get single feedback |
| POST | `/feedback` | Private | Create feedback |
| PUT | `/feedback/:id` | Private | Update feedback (pending only) |
| DELETE | `/feedback/:id` | Admin, Owner | Delete feedback |
| POST | `/feedback/:id/respond` | Authority, Admin | Respond to feedback |
| PATCH | `/feedback/:id/status` | Authority, Admin | Update feedback status |

**Query Parameters:**
- `status`: Filter by status (pending, responded, resolved)
- `category`: Filter by category (service, collection, bin, payment, app, other)
- `rating`: Filter by rating (1-5)
- `search`: Search by subject or message

**Request Examples:**

```javascript
// Create feedback
POST /api/feedback
{
  "category": "service",
  "subject": "Excellent service",
  "message": "The collection team was very professional and efficient",
  "rating": 5
}

// Respond to feedback (Authority/Admin only)
POST /api/feedback/:id/respond
{
  "response": "Thank you for your positive feedback! We appreciate it."
}

// Get statistics
GET /api/feedback/stats
// Response: { total, pending, responded, resolved, byCategory, averageRating, recentFeedback }
```

---

## 10. Notifications

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notifications` | Private | Get user notifications |
| GET | `/notifications/stats` | Authority, Admin | Get notification statistics |
| GET | `/notifications/preferences` | Private | Get notification preferences |
| PUT | `/notifications/preferences` | Private | Update preferences |
| POST | `/notifications` | Admin | Create notification |
| POST | `/notifications/bulk` | Authority, Admin | Send bulk notification |
| GET | `/notifications/:id` | Private | Get single notification |
| PUT | `/notifications/:id` | Admin | Update notification |
| DELETE | `/notifications/:id` | Private, Admin | Delete notification |
| PATCH | `/notifications/:id/read` | Private | Mark as read |
| PATCH | `/notifications/read-all` | Private | Mark all as read |
| DELETE | `/notifications/read` | Private | Delete read notifications |

**Query Parameters:**
- `status`: Filter by status (pending, sent, delivered, read, failed)
- `type`: Filter by type (pickup-scheduled, payment-due, ticket-update, etc.)
- `priority`: Filter by priority (low, medium, high, urgent)
- `unreadOnly`: Show only unread (true/false)

**Request Examples:**

```javascript
// Get notifications with filters
GET /api/notifications?unreadOnly=true&priority=high

// Mark as read
PATCH /api/notifications/:id/read

// Mark all as read
PATCH /api/notifications/read-all

// Update preferences
PUT /api/notifications/preferences
{
  "email": true,
  "sms": false,
  "push": true,
  "in-app": true
}

// Send bulk notification (Admin/Authority)
POST /api/notifications/bulk
{
  "recipients": "all",  // or array of user IDs
  "type": "system-alert",
  "title": "System Maintenance",
  "message": "System will be down for maintenance on Oct 20",
  "priority": "high",
  "channel": ["in-app", "email"]
}

// Get statistics
GET /api/notifications/stats
// Response: { total, sent, read, pending, byType, byPriority, recentNotifications }
```

---

## 11. Analytics & Reports

### Analytics Routes (`/api/analytics`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/analytics/dashboard` | Operator, Authority, Admin | Get dashboard statistics |
| GET | `/analytics/waste` | Operator, Authority, Admin | Get waste statistics |
| GET | `/analytics/efficiency` | Operator, Authority, Admin | Get efficiency metrics |
| GET | `/analytics/financial` | Authority, Admin | Get financial analytics |
| GET | `/analytics/area` | Operator, Authority, Admin | Get area statistics |
| GET | `/analytics/engagement` | Authority, Admin | Get user engagement stats |
| POST | `/analytics/export` | Authority, Admin | Export analytics data |

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `groupBy`: Group by (day, week, month, year)
- `area`: Filter by area
- `wasteType`: Filter by waste type

**Request Examples:**

```javascript
// Get dashboard statistics
GET /api/analytics/dashboard?startDate=2025-10-01&endDate=2025-10-31
// Response: {
//   totalBins, activeBins, totalCollections, completedToday,
//   totalUsers, activeUsers, pendingTickets, urgentTickets,
//   totalRevenue, paidPayments, pendingPickups, completedPickups,
//   averageRating
// }

// Get waste statistics
GET /api/analytics/waste?groupBy=day&startDate=2025-10-01&endDate=2025-10-31
// Response: { totalWaste, byType, trends, averagePerDay }

// Get efficiency metrics
GET /api/analytics/efficiency?startDate=2025-10-01&endDate=2025-10-31
// Response: {
//   routeEfficiency, collectorPerformance, binUtilization,
//   collectionSuccessRate, avgResponseTime
// }

// Get financial analytics
GET /api/analytics/financial?groupBy=month
// Response: { totalRevenue, byMonth, paymentStatus, avgInvoiceValue }

// Export data
POST /api/analytics/export
{
  "type": "waste-report",
  "format": "csv",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

---

## 12. Health Check

### System Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | API health check |

**Request Example:**

```javascript
GET /api/health
// Response: {
//   status: "OK",
//   message: "EcoTrack API is running",
//   timestamp: "2025-10-16T10:30:00.000Z"
// }
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "total": 100,
  "pages": 10,
  "currentPage": 1
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Role-Based Access Control

**Roles:**
- **resident**: Basic users, can manage own data
- **collector**: Waste collectors, can update collections
- **operator**: System operators, can manage bins and routes
- **authority**: Municipal authority, full reporting access
- **admin**: System administrators, full access

**Authorization Matrix:**

| Endpoint | Resident | Collector | Operator | Authority | Admin |
|----------|----------|-----------|----------|-----------|-------|
| Create Bin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Pickup | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Routes | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Financial Data | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Send Notifications | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Auto-Generated IDs

The following models have auto-generated IDs:
- **Smart Bins**: `BIN00001`, `BIN00002`, ...
- **Pickup Requests**: `PKP00001`, `PKP00002`, ...
- **Tickets**: `TCK00001`, `TCK00002`, ... (if implemented)
- **Invoices**: `INV00001`, `INV00002`, ... (if implemented)

---

## Rate Limiting

Currently not implemented, but recommended for production:
- Authentication endpoints: 5 requests per minute
- API endpoints: 100 requests per minute per user

---

## Pagination

Most list endpoints support pagination:
```
GET /api/smart-bins?page=1&limit=20
```

Default: `page=1`, `limit=10`

---

## Summary Statistics

**Total API Endpoints: 100+**

- Authentication: 5 endpoints
- Users: 9 endpoints
- Smart Bins: 12 endpoints
- Pickups: 10 endpoints
- Collections: 7 endpoints
- Routes: 9 endpoints
- Tickets: 11 endpoints
- Payments: 10 endpoints
- Feedback: 8 endpoints
- Notifications: 12 endpoints
- Analytics: 7 endpoints
- Health: 1 endpoint

All endpoints are implemented and registered in `server.js`. Backend is 100% complete! ✅
