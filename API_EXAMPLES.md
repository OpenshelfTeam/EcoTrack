# 📡 API Examples & Usage Guide

Complete guide for testing and using the EcoTrack API.

## Base URL
```
http://localhost:5000/api
```

## 🔐 Authentication

### 1. Register New User

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "resident",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "resident",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "resident",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "resident",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701"
    },
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Password

**Endpoint:** `PUT /auth/updatepassword`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 👥 Users

### 1. Get All Users (Admin/Authority/Operator)

**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` - Filter by role (resident, collector, authority, operator, admin)
- `isActive` - Filter by active status (true/false)
- `search` - Search by name or email

**Examples:**
```
GET /users?role=resident
GET /users?isActive=true
GET /users?search=john
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64abc123...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "resident",
      "isActive": true
    }
  ]
}
```

### 2. Get Single User

**Endpoint:** `GET /users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### 3. Update User

**Endpoint:** `PUT /users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstName": "John Updated",
  "phone": "+1234567891"
}
```

### 4. Delete User (Admin Only)

**Endpoint:** `DELETE /users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

## 🗑️ Smart Bins

### 1. Get All Bins

**Endpoint:** `GET /smart-bins`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - available, assigned, in-transit, active, maintenance, damaged
- `binType` - general, recyclable, organic, hazardous
- `assignedTo` - User ID

**Examples:**
```
GET /smart-bins?status=active
GET /smart-bins?binType=recyclable
GET /smart-bins?assignedTo=64abc123...
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64def456...",
      "binId": "BIN001",
      "qrCode": "QR001",
      "rfidTag": "RFID001",
      "assignedTo": {
        "_id": "64abc123...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "location": {
        "type": "Point",
        "coordinates": [-89.6501, 39.7817],
        "address": "123 Main St, Springfield, IL"
      },
      "capacity": 100,
      "currentLevel": 45,
      "binType": "general",
      "status": "active",
      "lastEmptied": "2024-01-14T08:00:00.000Z"
    }
  ]
}
```

### 2. Create Bin (Operator/Admin)

**Endpoint:** `POST /smart-bins`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "binId": "BIN005",
  "qrCode": "QR005",
  "rfidTag": "RFID005",
  "location": {
    "coordinates": [-89.6505, 39.7820],
    "address": "789 Oak Ave, Springfield, IL"
  },
  "capacity": 100,
  "binType": "recyclable",
  "status": "available"
}
```

### 3. Assign Bin to Resident

**Endpoint:** `POST /smart-bins/:binId/assign`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "userId": "64abc123..."
}
```

### 4. Update Bin

**Endpoint:** `PUT /smart-bins/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentLevel": 75,
  "status": "active"
}
```

## 🚛 Collections

### 1. Get Collection Records

**Endpoint:** `GET /collections`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - collected, partially-collected, missed, exception
- `collector` - User ID
- `route` - Route ID

### 2. Create Collection Record (Collector)

**Endpoint:** `POST /collections`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "route": "64route123...",
  "bin": "64bin456...",
  "wasteWeight": 15.5,
  "wasteType": "general",
  "binLevelBefore": 75,
  "binLevelAfter": 10,
  "status": "collected",
  "location": {
    "coordinates": [-89.6501, 39.7817]
  },
  "notes": "Collection completed successfully"
}
```

### 3. Get Routes

**Endpoint:** `GET /collections/routes`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - pending, in-progress, completed, cancelled
- `assignedCollector` - User ID

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "64route123...",
      "routeName": "Downtown Route",
      "routeCode": "RT001",
      "assignedCollector": {
        "_id": "64collector...",
        "firstName": "Mike",
        "lastName": "Collector"
      },
      "area": "Downtown Springfield",
      "bins": [
        {
          "_id": "64bin1...",
          "binId": "BIN001",
          "location": {...},
          "currentLevel": 75
        }
      ],
      "scheduledDate": "2024-01-16T00:00:00.000Z",
      "scheduledTime": {
        "start": "09:00",
        "end": "12:00"
      },
      "status": "pending",
      "totalBins": 2,
      "collectedBins": 0
    }
  ]
}
```

### 4. Create Route (Authority/Operator)

**Endpoint:** `POST /collections/routes`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "routeName": "East Side Route",
  "routeCode": "RT002",
  "assignedCollector": "64collector...",
  "area": "East Springfield",
  "bins": ["64bin1...", "64bin2..."],
  "scheduledDate": "2024-01-17",
  "scheduledTime": {
    "start": "08:00",
    "end": "11:00"
  },
  "priority": "medium"
}
```

