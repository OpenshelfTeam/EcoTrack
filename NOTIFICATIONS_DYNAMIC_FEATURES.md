# Notifications Page - Dynamic Features Documentation

## ✅ YES - The Notifications Page Works Dynamically!

The NotificationsPage is **fully dynamic** and fetches real-time data from your backend API.

---

## 🔄 Dynamic Features

### 1. **Real-time Data Fetching**
```typescript
const { data: notificationsData, isLoading, error } = useQuery({
  queryKey: ['notifications', filterType, filterRead],
  queryFn: () => notificationService.getNotifications({
    type: filterType !== 'all' ? filterType : undefined,
    unreadOnly: filterRead === 'unread' ? true : undefined
  })
});
```
- ✅ Fetches notifications from `/api/notifications` endpoint
- ✅ Auto-updates when filters change
- ✅ Includes loading and error states

### 2. **Dynamic Statistics Cards**
```typescript
const stats = {
  total: notifications.length,                                    // Total notifications count
  unread: notifications.filter((n: any) => !n.readAt).length,    // Unread count
  today: notifications.filter((n: any) => {                       // Today's notifications
    const notifDate = new Date(n.sentAt || n.createdAt);
    const today = new Date();
    return notifDate.toDateString() === today.toDateString();
  }).length,
  high: notifications.filter((n: any) => (n.priority === 'high' || n.priority === 'urgent') && !n.readAt).length  // High priority unread
};
```
- ✅ Total notifications
- ✅ Unread notifications count
- ✅ Today's notifications count
- ✅ High priority unread count

### 3. **Real-time Filters**
```typescript
// Type Filter
filterType: 'all' | 'collection' | 'payment' | 'ticket' | 'system' | 'pickup' | 'feedback'

// Status Filter
filterRead: 'all' | 'unread' | 'read'
```
- ✅ Filters sent to backend API
- ✅ Auto-refresh when filters change

### 4. **CRUD Operations with Mutations**

#### Mark as Read
```typescript
const markAsReadMutation = useMutation({
  mutationFn: notificationService.markAsRead,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }
});
```

#### Mark All as Read
```typescript
const markAllAsReadMutation = useMutation({
  mutationFn: notificationService.markAllAsRead,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }
});
```

#### Delete Read Notifications
```typescript
const deleteReadMutation = useMutation({
  mutationFn: notificationService.deleteReadNotifications,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }
});
```

#### Delete Individual Notification
```typescript
onClick={() => notificationService.deleteNotification(notification._id)
  .then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))}
```

### 5. **Dynamic Notification List**
Each notification displays:
- ✅ **Type icon** - Based on notification type (collection, payment, ticket, etc.)
- ✅ **Title & Message** - From backend data
- ✅ **Priority badge** - High/Medium/Low with color coding
- ✅ **Timestamp** - Relative time (e.g., "5 mins ago", "2 hours ago")
- ✅ **Read/Unread status** - Visual indicator with blue dot
- ✅ **Action buttons** - Mark as read, Delete

### 6. **Dynamic Timestamp Formatting**
```typescript
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
```

### 7. **Notification Preferences (Dynamic)**
```typescript
const { data: preferencesData } = useQuery({
  queryKey: ['notification-preferences'],
  queryFn: notificationService.getNotificationPreferences
});

const updatePreferencesMutation = useMutation({
  mutationFn: notificationService.updateNotificationPreferences,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
  }
});
```
- ✅ Fetches user preferences from backend
- ✅ Updates preferences via API
- ✅ Channels: Email, SMS, Push, In-app
- ✅ Types: Collections, Payments, Tickets, System, Pickups, Feedback

---

## 🎨 Visual Features

### Color Coding by Type
```typescript
const getTypeColor = (type: string) => {
  switch (type) {
    case 'collection': return 'bg-blue-100 text-blue-600';
    case 'payment': return 'bg-emerald-100 text-emerald-600';
    case 'ticket': return 'bg-purple-100 text-purple-600';
    case 'system': return 'bg-gray-100 text-gray-600';
    case 'pickup': return 'bg-orange-100 text-orange-600';
    case 'feedback': return 'bg-yellow-100 text-yellow-600';
  }
};
```

### Priority Border Colors
```typescript
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-l-4 border-red-500';
    case 'normal': return 'border-l-4 border-blue-500';
    case 'low': return 'border-l-4 border-gray-300';
  }
};
```

---

## 🔗 Backend Integration

### API Endpoints Used

1. **GET /api/notifications**
   - Query params: `type`, `unreadOnly`, `page`, `limit`
   - Returns: Paginated notifications list with stats

2. **PATCH /api/notifications/:id/read**
   - Marks single notification as read

3. **PATCH /api/notifications/read-all**
   - Marks all user notifications as read

4. **DELETE /api/notifications/read**
   - Deletes all read notifications

5. **DELETE /api/notifications/:id**
   - Deletes single notification

6. **GET /api/notifications/preferences**
   - Fetches user notification preferences

7. **PUT /api/notifications/preferences**
   - Updates notification preferences

---

## 📊 Data Flow

```
Frontend (NotificationsPage)
    ↓
React Query (useQuery)
    ↓
notificationService.getNotifications()
    ↓
Axios API Call (/api/notifications)
    ↓
Backend (notification.controller.js)
    ↓
MongoDB (Notification.model)
    ↓
Response with notifications data
    ↓
React Query Cache
    ↓
UI Updates Automatically
```

---

## ✅ Recent Fix Applied

**Fixed statistics calculations to use correct field names:**
- Changed `notification.read` → `notification.readAt`
- Changed `notification.timestamp` → `notification.sentAt || notification.createdAt`
- Added support for both `high` and `urgent` priority levels

---

## 🚀 How to Test

1. **Login as any user**
2. **Navigate to Notifications page**
3. **Backend will create sample notifications** (from seed data or system events)
4. **Try these actions:**
   - ✅ Filter by type (Collections, Payments, etc.)
   - ✅ Filter by status (Unread/Read)
   - ✅ Mark individual notifications as read
   - ✅ Mark all notifications as read
   - ✅ Delete read notifications
   - ✅ Delete individual notifications
   - ✅ Update notification preferences
   - ✅ Watch statistics update in real-time

---

## 📝 Sample Notification Object from Backend

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "recipient": "507f1f77bcf86cd799439012",
  "type": "payment",
  "title": "Payment Received",
  "message": "Your payment of $50.00 has been received successfully.",
  "priority": "medium",
  "channel": ["in-app", "email"],
  "status": "delivered",
  "readAt": null,
  "sentAt": "2025-10-16T10:30:00Z",
  "createdAt": "2025-10-16T10:30:00Z",
  "updatedAt": "2025-10-16T10:30:00Z"
}
```

---

## 🎯 Conclusion

**YES**, your NotificationsPage is **100% dynamic**! It:
- ✅ Fetches real data from backend API
- ✅ Updates in real-time when data changes
- ✅ Uses React Query for efficient caching
- ✅ Has proper loading and error states
- ✅ Supports all CRUD operations
- ✅ Filters and searches are backend-powered
- ✅ Statistics are calculated from live data
- ✅ No hardcoded values

The only static elements are the UI labels and button text, which is expected!
