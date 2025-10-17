# 🚚 Collector Features - Complete Guide

## ✅ NEW FEATURES ADDED

### 1. **Assigned Pickups in Collections Page** 📦
- Collectors can now see all their assigned pickup requests
- New "Pickups" tab in Collections page
- Update pickup status (scheduled → in-progress → completed)

### 2. **Pickup Locations on Route Map** 🗺️
- Assigned pickups appear as orange/yellow/green markers on the route map
- Different colors for different statuses
- Detailed popup information for each pickup
- Legend shows what each marker means

---

## 🎯 Feature 1: Collections Page - Pickups Tab

### What You'll See:
When logged in as a collector, the Collections page now has **TWO tabs**:

```
┌─────────────────────────────────────────────────────────────┐
│  📅 My Collections                                          │
│                                                             │
│  [📅 Scheduled]  [🚚 Pickups]  ← NEW TAB!                   │
└─────────────────────────────────────────────────────────────┘
```

### Pickups Tab Shows:

**Statistics Cards:**
```
┌──────────────────────────────────────────────────────────┐
│  Total: 10  |  Scheduled: 5  |  In Progress: 2  |  Done: 3  │
└──────────────────────────────────────────────────────────┘
```

**Pickup Cards:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 PKP00001  recyclable  🔵 scheduled                       │
├─────────────────────────────────────────────────────────────┤
│  📍 Location: 123 Main St, Springfield, IL                 │
│  📅 Date: Oct 20, 2025                                     │
│  🕐 Time: Morning                                          │
│  👤 Resident: John Doe                                     │
│  📝 Notes: Please call before arrival                      │
│                                                            │
│                                      [Start Pickup →]      │
└─────────────────────────────────────────────────────────────┘
```

### Actions You Can Take:

| Status | Button Shown | What It Does |
|--------|--------------|--------------|
| **Scheduled** | [Start Pickup] (Yellow) | Changes status to "in-progress" |
| **In Progress** | [Mark Complete] (Green) | Changes status to "completed" |
| **Completed** | ✓ Completed (Green badge) | Read-only, already done |

---

## 🗺️ Feature 2: Routes Page - Pickup Markers on Map

### When You See It:
- Login as collector
- Go to **Routes** page
- Start a route or view map

### What You'll See on Map:

**Regular Bin Markers (Blue/Yellow/Green pins):**
- 🔵 Blue: Next bins to collect
- 🟡 Yellow: Current bin
- 🟢 Green: Collected bins

**NEW Pickup Markers (Orange/Yellow/Green packages):**
- 🟠 Orange 📦: Scheduled pickups
- 🟡 Yellow 🚚: Pickups in progress
- 🟢 Green ✓: Completed pickups

### Map View:
```
         🗺️ ROUTE MAP
    ┌─────────────────────────┐
    │   🔵 ← Bin 1            │
    │      ↓                  │
    │   🟡 ← Current Bin      │
    │      ↓                  │
    │   🔵 ← Bin 3            │
    │                         │
    │   📦 ← Scheduled Pickup │ ← NEW!
    │   🚚 ← Pickup In Progress│ ← NEW!
    │   ✓  ← Completed Pickup │ ← NEW!
    │                         │
    │   🟢 ← Collected Bin    │
    └─────────────────────────┘
```

### Click on Pickup Marker:
```
┌─────────────────────────────────────────┐
│ 🚚 Pickup Request                       │
│ PKP00001                                │
├─────────────────────────────────────────┤
│ 123 Main St, Springfield, IL            │
│                                         │
│ Type: recyclable                        │
│ Status: scheduled                       │
│ Date: Oct 20, 2025                     │
│ Time: morning                           │
│ Resident: John Doe                      │
│                                         │
│ [Scheduled for collection]              │
└─────────────────────────────────────────┘
```

### Map Legend (Now Includes Pickups):
```
BIN MARKERS:
🟡 ● Current Bin
🔵 2 Next Bins
🟢 ✓ Collected

PICKUP MARKERS:  ← NEW!
🟠 📦 Scheduled Pickup
🟡 🚚 Pickup In Progress
🟢 ✓ Pickup Complete

