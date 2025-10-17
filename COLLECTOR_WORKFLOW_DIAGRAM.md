# Collector Workflow - Visual Process Flow

## Complete Collection Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COLLECTOR OPENS ROUTES PAGE                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Switch to Map View    │
                    └────────────┬───────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│              SELECT ROUTE TO START COLLECTION                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Downtown A   │  │ Suburbs B    │  │ Industrial C │           │
│  │ 45 bins      │  │ 32 bins      │  │ 28 bins      │           │
│  │ 9AM - 2PM    │  │ 1PM - 5PM    │  │ 6AM - 11AM   │           │
│  └──────┬───────┘  └──────────────┘  └──────────────┘           │
└─────────┼──────────────────────────────────────────────────────────┘
          │ [Click Start]
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ROUTE STARTED - MAP LOADS                         │
│                                                                      │
│  Progress: 0/45 bins  [░░░░░░░░░░░░░░░░░░░░] 0%                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                    INTERACTIVE MAP                      │        │
│  │                                                         │        │
│  │  🟡(1)    ⚪(2)    ⚪(3)    ⚪(4)    ⚪(5)            │        │
│  │  Main St  Oak Ave  Pine St Elm Rd   Maple Dr           │        │
│  │  ↑ NEXT                                                │        │
│  │                                                         │        │
│  │  ⚪(6)    ⚪(7)    ⚪(8)    ⚪(9)    ⚪(10)           │        │
│  │  ...and 35 more bins                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Next Bin: 123 Main St → [Scan Bin QR Code]                       │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  COLLECTOR TRAVELS   │
                    │  TO BIN LOCATION     │
                    └──────────┬───────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ARRIVE AT BIN LOCATION                            │
│                                                                      │
│  Option A: Scan QR Code        Option B: Click Bin on Map          │
│  ┌───────────────────┐          ┌───────────────────┐             │
│  │   📱              │          │  Click bin marker  │             │
│  │   [QR Scanner]    │   OR     │  on map           │             │
│  │                   │          │                    │             │
│  └─────────┬─────────┘          └─────────┬─────────┘             │
└─────────────┼──────────────────────────────┼───────────────────────┘
              │                              │
              └──────────────┬───────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BIN SCANNED - VERIFIED                            │
│                                                                      │
│  Bin ID: BIN-12345                                                  │
│  Location: 123 Main St                                              │
│  Type: Standard                                                     │
│                                                                      │
│  [Confirm Scan]                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MARK BIN STATUS                                   │
│                                                                      │
│  Choose one:                                                        │
│                                                                      │
│  ┌─────────────────────────────────────────┐                       │
│  │  ✅ Collected Successfully              │                       │
│  │  Bin has waste, collected normally      │                       │
│  └────────────────┬────────────────────────┘                       │
│                   │                                                 │
│  ┌─────────────────────────────────────────┐                       │
│  │  🟡 No Garbage (Empty)                   │                       │
│  │  Bin is empty, nothing to collect       │                       │
│  └────────────────┬────────────────────────┘                       │
│                   │                                                 │
│  ┌─────────────────────────────────────────┐                       │
│  │  🔴 Damaged / Report Issue               │                       │
│  │  Bin needs attention or has problem     │                       │
│  └────────────────┬────────────────────────┘                       │
└───────────────────┼─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   [COLLECTED]  [EMPTY]    [ISSUE]
        │           │           │
        │           │           └──────┐
        │           │                  ▼
        │           │         ┌─────────────────────────┐
        │           │         │  EXCEPTION REPORT       │
        │           │         │                         │
        │           │         │  1. Upload Photo 📸    │
        │           │         │  2. Select Issue Type   │
        │           │         │     • Damaged          │
        │           │         │     • Inaccessible     │
        │           │         │     • Missing          │
        │           │         │     • Hazardous        │
        │           │         │     • Other            │
        │           │         │  3. Add Description    │
        │           │         │  4. [Submit Report]    │
        │           │         └───────────┬─────────────┘
        │           │                     │
        ▼           ▼                     ▼
