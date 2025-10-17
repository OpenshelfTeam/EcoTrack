# Ticket Number Duplicate Key Error Fix

## Problem Description

**Error Message:**

```
E11000 duplicate key error collection: test.tickets index: ticketNumber_1 dup key: { ticketNumber: "TKT000004" }
```

**Root Cause:**
The ticket number auto-generation logic was using `countDocuments()` to determine the next ticket number. This approach fails when tickets are deleted from the database because:

1. `countDocuments()` counts all existing documents
2. If tickets are deleted, the count no longer matches the highest ticket number
3. This causes the system to try generating duplicate ticket numbers

### Example Scenario:

```
Existing tickets: TKT000001, TKT000002, TKT000003, TKT000004
Delete TKT000002
countDocuments() returns: 3
Next ticket attempted: TKT000004 (3 + 1 = 4) ❌ DUPLICATE!
```

## Solution Implemented

### 1. Updated Ticket Model Auto-Generation Logic

**File:** `backend/models/Ticket.model.js`

**Old Logic (Problematic):**

```javascript
ticketSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketNumber = `TKT${String(count + 1).padStart(6, "0")}`;
  }
  next();
});
```

**New Logic (Fixed):**

```javascript
ticketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      // Find the ticket with the highest number
      const lastTicket = await mongoose
        .model("Ticket")
        .findOne()
        .sort({ ticketNumber: -1 })
        .select("ticketNumber")
        .lean();

      let nextNumber = 1;

      if (lastTicket && lastTicket.ticketNumber) {
        // Extract the number from the last ticket (e.g., "TKT000004" -> 4)
        const lastNumber = parseInt(lastTicket.ticketNumber.replace("TKT", ""));
        nextNumber = lastNumber + 1;
      }

      // Generate new ticket number with padding
      this.ticketNumber = `TKT${String(nextNumber).padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating ticket number:", error);
      // Fallback to timestamp-based unique ID if there's an error
      this.ticketNumber = `TKT${Date.now()}`;
    }
  }
  next();
});
```

**How It Works:**

1. ✅ Finds the ticket with the highest `ticketNumber` (sorted descending)
2. ✅ Extracts the numeric part using `replace('TKT', '')`
3. ✅ Increments by 1 to get the next number
4. ✅ Formats with 6-digit padding (e.g., TKT000005)
5. ✅ Includes error handling with timestamp fallback

### 2. Created Index Fix Script

**File:** `backend/fix-ticket-index.js`

This script:

- ✅ Drops the old `ticketNumber_1` index
- ✅ Recreates it with `sparse: true` option (allows null values)
- ✅ Checks for duplicate ticket numbers
- ✅ Shows the highest existing ticket number
- ✅ Predicts the next ticket number that will be generated

**Script Output:**

```
✅ Connected to MongoDB

📋 Current indexes:
  - _id_: { _id: 1 }
  - ticketNumber_1: { ticketNumber: 1 }

✅ Dropped ticketNumber_1 index
✅ Recreated ticketNumber index with sparse option

✅ No duplicate ticket numbers found

📊 Highest ticket number: TKT000004
📊 Next ticket will be: TKT000005

✅ Index fix completed successfully!
```

## Steps to Apply the Fix

### Step 1: Run the Index Fix Script (Already Completed)

```bash
cd backend
node fix-ticket-index.js
```

### Step 2: Restart the Backend Server (Required)

The updated model logic needs to be loaded by restarting the server:

**Option A: Using npm script**

```bash
cd backend
npm run dev
```

**Option B: Kill and restart manually**

```bash
# Find the process
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Kill the backend server process (use the correct PID)
Stop-Process -Id <PID>

