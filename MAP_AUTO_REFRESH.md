# Map Auto-Refresh Feature

## Overview
The bin location map now automatically updates when residents add new bins, ensuring collectors always see the most current bin locations without manual page refreshes.

## How It Works

### 1. **Automatic Updates**
The map fetches new bin data automatically through multiple mechanisms:

- **Window Focus Refresh**: When you switch back to the map tab, it automatically checks for new bins
- **Periodic Polling**: Every 30 seconds, the map automatically fetches updated bin data
- **Query Invalidation**: When bins are added/edited on the Bins page, the map data is marked as stale

### 2. **Manual Refresh Button**
A new "Refresh" button in the header allows collectors to manually fetch the latest bin data:
- Click the refresh button to immediately update the map
- The button shows a spinning icon while loading
- Button is disabled during loading to prevent multiple simultaneous requests

## Code Implementation

### MapPage.tsx Updates

```typescript
// Auto-refresh query configuration
const { data: binsData, isLoading: loadingBins, error: binsError, refetch } = useQuery({
  queryKey: ['bins'],
  queryFn: () => binService.getAllBins({}),
  refetchOnWindowFocus: true,    // ✅ Refetch when returning to tab
  refetchInterval: 30000,         // ✅ Auto-refresh every 30 seconds
  staleTime: 10000,              // ✅ Data is fresh for 10 seconds
});
```

### UI Components

**Refresh Button:**
```tsx
<button
  onClick={() => refetch()}
  disabled={loadingBins}
  className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 
             bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300"
>
  <RefreshCw className={`w-5 h-5 ${loadingBins ? 'animate-spin' : ''}`} />
  Refresh
</button>
```

**Status Indicator:**
Updated subtitle shows auto-update status:
```
"Real-time waste bin monitoring and collection planning • Auto-updates every 30s"
```

## User Workflow

### Scenario: Resident Adds a New Bin

1. **Resident** goes to the Bins page (`/bins`) and clicks "Add New Bin"
2. **Resident** fills in bin details:
   - Location/Address
   - Capacity
   - Bin Type (General/Recyclable/Organic)
   - Coordinates (or map picker)
3. **Resident** clicks "Create Bin"
4. **Backend** saves the new bin to MongoDB
5. **Map Updates Automatically** through one of these methods:
   - If collector is on the map page: Updates within 30 seconds (auto-polling)
   - If collector switches to map tab: Updates immediately (focus refetch)
   - If collector clicks refresh: Updates immediately (manual refetch)

### Scenario: Bulk Import of Bins

When running scripts like `seed.js` or adding multiple bins:

1. **Script** adds multiple bins to database (e.g., 14 bins with `add-more-bins.js`)
2. **Collector** on map page:
   - Waits up to 30 seconds for automatic refresh
   - OR clicks "Refresh" button for immediate update
3. **Map** displays all new bins with correct markers
4. **Statistics** cards update to show new counts

## Benefits

### For Collectors
✅ **Always Current Data**: See newly registered bins without page refresh
✅ **Real-Time Awareness**: Know exactly which bins need collection
✅ **Reduced Manual Work**: No need to constantly refresh the page
✅ **Quick Manual Override**: Refresh button available when needed

### For Residents
✅ **Immediate Registration**: Bins appear on map shortly after registration
✅ **Visual Confirmation**: Can verify bin was added correctly
✅ **Better Service**: Collectors are notified faster about new bins

### For System
✅ **Efficient Data Sync**: Smart caching reduces unnecessary API calls
✅ **User Control**: Manual refresh option for immediate updates
✅ **Network Friendly**: 30-second intervals prevent server overload

## Configuration Options

### Adjust Refresh Interval
Change the polling frequency by modifying `refetchInterval`:

```typescript
refetchInterval: 60000,  // Refresh every 60 seconds (1 minute)
refetchInterval: 10000,  // Refresh every 10 seconds (faster)
refetchInterval: false,  // Disable automatic polling
```

### Adjust Stale Time
Control how long data is considered fresh:

```typescript
staleTime: 30000,  // Data fresh for 30 seconds
staleTime: 0,      // Always consider data stale (refetch more often)
staleTime: 60000,  // Data fresh for 1 minute
```

### Disable Window Focus Refetch
If you don't want refetch on tab switch:

```typescript
refetchOnWindowFocus: false,  // Disable focus-based refetch
```

## Testing the Feature

### Test 1: Automatic Polling
1. Open map page: `http://localhost:5174/map`
2. In another tab, add a bin on the Bins page
3. Wait 30 seconds (or less)
4. Observe the new bin appears on map automatically

### Test 2: Window Focus Refetch
1. Open map page in one browser tab
2. Add a bin via Bins page in another tab
3. Switch back to the map tab
4. Bin should appear immediately

### Test 3: Manual Refresh
1. Open map page
2. Add a bin (or run a seed script) in backend
3. Click the "Refresh" button in map header
4. New bin appears immediately

### Test 4: Bulk Bin Addition
1. Run: `node add-more-bins.js` in backend
2. Go to map page
3. See all 14 new bins appear on map
4. Statistics cards update correctly

## Troubleshooting

### Bins Not Appearing After 30 Seconds
1. **Check Console**: Open browser console (F12) for errors
2. **Check Login**: Ensure you're logged in as collector
3. **Check Network**: Verify API calls are succeeding (Network tab)
4. **Manual Refresh**: Click the refresh button to force update

### Refresh Button Not Working
1. **Authentication**: Verify JWT token is valid
2. **Backend Running**: Ensure backend is on port 5000
3. **Console Errors**: Check browser console for error messages

### Map Shows Old Data
1. **Clear Browser Cache**: Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check Stale Time**: Might need to reduce `staleTime` value
3. **Force Refetch**: Click refresh button

## Performance Considerations

### Network Traffic
- **30-second polling**: ~120 requests per hour per user
- **Average request size**: ~5-10 KB with 14 bins
- **Monthly data**: ~36 MB per user (assuming 8-hour work days)

### Server Load
For 10 concurrent collectors:
- **Requests per hour**: 1,200
- **Peak load**: Minimal with efficient MongoDB queries
- **Recommendation**: Monitor if user count exceeds 50

### Optimization Tips
1. **Increase interval** for less frequent updates (60s instead of 30s)
2. **Disable polling** if real-time updates aren't critical
3. **Implement WebSockets** for true real-time updates at scale

## Future Enhancements

### Potential Improvements
1. **WebSocket Integration**: Push updates from server instead of polling
2. **Smart Polling**: Only poll when user is actively viewing map
3. **Incremental Updates**: Fetch only changed bins instead of all bins
4. **Notification Badge**: Show alert when new bins are available
5. **Last Updated Timestamp**: Display when data was last refreshed

### Real-Time Push Updates (Future)
```typescript
// Using Socket.io for instant updates
socket.on('bin:created', (newBin) => {
  queryClient.setQueryData(['bins'], (old) => [...old, newBin]);
});

socket.on('bin:updated', (updatedBin) => {
  queryClient.setQueryData(['bins'], (old) =>
    old.map(bin => bin.id === updatedBin.id ? updatedBin : bin)
  );
});
```

## Summary

The map now provides a seamless, real-time experience for collectors monitoring waste bins. With automatic 30-second updates, window focus refresh, and a manual refresh button, collectors always have access to the most current bin data. This ensures efficient collection planning and immediate awareness of newly registered bins.

**Key Features:**
- 🔄 Auto-refresh every 30 seconds
- 👁️ Refresh on window focus
- 🔘 Manual refresh button
- 📊 Real-time statistics updates
- ⚡ Efficient caching and data sync