## 🎫 Tickets

### 1. Get All Tickets

**Endpoint:** `GET /tickets`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - open, in-progress, resolved, closed, cancelled
- `category` - damaged-bin, missed-pickup, payment-issue, etc.
- `priority` - low, medium, high, urgent
- `reporter` - User ID

### 2. Create Ticket

**Endpoint:** `POST /tickets`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Bin damaged during collection",
  "description": "The bin lid is broken and needs replacement",
  "category": "damaged-bin",
  "priority": "high",
  "relatedBin": "64bin123...",
  "location": {
    "address": "123 Main St, Springfield, IL",
    "coordinates": {
      "latitude": 39.7817,
      "longitude": -89.6501
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64ticket...",
    "ticketNumber": "TKT000001",
    "title": "Bin damaged during collection",
    "description": "The bin lid is broken and needs replacement",
    "category": "damaged-bin",
    "priority": "high",
    "status": "open",
    "reporter": "64user...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Update Ticket (Authority/Operator)

**Endpoint:** `PUT /tickets/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "in-progress",
  "assignedTo": "64operator...",
  "comments": [
    {
      "user": "64operator...",
      "message": "Inspecting the damaged bin today"
    }
  ]
}
```

## 💳 Payments

### 1. Get Payments

**Endpoint:** `GET /payments`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - pending, processing, completed, failed, refunded
- `paymentType` - service-charge, penalty, installation-fee, maintenance-fee
- `user` - User ID

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64payment...",
      "transactionId": "PAY1705315200001",
      "user": {
        "_id": "64user...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "amount": 25.00,
      "currency": "USD",
      "paymentType": "service-charge",
      "paymentMethod": "credit-card",
      "status": "completed",
      "invoice": {
        "invoiceNumber": "INV1705315200001",
        "invoiceDate": "2024-01-15T10:00:00.000Z",
        "paidDate": "2024-01-15T10:05:00.000Z"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 2. Create Payment

**Endpoint:** `POST /payments`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 25.00,
  "paymentType": "service-charge",
  "paymentMethod": "credit-card",
  "billingPeriod": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "paymentDetails": {
    "cardLastFour": "4242",
    "cardType": "Visa"
  },
  "description": "Monthly waste collection service"
}
```

## 🔔 Notifications

### 1. Get User Notifications

**Endpoint:** `GET /notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64notif...",
      "type": "pickup-reminder",
      "title": "Pickup Scheduled Tomorrow",
      "message": "Your waste pickup is scheduled for tomorrow between 9:00 AM and 12:00 PM",
      "priority": "medium",
      "status": "sent",
      "readAt": null,
      "metadata": {
        "actionUrl": "/pickups",
        "actionLabel": "View Schedule"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 2. Mark Notification as Read

**Endpoint:** `PUT /notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

## 💬 Feedback

### 1. Get All Feedback

**Endpoint:** `GET /feedback`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "64feedback...",
      "user": {
        "_id": "64user...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "category": "collection-service",
      "subject": "Great service!",
      "message": "The waste collection was done on time and professionally",
      "rating": 5,
      "status": "submitted",
      "sentiment": "positive",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 2. Submit Feedback

**Endpoint:** `POST /feedback`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "category": "collection-service",
  "subject": "Great service!",
  "message": "The waste collection was done on time and professionally",
  "rating": 5,
  "relatedEntity": {
    "entityType": "collection",
    "entityId": "64collection..."
  }
}
```

## 📊 Analytics

### Get Dashboard Statistics (Authority/Admin)

**Endpoint:** `GET /analytics/dashboard`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBins": 450,
    "activeBins": 405,
    "totalCollections": 128,
    "openTickets": 15,
    "totalPayments": 320
  }
}
```

## 🧪 Testing with cURL

### Complete Test Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","phone":"+1234567890","role":"resident"}'

# 2. Login (save the token)
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 3. Get profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Get bins
curl -X GET http://localhost:5000/api/smart-bins \
  -H "Authorization: Bearer $TOKEN"

# 5. Create ticket
curl -X POST http://localhost:5000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Issue","description":"Testing ticket creation","category":"other","priority":"low"}'
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'resident' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

**Pro Tip:** Use tools like Postman, Insomnia, or VS Code REST Client extension for easier API testing!
