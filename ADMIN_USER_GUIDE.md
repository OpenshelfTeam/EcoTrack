# Admin Dashboard - User Management Quick Guide

## How to Access User Management

### From Dashboard (Recommended)
When you log in as an **Admin** or **Operator**, you'll now see a beautiful **User Management** section on your dashboard.

### Visual Elements:

```
┌─────────────────────────────────────────────────────────────────────┐
│  👤 User Management                           [Manage Users →]      │
│  Manage system users, roles, and permissions                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ 👥 Total     │  │ ✓ Active     │  │ 🆕 New Month │             │
│  │   Users      │  │   Users      │  │              │             │
│  │   245        │  │   238        │  │   +12        │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  [🛡️ 5 Admins] [👷 32 Collectors] [👨‍👩‍👧 198 Residents] [⚙️ 10 Operators] │
└─────────────────────────────────────────────────────────────────────┘
```

## User Management Page Features

### 1. Top Navigation
```
User Management
Manage system users and their access levels

[+ Add New User]
```

### 2. Statistics Overview
Real-time statistics cards showing user distribution:
- Total Users
- Active Users  
- Admins
- Collectors
- Residents

### 3. Search & Filter Bar
```
┌────────────────────────────────────────────────┐
│ 🔍 Search by name, email, or user ID...       │
└────────────────────────────────────────────────┘  [🔧 Filters]

When filters are expanded:
Role: [All Roles ▼]   Status: [All Status ▼]
```

### 4. User Table

```
┌─────────────┬──────────────────┬──────────┬────────┬────────────┬─────────┐
│ User        │ Contact          │ Role     │ Status │ Last Active│ Actions │
├─────────────┼──────────────────┼──────────┼────────┼────────────┼─────────┤
│ JD          │ 📧 john@mail.com │ 🛡️ Admin │ ✅ Actv│ 2h ago     │ ✓ ✏️ 🗑️  │
│ John Doe    │ 📱 +1-555-0123   │          │        │            │         │
├─────────────┼──────────────────┼──────────┼────────┼────────────┼─────────┤
│ JS          │ 📧 jane@mail.com │ 👷 Coll  │ ✅ Actv│ 1d ago     │ ✓ ✏️ 🗑️  │
│ Jane Smith  │ 📱 +1-555-0124   │          │        │            │         │
└─────────────┴──────────────────┴──────────┴────────┴────────────┴─────────┘
```

## Actions Available

### ✅ Activate/Deactivate User
- **Green checkmark** (✓): Deactivate an active user
- **Red X**: Activate an inactive user
- Instantly toggles user access to the system

### ✏️ Edit User
Opens a modal with all user details:
- First Name & Last Name
- Email & Phone
- Role selection
- Full address information
- Save changes instantly

### 🗑️ Delete User
- Shows confirmation dialog
- **Warning**: Cannot be undone
- Permanently removes user from system

### ➕ Add New User
Click the "Add New User" button to create a new account:
1. Enter user details
2. Select role (Resident, Collector, Admin, Operator)
3. Fill address information
4. User is created immediately

## Role Badge Colors

Visual identification for quick scanning:
- 🟣 **Purple**: Admin (full system access)
- 🔵 **Blue**: Collector (waste collection staff)
- 🟢 **Green**: Resident (regular users)
- 🟠 **Orange**: Operator (operations staff)
- ⚪ **Gray**: Authority (oversight roles)

## Status Badges

- 🟢 **Green "Active"**: User can log in and use the system
- 🔴 **Red "Inactive"**: User account is disabled

## Quick Actions from Dashboard

The User Management card on your dashboard provides:
1. **Quick Statistics**: At-a-glance user counts
2. **Role Distribution**: Visual breakdown by role
3. **Growth Metrics**: New user trends
4. **Direct Access**: One-click navigation to full management page

## Search Tips

The search bar is smart and searches across:
- ✅ First name
- ✅ Last name  
- ✅ Email address
- ✅ User ID

**Example searches:**
- "john" → Finds John Doe, John Smith, johnsmith@mail.com
- "@gmail" → Finds all Gmail users
- "555" → Finds users with 555 in phone or ID

## Filter Examples

### Scenario 1: Find all inactive collectors
1. Click "Filters" button
2. Role: Select "Collector"
3. Status: Select "Inactive"
4. Results show only inactive collectors

### Scenario 2: View all admins
1. Click "Filters"
2. Role: Select "Admin"
3. Status: Leave as "All Status"
4. See all administrators

## Keyboard Shortcuts (Power User Tips)

- **Search**: Click in search box and start typing
- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Escape**: Close modals

## Mobile Responsive

The User Management interface adapts to all screen sizes:
- **Desktop**: Full table view with all columns
- **Tablet**: Optimized layout with wrapped elements
- **Mobile**: Card-style view for easy scrolling

## Real-time Updates

- **Auto-refresh**: Dashboard stats update every 60 seconds
- **Instant feedback**: All actions show immediate results
- **Live counts**: User counts update after every change

## Safety Features

✅ **Confirmation dialogs** for destructive actions  
✅ **Form validation** prevents invalid data  
✅ **Role protection** ensures only admins/operators have access  
✅ **Undo protection** warns about permanent deletions  

---

**Pro Tip**: Use the dashboard User Management card for quick stats, then click "Manage Users" when you need to perform detailed user operations!