# Restart
cd backend
npm run dev
```

### Step 3: Test Ticket Creation

1. Navigate to `/tickets` page
2. Click "Create New Ticket"
3. Fill in the form and submit
4. Verify the new ticket is created with number **TKT000005** (or higher)
5. Create multiple tickets to ensure auto-increment works correctly

## Verification Checklist

- [x] Index fix script executed successfully
- [x] No duplicate ticket numbers found in database
- [x] Highest ticket number identified: **TKT000004**
- [x] Next ticket will be: **TKT000005**
- [ ] **Backend server restarted** (REQUIRED - You need to do this)
- [ ] New ticket creation tested and working
- [ ] Multiple tickets created sequentially without errors

## Technical Details

### MongoDB Index Configuration

- **Index Name:** `ticketNumber_1`
- **Index Type:** Unique, Sparse
- **Purpose:** Ensures ticket numbers are unique while allowing null values during creation

### Auto-Generation Algorithm

```javascript
// Pseudo-code
1. Query: Find ONE ticket, sort by ticketNumber DESC
2. If found:
   - Extract number: "TKT000004" -> 4
   - Increment: 4 + 1 = 5
   - Format: "TKT000005"
3. If not found:
   - Start from: "TKT000001"
4. If error occurs:
   - Fallback: `TKT${Date.now()}` (e.g., TKT1729180000000)
```

### Performance Considerations

- **Query Efficiency:** Uses `.lean()` to reduce memory overhead
- **Index Utilization:** Sorting by `ticketNumber` uses the unique index
- **Error Resilience:** Timestamp fallback ensures ticket creation never fails

## Common Issues and Solutions

### Issue 1: Error Still Occurs After Fix

**Cause:** Backend server not restarted
**Solution:** Restart the backend server to load the new model logic

### Issue 2: Tickets Created with Timestamp Format

**Cause:** Error in the ticket number generation logic
**Solution:** Check MongoDB connection and ensure `ticketNumber` field exists on previous tickets

### Issue 3: Next Ticket Number Seems Wrong

**Cause:** Gaps in ticket sequence due to deleted tickets
**Solution:** This is expected behavior. The system always increments from the highest existing number, regardless of gaps.

**Example:**

```
Existing: TKT000001, TKT000003, TKT000007
Next will be: TKT000008 ✅ (Not TKT000002 or TKT000004)
```

## Files Modified

1. ✅ `backend/models/Ticket.model.js`
   - Updated `pre('save')` hook with improved auto-generation logic
2. ✅ `backend/fix-ticket-index.js` (New file)

   - Script to fix MongoDB index and verify ticket numbers

3. ✅ `TICKET_DUPLICATE_KEY_FIX.md` (This file)
   - Complete documentation of the issue and solution

## Next Steps

1. **IMPORTANT:** Restart the backend server to apply changes
2. Test ticket creation functionality
3. Monitor for any errors in the next few ticket creations
4. Consider implementing a ticket number sequence counter in the future for better performance

## Alternative Solutions Considered

### Option 1: MongoDB Auto-Increment Counter Collection ❌

**Pros:** Standard pattern, guaranteed uniqueness
**Cons:** Requires additional collection, more complex setup, overkill for this use case

### Option 2: UUID-based Ticket Numbers ❌

**Pros:** Zero collision risk, no database queries needed
**Cons:** Not user-friendly (e.g., TKT-a1b2c3d4-e5f6), harder to reference verbally

### Option 3: Timestamp-based Sequential ❌

**Pros:** Simple, chronologically ordered
**Cons:** Not readable as sequential numbers, timezone issues

### Option 4: Find Highest + Increment ✅ **CHOSEN**

**Pros:** Simple, handles deletions, human-readable, maintains sequence
**Cons:** Slight performance overhead on creation (acceptable for this use case)

## Maintenance Notes

- The current solution handles up to 999,999 tickets (6 digits)
- If approaching this limit, update the `padStart(6, '0')` value
- Consider archiving old tickets to maintain performance
- The sparse index allows manual ticket number assignment if needed

---

**Status:** ✅ Fixed (Restart Required)  
**Date:** January 17, 2025  
**Developer:** Lithira (Member 2)  
**Branch:** Lithira_2  
**Tested:** ⚠️ Pending backend server restart