┌───────────────────────────────────────────────────────────────────┐
│                     NOTIFICATIONS SENT                             │
│                                                                    │
│  ✅ COLLECTED:                                                     │
│  → Bin Owner: "Your bin has been collected"                       │
│                                                                    │
│  🟡 EMPTY:                                                         │
│  → Bin Owner: "Your bin was marked as empty"                      │
│                                                                    │
│  🔴 ISSUE:                                                         │
│  → Bin Owner: "Your bin needs attention - [issue type]"           │
│  → Admins: "Exception reported - [details + photo]"               │
│  → System: Creates support ticket                                 │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STATUS RECORDED & UPDATED                         │
│                                                                      │
│  Progress: 1/45 bins  [██░░░░░░░░░░░░░░░░░░] 2%                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                    UPDATED MAP                          │        │
│  │                                                         │        │
│  │  🟢(1)    🟡(2)    ⚪(3)    ⚪(4)    ⚪(5)            │        │
│  │  Main St  Oak Ave  Pine St Elm Rd   Maple Dr           │        │
│  │  DONE     ↑ NEXT                                       │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Statistics:                                                        │
│  ✅ Collected: 1    🟡 Empty: 0    🔴 Damaged: 0                   │
│                                                                      │
│  Recent Collections:                                                │
│  ✅ 123 Main St - Collected (just now)                             │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   MOVE TO NEXT BIN   │
                    │  (Auto-highlighted)  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   REPEAT PROCESS     │
                    │   FOR ALL BINS       │
                    └──────────┬───────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ALL BINS PROCESSED                                │
│                                                                      │
│  Progress: 45/45 bins  [████████████████████] 100%                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                    FINAL MAP                            │        │
│  │                                                         │        │
│  │  🟢(1)    🟢(2)    🟢(3)    🟡(4)    🟢(5)            │        │
│  │  All bins processed!                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Final Statistics:                                                  │
│  ✅ Collected: 42    🟡 Empty: 2    🔴 Damaged: 1                  │
│                                                                      │
│  [🏁 Complete Route] ← Click here                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ROUTE COMPLETION CONFIRMATION                     │
│                                                                      │
│  Complete route "Downtown Route A"?                                 │
│  • 42 bins collected successfully                                   │
│  • 2 bins marked empty                                              │
│  • 1 bin reported damaged                                           │
│                                                                      │
│  [Confirm]  [Cancel]                                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ [Confirm]
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ROUTE COMPLETED! 🎉                              │
│                                                                      │
│  ✅ Route completion report submitted                               │
│  ✅ Performance metrics recorded                                    │
│  ✅ Notifications sent to all bin owners                            │
│  ✅ Admins notified of completion                                   │
│                                                                      │
│  Summary:                                                           │
│  • Total time: 4 hours 23 minutes                                   │
│  • Average per bin: 5.8 minutes                                     │
│  • Collection rate: 93% (42/45)                                     │
│  • Issues reported: 1                                               │
│                                                                      │
│  [View Report]  [Start New Route]  [Return to Dashboard]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Parallel Processes During Collection

```
┌──────────────────────────────────────────────────────────────────┐
│                     MAIN COLLECTION FLOW                          │
│  Navigate → Scan → Mark Status → Move to Next → Repeat          │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│  TRACKING   │ │ PROGRESS    │ │  NOTIFICATIONS  │
│  SYSTEM     │ │ UPDATES     │ │  SYSTEM         │
├─────────────┤ ├─────────────┤ ├─────────────────┤
│ • GPS data  │ │ • Real-time │ │ • Instant send  │
│ • Location  │ │ • Percentage│ │ • Email alerts  │
│ • Distance  │ │ • Statistics│ │ • SMS alerts    │
│ • Time      │ │ • Visuals   │ │ • In-app msgs   │
└─────────────┘ └─────────────┘ └─────────────────┘
```

