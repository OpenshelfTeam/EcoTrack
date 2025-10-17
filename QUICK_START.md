# Quick Start Guide - Collection Workflow

## Current Status
✅ Your route "Downtown Route" is ready with:
- **Status**: In Progress
- **Bins**: 2 bins assigned (BIN001, BIN002)
- **Collector**: Mike Collector (you)
- **Location**: Downtown Springfield

## Steps to Start Collection

### Step 1: Refresh the Page
The page has been updated with new features. Refresh your browser to see them.

### Step 2: Look for the "Continue Collection" Button
On the Routes page, you should now see a **green "Continue Collection"** button next to your "Downtown Route" card.

### Step 3: Click "Continue Collection"
This will open the interactive collection map view.

### Step 4: Start Collecting Bins

#### What You'll See:
```
┌─────────────────────────────────────────────────┐
│  ROUTE MAP                                       │
│  ┌─────┐  ┌─────┐                               │
│  │BIN 1│  │BIN 2│  ← Bin grid showing locations │
│  │ 🟡  │  │ ⚪  │                               │
│  └─────┘  └─────┘                               │
│                                                  │
│  Progress: ▓▓░░░░░░░░ 0/2 bins                  │
│                                                  │
│  Collected: 0  Empty: 0  Damaged: 0             │
└─────────────────────────────────────────────────┘

┌─────────────────────────┐
│ CURRENT BIN INFO        │
│ 📍 123 Main St          │
│ Type: General           │
│                         │
│ [Scan Bin QR Code]      │
└─────────────────────────┘
```

### Step 5: Collect First Bin
1. **Click** on the yellow highlighted bin (BIN 1)
2. **Scan Modal** appears → Click "Confirm Scan"
3. **Status Modal** appears with 3 options:
   - ✅ **Collected Successfully** ← Click this
   - ⚪ **No Garbage (Empty)**
   - ❌ **Damaged / Report Issue**

### Step 6: Bin Collected!
- ✅ BIN 1 turns green with checkmark
- 🎯 Progress updates: 1/2 bins (50%)
- 🟡 BIN 2 becomes the current bin (yellow)
- 📋 Recent collections list shows BIN 1

### Step 7: Collect Second Bin
Repeat step 5 for BIN 2

### Step 8: Complete Route
1. After collecting both bins, click **"Complete Route"** button
2. Review summary:
   ```
   ✓ Collected: 2
   ○ Empty: 0
   ✗ Damaged: 0
   Total: 2/2 bins
   ```
3. Click **Confirm**
4. 🎉 Route marked as completed!

## Testing Exception Reporting

### To Test "Damaged Bin" Flow:
1. When the Status Modal appears, click **"Damaged / Report Issue"**
2. **Exception Modal** opens:
   - Upload a photo (required)
   - Select issue type: "Bin Damaged"
   - Enter description: "Lid is broken"
   - Click **Submit Report**
3. ✅ Exception recorded
4. 📧 Notifications sent to bin owner and admins
5. 🔧 Bin status changed to "maintenance-required"

## Alternative: Use Map View

If you don't see the button:
1. Click **"Map View"** button (top right)
2. This shows the interactive collection interface
3. Select "Downtown Route" from the list
4. Map opens with bins displayed

## Troubleshooting

### "No active routes available"
- Refresh the page
- Check that you're logged in as "Mike Collector"

### Bins not showing
- Route status should be "in-progress" or "pending"
- Verify route has bins assigned (use test script)

### Can't click bins
- Make sure you clicked "Continue Collection" first
- Check that `activeRoute` state is set

## Quick Commands

### Check Route Data:
```bash
cd backend
node test-route-data.js
```

### Check Frontend Console:
Open browser DevTools (F12) → Console tab
Look for errors or warnings

### Restart Servers:
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

## What Should Happen

### ✅ Expected Behavior:
1. Green "Continue Collection" button visible
2. Click → Map view loads
3. 2 bins displayed in grid
4. Can click bins to scan
5. Can mark as collected/empty/damaged
6. Progress bar updates
7. Can complete route

### ❌ If Not Working:
1. Check browser console for errors
2. Verify you're logged in as collector
3. Refresh the page
4. Clear browser cache
5. Check network tab for API errors

## Next Steps After Testing

Once you've completed one collection:
1. Create more routes with different bins
2. Test all status types (collected, empty, damaged)
3. Test exception reporting with photos
4. Test route completion notifications
5. Check collection records in database

---

**Last Updated**: Now
**Your Route**: Downtown Route (RT001)
**Your Bins**: BIN001, BIN002
**Status**: Ready to collect! 🎯
