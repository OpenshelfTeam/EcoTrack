# Collector Dashboard - Dynamic Data Update

## Overview
Updated the collector dashboard to fetch and display **real-time data** from the database instead of showing static placeholder values.

## Changes Made

### 1. New API Integrations (DashboardPage.tsx)

#### Route Statistics
```typescript
const { data: routeStatsData } = useQuery({
  queryKey: ['route-stats'],
  queryFn: () => routeService.getRouteStats(),
  enabled: user?.role === 'collector',
  refetchInterval: 30000, // Updates every 30 seconds
});
```

**Data Fetched:**
- Total routes assigned
- Pending routes
- In-progress routes
- Completed routes
- Total bins collected

#### Collection Statistics
```typescript
const { data: collectionStatsData } = useQuery({
  queryKey: ['collection-stats'],
  queryFn: () => collectionService.getCollectionStats(),
  enabled: user?.role === 'collector',
  refetchInterval: 30000,
});
```

**Data Fetched:**
- Total collections
- Collections today
- Collections this week
- Total weight collected
- Collection status breakdown

#### Recent Collections Activity
```typescript
const { data: recentCollectionsData } = useQuery({
  queryKey: ['recent-collections'],
  queryFn: () => collectionService.getAllCollections({
    limit: 5,
    sort: '-collectionDate'
  }),
  enabled: user?.role === 'collector',
  refetchInterval: 30000,
});
```

**Data Fetched:**
- Last 5 collection records
- Bin IDs
- Collection status (collected/empty/exception)
- Waste weight
- Route information
- Timestamp

### 2. Updated Dashboard Cards

#### Card 1: Active Routes
- **Before:** Static value `0`
- **After:** `routeStats['in-progress']` (real-time count)
- **Updates:** Every 30 seconds

#### Card 2: Collections Today
- **Before:** Static value from general stats
- **After:** `collectionStats.todayCollections` (collector-specific)
- **Updates:** Every 30 seconds

#### Card 3: Pending Routes
- **Before:** Static "Open Tickets" count
- **After:** `routeStats.pending` (routes not yet started)
- **Updates:** Every 30 seconds

#### Card 4: Completion
- **Before:** Static percentage
- **After:** `routeStats.completedRoutes` (total completed count)
- **Updates:** Every 30 seconds

### 3. Recent Activity Feed

**Dynamic Collection History:**
- Shows last 5 collections made by the collector
- Displays:
  - Bin ID (e.g., "BIN004")
  - Collection status with color coding:
    - 🟢 Green: Collected
    - 🔵 Blue: Empty
    - 🟠 Orange: Exception
  - Route name
  - Waste weight
  - Time ago (e.g., "5 minutes ago", "2 hours ago")
- Auto-refreshes every 30 seconds
- Shows empty state if no collections yet

**Empty State:**
```
No recent collections
Start a route to record collections
```

## Backend Endpoints Used

### 1. Route Statistics
**Endpoint:** `GET /api/routes/stats`  
**Controller:** `route.controller.js::getRouteStats`  
**Returns:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "pending": 2,
    "in-progress": 1,
    "completed": 7,
    "todayRoutes": 1,
    "totalBinsCollected": 145,
    "completedRoutes": 7
  }
}
```

### 2. Collection Statistics
**Endpoint:** `GET /api/collections/stats`  
**Controller:** `collection.controller.js::getCollectionStats`  
**Returns:**
```json
{
  "success": true,
  "data": {
    "total": 145,
    "collected": 130,
    "todayCollections": 15,
    "weekCollections": 85,
    "totalWeightCollected": 2450.5
  }
}
```

### 3. Recent Collections
**Endpoint:** `GET /api/collections?limit=5&sort=-collectionDate`  
**Controller:** `collection.controller.js::getCollectionRecords`  
**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "bin": { "binId": "BIN004", "location": {...} },
      "route": { "routeName": "Colombo City Route" },
      "status": "collected",
      "wasteWeight": 25.5,
      "collectionDate": "2025-10-17T02:30:00Z"
    }
  ]
}
```

## Auto-Refresh Strategy

### Query Refetch Intervals
- **Route Stats:** 30 seconds
- **Collection Stats:** 30 seconds
- **Recent Collections:** 30 seconds
- **Dashboard Overview:** 60 seconds

### Benefits
✅ Real-time updates without page refresh  
✅ Minimal server load (30s intervals)  
✅ Fresh data for active collectors  
✅ Automatic synchronization across tabs

## User Experience

### For Collectors

**Dashboard Load:**
1. Login as collector
2. Navigate to dashboard
3. See loading skeletons while data fetches
4. Data appears within 1-2 seconds

**Real-Time Updates:**
- After recording a collection → Dashboard updates within 30 seconds
- After starting a route → "Active Routes" card increments
- After completing collections → "Collections Today" shows new count

**Activity Feed:**
- Most recent collection appears at top
- Shows exact time elapsed
- Color-coded status indicators
- Hover effects for interaction feedback

### Visual Feedback

**Loading States:**
```tsx
{statsLoading || routeStatsLoading || collectionStatsLoading ? (
  <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl p-7 animate-pulse h-48"></div>
) : (
  <StatCard ... />
)}
```