---

## Decision Tree: What Status to Choose?

```
                    ARRIVE AT BIN
                         │
                         ▼
              ┌──────────────────────┐
              │  Is bin accessible?  │
              └──────┬───────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
          YES                 NO
           │                   │
           ▼                   ▼
    ┌────────────┐      ┌──────────────┐
    │ Has waste? │      │ Report Issue │
    └─────┬──────┘      │ (Inaccessible)│
          │             └──────────────┘
    ┌─────┴─────┐
    │           │
   YES         NO
    │           │
    ▼           ▼
┌─────────┐  ┌──────────┐
│Collected│  │  Empty   │
└─────────┘  └──────────┘
    │
    ▼
┌────────────────┐
│ Is bin okay?   │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
  [DONE]  ┌──────────────┐
          │ Report Issue │
          │  (Damaged)   │
          └──────────────┘
```

---

## Notification Flow

```
                    STATUS MARKED
                         │
                         ▼
              ┌──────────────────────┐
              │  Create Notification  │
              │      Message         │
              └──────────┬───────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   BIN OWNER      │   │   ADMINISTRATORS │
    │                  │   │   (if issue)     │
    ├──────────────────┤   ├──────────────────┤
    │ 📧 Email         │   │ 📧 Email         │
    │ 📱 SMS           │   │ 📱 SMS           │
    │ 🔔 In-App Push   │   │ 🔔 In-App Alert  │
    │ 📋 Portal Update │   │ 📊 Dashboard     │
    └──────────────────┘   └──────────────────┘
              │                     │
              └──────────┬──────────┘
                         ▼
              ┌──────────────────────┐
              │  Delivery Confirmed  │
              │  Status Logged       │
              └──────────────────────┘
```

---

## Exception Report Workflow

```
        ISSUE DETECTED
              │
              ▼
┌──────────────────────────────┐
│  Open Exception Report Form  │
└────────────┬─────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌──────────┐
│ Take    │     │ Select   │
│ Photo   │ →   │ Issue    │
│ 📸      │     │ Type     │
└─────────┘     └────┬─────┘
                     ▼
              ┌──────────────┐
              │ Add Detailed │
              │ Description  │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │   Validate   │
              │   Required   │
              │   Fields     │
              └──────┬───────┘
                     │
              ┌──────┴───────┐
              │ All filled?  │
              └──────┬───────┘
                     │
        ┌────────────┴────────────┐
       YES                       NO
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│ Submit Report │         │ Show Error   │
└───────┬───────┘         │ "Fill all    │
        │                 │  required"   │
        ▼                 └──────────────┘
┌───────────────────────┐
│ Upload Photo to Cloud │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│ Create Support Ticket │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│ Send Notifications    │
│ • Bin Owner          │
│ • Administrators     │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│ Log in Database       │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│ Return to Collection  │
│ Move to Next Bin      │
└───────────────────────┘
```

---

## Progress Tracking System

```
START ROUTE (0%)
     │
     ▼
┌─────────────────────────────────────┐
│  For each bin processed:            │
│                                     │
│  Current: N                         │
│  Total: T                           │
│  Percentage: (N/T) × 100%          │
│                                     │
│  Status Counts:                     │
│  ✅ Collected: C                    │
│  🟡 Empty: E                        │
│  🔴 Damaged: D                      │
│                                     │
│  Validation: C + E + D = N         │
└──────────────┬──────────────────────┘
               │
               ▼
        Update Displays:
        • Progress Bar
        • Statistics Cards
        • Map Colors
        • Recent Feed
               │
               ▼
      ┌────────────────┐
      │ N = T?         │
      │ (All done?)    │
      └────────┬───────┘
               │
        ┌──────┴──────┐
       YES           NO
        │             │
        ▼             ▼
   [COMPLETE]    [CONTINUE]
   100%          (N/T)%
```

This visual workflow shows the complete end-to-end process for collectors!
