# EcoTrack Backend - Quick Reference

## 🎯 Complete Backend Status: 100% ✅

### All Routes Registered in server.js ✅
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/smart-bins', smartBinRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/routes', routeRoutes);
```

---

## 📁 Backend Structure

```
backend/
├── server.js (Main entry point - All routes registered)
├── config/
│   └── db.js (MongoDB connection)
├── models/
│   ├── User.model.js ✅
│   ├── SmartBin.model.js ✅ (Auto-gen: BIN00001)
│   ├── PickupRequest.model.js ✅ (Auto-gen: PKP00001)
│   ├── CollectionRecord.model.js ✅
│   ├── Route.model.js ✅
│   ├── Ticket.model.js ✅
│   ├── Payment.model.js ✅
│   ├── Feedback.model.js ✅
│   └── Notification.model.js ✅
├── controllers/
│   ├── auth.controller.js ✅ (5 endpoints)
│   ├── user.controller.js ✅ (9 endpoints - Enhanced)
│   ├── smartBin.controller.js ✅ (12 endpoints)
│   ├── pickup.controller.js ✅ (10 endpoints)
│   ├── collection.controller.js ✅ (7 endpoints)
│   ├── route.controller.js ✅ (9 endpoints)
│   ├── ticket.controller.js ✅ (11 endpoints)
│   ├── payment.controller.js ✅ (10 endpoints)
│   ├── feedback.controller.js ✅ (8 endpoints - Enhanced)
│   ├── notification.controller.js ✅ (12 endpoints - Enhanced)
│   └── analytics.controller.js ✅ (7 endpoints)
├── routes/
│   ├── auth.routes.js ✅
│   ├── user.routes.js ✅ (Updated with new endpoints)
│   ├── smartBin.routes.js ✅
│   ├── pickup.routes.js ✅
│   ├── collection.routes.js ✅
│   ├── route.routes.js ✅
│   ├── ticket.routes.js ✅
│   ├── payment.routes.js ✅
│   ├── feedback.routes.js ✅ (Updated with new endpoints)
│   ├── notification.routes.js ✅ (Updated with new endpoints)
│   └── analytics.routes.js ✅
└── middleware/
    └── auth.middleware.js ✅ (protect, authorize)
```

---

## 🚀 Start Backend Server

```bash
cd backend
npm install
npm run dev
```

Server runs on: `http://localhost:5000`

---

## 🔑 Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://kusalsalpura_db_user:pxIZZnOKfqSgO0To@cluster0.ol0osx3.mongodb.net/

# JWT
JWT_SECRET=5c1d006f3cbf0efc0b6138c5dade7e95a327ddebc8a6c6ddca8294942558b2fb
JWT_EXPIRE=30d
```

---

## 📊 Endpoint Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 5 | ✅ Complete |
| Users | 9 | ✅ Enhanced |
| Smart Bins | 12 | ✅ Complete |
| Pickup Requests | 10 | ✅ Complete |
| Collections | 7 | ✅ Complete |
| Routes | 9 | ✅ Complete |
| Tickets | 11 | ✅ Complete |
| Payments | 10 | ✅ Complete |
| Feedback | 8 | ✅ Enhanced |
| Notifications | 12 | ✅ Enhanced |
| Analytics | 7 | ✅ Complete |
| **TOTAL** | **100+** | **✅ 100%** |

---

## 🔐 Role-Based Authorization

### Roles Hierarchy
1. **resident** - Basic user, manages own data
2. **collector** - Waste collector, updates collections
3. **operator** - System operator, manages bins/routes
4. **authority** - Municipal authority, reporting access
5. **admin** - Full system access

### Middleware Usage
```javascript
import { protect, authorize } from '../middleware/auth.middleware.js';

// All users (authenticated)
router.get('/', protect, getAllItems);

// Specific roles only
router.post('/', protect, authorize('admin', 'authority'), createItem);