**Empty States:**
- No collections yet: Shows friendly message with icon
- Encourages action: "Start a route to record collections"

## Performance Optimizations

### Query Caching
```typescript
queryKey: ['route-stats']  // Cached by TanStack Query
```

### Conditional Fetching
```typescript
enabled: user?.role === 'collector'  // Only fetch for collectors
```

### Efficient Updates
- Uses `refetchInterval` instead of polling
- Invalidates cache on mutations
- Shares data across components via query keys

## Testing Checklist

### Functional Tests
- [x] Login as collector
- [x] Verify dashboard shows 0s initially
- [x] Start a route (RT001)
- [x] Check "Active Routes" increments to 1
- [x] Record a collection
- [x] Wait 30 seconds
- [x] Verify "Collections Today" increments
- [x] Check Recent Activity shows new collection
- [x] Verify time ago updates correctly

### Data Accuracy Tests
- [x] Active Routes matches in-progress count in DB
- [x] Collections Today matches today's records
- [x] Pending Routes shows correct count
- [x] Recent Activity shows latest 5 collections

### Edge Cases
- [x] No collections → Shows empty state
- [x] Network error → Shows loading/error state
- [x] Multiple collectors → Each sees own data only

## Database Queries

### Route Stats Query (Simplified)
```javascript
const routeStats = await Route.aggregate([
  { $match: { assignedCollector: req.user._id } },
  { $group: { 
    _id: '$status', 
    count: { $sum: 1 } 
  }}
]);
```

### Collection Stats Query (Simplified)
```javascript
const collectionStats = await CollectionRecord.aggregate([
  { $match: { collector: req.user._id } },
  { $group: { 
    _id: '$status',
    count: { $sum: 1 },
    totalWeight: { $sum: '$wasteWeight' }
  }}
]);
```

## Security

### Role-Based Filtering
- Backend automatically filters by `req.user._id` for collectors
- Frontend conditionally enables queries based on `user?.role`
- No access to other collectors' data

### Data Privacy
- Only shows collector's own routes and collections
- No sensitive resident data exposed
- Aggregated statistics only

## Future Enhancements

### Potential Additions
1. **Real-time WebSocket Updates** - Instant updates instead of 30s polling
2. **Performance Charts** - Line graphs showing daily collection trends
3. **Leaderboard** - Compare performance with other collectors
4. **Notifications** - Toast notifications when new route assigned
5. **Offline Support** - Cache data for offline viewing

### Analytics Integration
```typescript
// Potential future query
const { data: performanceData } = useQuery({
  queryKey: ['collector-performance'],
  queryFn: () => analyticsService.getCollectorPerformance(user._id)
});
```

## Troubleshooting

### Dashboard Shows 0s
**Cause:** No routes assigned or no collections recorded  
**Solution:** 
1. Check if collector has assigned routes in database
2. Verify route status is 'in-progress'
3. Ensure collections were recorded successfully

### Data Not Updating
**Cause:** Refetch interval not working or network error  
**Solution:**
1. Check browser console for errors
2. Verify backend is running (http://localhost:5000)
3. Check Network tab in DevTools
4. Try hard refresh (Cmd+Shift+R)

### Wrong Data Showing
**Cause:** Cache not invalidated or wrong user ID  
**Solution:**
1. Clear browser cache
2. Logout and login again
3. Check backend logs for correct user filtering
4. Verify JWT token contains correct user ID

## Code Changes Summary

**Files Modified:**
1. `frontend/src/pages/DashboardPage.tsx`
   - Added route service import
   - Added collection service import
   - Added 3 new useQuery hooks
   - Updated 4 stat cards
   - Updated Recent Activity section

**Backend Files (No Changes):**
- Routes and controllers already supported the queries
- Existing endpoints work perfectly for collector dashboard

## Migration Notes

**No Database Migration Required**
- Uses existing collections and routes
- No schema changes
- Backward compatible

**No Breaking Changes**
- Other roles (resident, admin, authority) unaffected
- Existing functionality preserved
- Additive changes only

## Success Metrics

After this update, collectors will see:
- **Accurate route counts** (not hardcoded 0s)
- **Real collection numbers** (actual today's count)
- **Live activity feed** (last 5 collections)
- **Auto-refreshing data** (every 30 seconds)

**Before vs After:**

| Metric | Before | After |
|--------|--------|-------|
| Active Routes | 0 (static) | 1 (dynamic) |
| Collections Today | 0 (static) | 15 (real count) |
| Pending Routes | 0 (static) | 2 (actual pending) |
| Recent Activity | Fake data | Real collection records |
| Data Freshness | Never updates | Every 30 seconds |

## Conclusion

The collector dashboard now provides **real-time, accurate data** fetched directly from the database. This enhancement improves:
- ✅ **Data accuracy** - No more placeholder values
- ✅ **User trust** - Shows actual work completed
- ✅ **Operational awareness** - Collectors see live status
- ✅ **Performance tracking** - Real metrics for evaluation

The implementation follows best practices:
- Uses TanStack Query for efficient data fetching
- Implements proper loading states
- Shows empty states when appropriate
- Auto-refreshes to keep data current
- Filters by user role for security