━━━━ Collection Route
```

---

## 🔄 Complete Collector Workflow

### Scenario: Collector Has Route + Assigned Pickups

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: CHECK COLLECTIONS PAGE                              │
├─────────────────────────────────────────────────────────────┤
│ • Login as collector@test.com                               │
│ • Go to Collections page                                    │
│ • Click "Pickups" tab                                       │
│ • See 5 scheduled pickups                                   │
│ • Note addresses and time slots                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: START ROUTE                                         │
├─────────────────────────────────────────────────────────────┤
│ • Go to Routes page                                         │
│ • Find your assigned route                                  │
│ • Click "Start Route"                                       │
│ • Map view opens with:                                      │
│   - Blue markers for bins                                   │
│   - Orange markers for pickups 📦                          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: NAVIGATE TO LOCATIONS                               │
├─────────────────────────────────────────────────────────────┤
│ • Follow the route line on map                              │
│ • Collect from bins (blue markers)                          │
│ • ALSO see nearby pickups (orange markers)                  │
│ • Click pickup markers to see details                       │
│ • Plan efficient route combining bins + pickups             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PERFORM PICKUP                                      │
├─────────────────────────────────────────────────────────────┤
│ • Arrive at pickup location                                 │
│ • Go back to Collections > Pickups tab                      │
│ • Find the pickup card                                      │
│ • Click "Start Pickup" button                               │
│ • Status changes to "in-progress"                           │
│ • Marker on map turns yellow 🚚                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: COMPLETE PICKUP                                     │
├─────────────────────────────────────────────────────────────┤
│ • After collecting waste                                    │
│ • Click "Mark Complete" button                              │
│ • Status changes to "completed"                             │
│ • Marker on map turns green ✓                              │
│ • Resident receives notification                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: CONTINUE ROUTE                                      │
├─────────────────────────────────────────────────────────────┤
│ • Return to route map                                       │
│ • Continue collecting bins                                  │
│ • Complete remaining pickups                                │
│ • All locations visible on same map                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Instructions

### Test 1: View Assigned Pickups

**Prerequisites:**
- Login as collector: `collector@test.com` / `password123`
- Have at least one assigned pickup (operator should assign first)

**Steps:**
1. Go to **Collections** page from sidebar
2. Click the **"Pickups"** tab (blue button with truck icon)
3. **Expected:**
   - ✅ See statistics cards (Total, Scheduled, In Progress, Completed)
   - ✅ See list of assigned pickups
   - ✅ Each card shows: ID, waste type, status, location, date, time, resident
   - ✅ Action buttons visible based on status

---

### Test 2: Update Pickup Status

**Steps:**
1. On Pickups tab, find a **scheduled** pickup
2. Click **"Start Pickup"** button (yellow)
3. **Expected:**
   - ✅ Status changes to "in-progress"
   - ✅ Button changes to "Mark Complete" (green)
   - ✅ Statistics update (Scheduled -1, In Progress +1)

4. Click **"Mark Complete"** button
5. **Expected:**
   - ✅ Status changes to "completed"
   - ✅ Button becomes green badge "✓ Completed"
   - ✅ Statistics update (In Progress -1, Completed +1)
   - ✅ Resident receives notification

---

### Test 3: View Pickups on Map

**Steps:**
1. Go to **Routes** page
2. Find any route or start a route
3. Look at the map view
4. **Expected:**
   - ✅ See regular bin markers (blue/yellow/green pins)
   - ✅ See pickup markers (orange/yellow/green packages) 📦
   - ✅ Different colors for different pickup statuses
   - ✅ Map legend shows pickup marker meanings

---

### Test 4: Pickup Marker Details

**Steps:**
1. On route map, click an **orange pickup marker** 📦
2. **Expected Popup:**
   - ✅ Title: "🚚 Pickup Request"
   - ✅ Request ID: PKP00001
   - ✅ Address
   - ✅ Waste type
   - ✅ Status
   - ✅ Scheduled date
   - ✅ Time slot
   - ✅ Resident name
   - ✅ Status badge at bottom

3. Go to Collections > Pickups and update status to "in-progress"
4. Return to map
5. **Expected:**
   - ✅ Marker color changed to yellow 🚚
   - ✅ Popup shows updated status

---

### Test 5: Complete Workflow

**End-to-End Test:**

1. **Operator:** Assign pickup to collector
   - ✅ Collector receives notification

2. **Collector:** View on Collections > Pickups
   - ✅ Pickup appears in list
   - ✅ Status: scheduled
   - ✅ All details visible

3. **Collector:** View on Routes > Map
   - ✅ Orange marker appears on map
   - ✅ Click marker shows details

4. **Collector:** Start pickup
   - ✅ Status changes to in-progress
   - ✅ Map marker turns yellow

5. **Collector:** Complete pickup
   - ✅ Status changes to completed
   - ✅ Map marker turns green
   - ✅ Resident notified

---

## 📊 Status Color Reference

### Pickup Status Colors:

| Status | Collections Page | Map Marker | Icon |
|--------|-----------------|-----------|------|
| **Scheduled** | Blue badge | 🟠 Orange pin | 📦 |
| **In Progress** | Yellow badge | 🟡 Yellow pin | 🚚 |
| **Completed** | Green badge | 🟢 Green pin | ✓ |

### Bin Status Colors (for reference):

| Status | Map Marker | Icon |
|--------|-----------|------|
| **Next Bin** | 🔵 Blue pin | 1,2,3... |
| **Current** | 🟡 Yellow pin | ● |
| **Collected** | 🟢 Green pin | ✓ |

---

## 💡 Tips for Collectors

### Efficiency Tips:

1. **Check Both Tabs:**
   - "Scheduled" tab: Regular collection routes
   - "Pickups" tab: On-demand requests

2. **Plan Your Route:**
   - Look at map to see all locations
   - Group nearby pickups with bin collections
   - Minimize travel distance

3. **Update Status Promptly:**
   - Mark "in-progress" when you arrive
   - Mark "completed" immediately after collection
   - Keeps system accurate and residents informed

4. **Use Map for Navigation:**
   - Orange markers show where pickups are
   - Plan efficient path including both bins and pickups
   - Check pickup details before arriving

5. **Prioritize by Time:**
   - Morning pickups first (if in morning slot)
   - Combine pickups in same area
   - Note any special instructions in pickup notes

---

## 🐛 Troubleshooting

### Issue: Pickups Tab Not Visible

**Cause:** Not logged in as collector

**Solution:**
- Login as collector@test.com
- Only collectors see the Pickups tab

---

### Issue: No Pickups Showing

**Causes:**
1. No pickups assigned to you yet
2. All pickups already completed

**Solutions:**
- Ask operator to assign pickups
- Check "Completed" count in statistics
- Verify you're looking at correct date range

---

### Issue: Pickup Markers Not on Map

**Causes:**
1. No assigned pickups
2. Pickups don't have valid coordinates

**Solutions:**
- Verify pickups exist in Collections > Pickups tab
- Check if pickup has address/location
- Refresh the page

---

### Issue: Can't Update Status

**Causes:**
1. Already updated
2. Network error

**Solutions:**
- Check current status (can't go backwards)
- Verify internet connection
- Refresh page and try again

---

## 📱 Mobile View

Both features work on mobile:

**Collections > Pickups Tab:**
- Statistics stack vertically
- Pickup cards scroll
- Buttons remain accessible

**Routes > Map:**
- Map is responsive
- Pinch to zoom works
- Tap markers for details
- Legend adapts to screen

---

## ✅ Success Checklist

**Collections Page:**
- [ ] Can see "Pickups" tab
- [ ] Statistics cards show correct numbers
- [ ] Pickup cards display all information
- [ ] "Start Pickup" button works
- [ ] "Mark Complete" button works
- [ ] Status updates correctly

**Routes Map:**
- [ ] Pickup markers appear on map
- [ ] Markers use correct colors
- [ ] Click marker shows popup
- [ ] Popup shows all pickup details
- [ ] Legend shows pickup types
- [ ] Status changes reflect on map

---

**Status:** ✅ **READY TO USE**  
**Date:** October 17, 2025  
**Features:** Assigned Pickups View + Map Integration  
**Impact:** Complete collector workflow with visual route planning  

🎉 **Collectors can now see and manage their assigned pickups alongside regular collections!**