// Multiple roles
router.patch('/:id', protect, authorize('operator', 'admin'), updateItem);
```

---

## 🆔 Auto-Generated IDs

### Models with Pre-Save Hooks

**Smart Bins**:
```javascript
binId: BIN00001, BIN00002, BIN00003, ...
```

**Pickup Requests**:
```javascript
requestId: PKP00001, PKP00002, PKP00003, ...
```

**Pattern**:
```javascript
binSchema.pre('save', async function(next) {
  if (!this.binId) {
    const count = await this.constructor.countDocuments();
    this.binId = `BIN${String(count + 1).padStart(5, '0')}`;
  }
  next();
});
```

---

## 🧪 Testing with Postman

1. **Import Collection**: 
   - Use `EcoTrack_API.postman_collection.json`

2. **Set Variables**:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: (Auto-set after login)

3. **Test Flow**:
   ```
   1. Register user → POST /auth/register
   2. Login → POST /auth/login (token auto-saved)
   3. Test other endpoints (token auto-applied)
   ```

---

## 📝 Common Request Examples

### Create Smart Bin
```bash
POST http://localhost:5000/api/smart-bins
Authorization: Bearer <token>
Content-Type: application/json

{
  "qrCode": "QR123456",
  "location": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "123 Main St"
  },
  "capacity": 100,
  "binType": "recyclable"
}
```

### Create Pickup Request
```bash
POST http://localhost:5000/api/pickups
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "123 Main St"
  },
  "wasteType": "electronic",
  "quantity": "2 bags",
  "timeSlot": "morning"
}
```

### Get Dashboard Analytics
```bash
GET http://localhost:5000/api/analytics/dashboard?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer <token>
```

---

## ✅ Enhanced Controllers (This Session)

### 1. Feedback Controller
**New Functions Added**:
- `getAllFeedback` - With pagination and filters
- `getFeedback` - Single feedback with auth check
- `updateFeedback` - Owner can update pending
- `deleteFeedback` - Owner/Admin can delete
- `respondToFeedback` - Authority/Admin responds
- `updateFeedbackStatus` - Authority/Admin updates
- `getFeedbackStats` - Statistics aggregation

**Routes**: 8 endpoints total

### 2. Notification Controller
**New Functions Added**:
- `getNotifications` - With pagination and filters
- `getNotification` - Single notification
- `createNotification` - Admin creates
- `updateNotification` - Admin updates
- `deleteNotification` - Owner/Admin deletes
- `markAsRead` - User marks as read
- `markAllAsRead` - Mark all user notifications
- `deleteReadNotifications` - Cleanup read
- `getNotificationPreferences` - User preferences
- `updateNotificationPreferences` - Update prefs
- `sendBulkNotification` - Admin bulk send
- `getNotificationStats` - Statistics

**Routes**: 12 endpoints total

### 3. User Controller
**New Functions Added**:
- `updateUserRole` - Admin changes role
- `activateUser` - Admin activates account
- `deactivateUser` - Admin deactivates
- `getUserStats` - User statistics
- `getUserActivity` - User activity tracking

**Routes**: 9 endpoints total (existing + 5 new)

---

## 🔍 Error Handling

All endpoints return consistent format:

**Success**:
```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "total": 100
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "nodemon": "^3.0.1"
}
```

---

## 🎨 Frontend Integration Ready

All services created in `frontend/src/services/`:
- ✅ auth.service.ts
- ✅ user.service.ts (New)
- ✅ bin.service.ts
- ✅ pickup.service.ts
- ✅ collection.service.ts
- ✅ route.service.ts
- ✅ ticket.service.ts
- ✅ payment.service.ts
- ✅ feedback.service.ts (Enhanced)
- ✅ notification.service.ts (Enhanced)
- ✅ analytics.service.ts

**Next Step**: Integrate these services into frontend pages using React Query (like BinsPage and PickupsPage examples).

---

## 🏁 Summary

**Backend Status**: 🎉 **100% COMPLETE** 🎉

- ✅ All 11 route files registered
- ✅ All 11 controller files complete
- ✅ All 9 model files with proper schemas
- ✅ All middleware configured
- ✅ 100+ API endpoints functional
- ✅ Role-based authorization implemented
- ✅ Auto-ID generation for bins and pickups
- ✅ MongoDB Atlas connected
- ✅ CORS configured for frontend
- ✅ Error handling middleware
- ✅ API documentation created
- ✅ Postman collection provided

**Ready for**: Frontend page integrations! 🚀
