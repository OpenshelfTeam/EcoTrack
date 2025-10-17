# User Management Feature - Admin & Operator Access

## Overview
The User Management feature provides comprehensive tools for administrators and operators to manage all system users, including residents, collectors, operators, and other administrators.

## Access Control
- **Admin Role**: Full access to all user management features
- **Operator Role**: Full access to all user management features
- **Other Roles**: No access (protected route)

## Features

### 1. Dashboard Integration
The admin/operator dashboard now includes a dedicated **User Management Section** with:
- **Total Users**: Display of all registered users in the system
- **Active Users**: Count of currently active users
- **New This Month**: Growth metrics showing new user registrations
- **Role Breakdown**: Visual cards showing:
  - Number of Admins
  - Number of Collectors
  - Number of Residents
  - Number of Operators

### 2. User Management Page (`/users`)

#### Search & Filter Capabilities
- **Search Bar**: Search users by:
  - Full name (first name + last name)
  - Email address
  - User ID
  
- **Advanced Filters**:
  - **Role Filter**: Filter by admin, collector, resident, operator, or authority
  - **Status Filter**: Filter by active or inactive users

#### Statistics Dashboard
Real-time statistics cards showing:
- Total Users
- Active Users
- Number of Admins
- Number of Collectors
- Number of Residents

#### User Table
Comprehensive table view with columns for:
- **User Info**: Avatar, full name, and user ID
- **Contact Details**: Email and phone number
- **Role**: Visual badge showing user role with icon
- **Status**: Active/Inactive badge
- **Last Active**: Timestamp of last activity
- **Actions**: Quick action buttons

#### CRUD Operations

##### Create User
- Click "Add New User" button
- Fill in required fields:
  - First Name
  - Last Name
  - Email
  - Phone
  - Role (Resident, Collector, Admin, Operator)
  - Address (Street, City, State, Zip Code)
- Submit to create new user account

##### Update User
- Click the **Edit** (pencil icon) button on any user row
- Modal opens with pre-filled user information
- Modify any fields as needed
- Save changes to update user profile

##### Toggle User Status
- Click the **Activate/Deactivate** (checkmark/X icon) button
- Active users can be deactivated (prevents login)
- Inactive users can be reactivated

##### Delete User
- Click the **Delete** (trash icon) button on any user row
- Confirmation modal appears
- Confirm deletion to permanently remove user
- ⚠️ **Warning**: This action cannot be undone

### 3. Navigation
Access User Management through:
1. **Dashboard Quick Access**: Click "Manage Users" button in the User Management section
2. **Sidebar Navigation**: Click "Users" in the main navigation menu (admin/operator only)

## Technical Implementation

### Frontend Components
- **File**: `/frontend/src/pages/UsersPage.tsx`
- **Framework**: React + TypeScript
- **State Management**: React Query (TanStack Query)
- **Styling**: TailwindCSS with custom gradients and animations

### Backend API Endpoints
- **GET** `/api/users` - Get all users with optional filters
- **GET** `/api/users/:id` - Get single user details
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user information
- **PUT** `/api/users/:id/role` - Update user role
- **PUT** `/api/users/:id/activate` - Activate user account
- **PUT** `/api/users/:id/deactivate` - Deactivate user account
- **DELETE** `/api/users/:id` - Delete user permanently

### Analytics Integration
The dashboard stats now include detailed user metrics:
```javascript
users: {
  total: number,          // Total registered users
  change: number,         // Percentage change from last month
  admins: number,         // Count of admin users
  collectors: number,     // Count of collector users
  residents: number,      // Count of resident users
  operators: number,      // Count of operator users
  authorities: number     // Count of authority users
}
```

## User Interface Features

### Modern Design Elements
- Gradient backgrounds with glass morphism effects
- Smooth animations and transitions
- Responsive design for all screen sizes
- Loading skeletons during data fetch
- Interactive hover effects
- Color-coded role badges
- Real-time statistics updates

### User Experience
- **Auto-refresh**: Dashboard statistics refresh every 60 seconds
- **Instant feedback**: Success/error alerts for all operations
- **Validation**: Form validation prevents invalid data entry
- **Confirmation dialogs**: Prevent accidental deletions
- **Search debouncing**: Efficient search as you type
- **Filter persistence**: Filters remain active during session

## Security Considerations
- Route protection ensures only admin/operator access
- Backend middleware validates user permissions
- Password fields are not exposed in edit mode (security)
- Audit logging for user management actions
- Role changes require appropriate permissions

## Future Enhancements
Potential improvements for future versions:
- Bulk user operations (import/export CSV)
- Email verification workflow
- Password reset functionality from admin panel
- User activity logs and audit trail
- Advanced analytics (login frequency, engagement metrics)
- Role-based permission customization
- Two-factor authentication management

## Usage Examples

### Example 1: Add New Collector
1. Navigate to Users page
2. Click "Add New User"
3. Fill in:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john.smith@ecotrack.com"
   - Phone: "+1 555-0123"
   - Role: "Collector"
   - Address details
4. Click "Add User"
5. New collector account is created

### Example 2: Deactivate Inactive User
1. Search for user by email
2. Locate user in table
3. Click red X icon (Deactivate)
4. User account is immediately deactivated
5. User cannot log in until reactivated

### Example 3: Update User Role
1. Find user in table
2. Click Edit icon
3. Change role from "Resident" to "Collector"
4. Click "Save Changes"
5. User's role is updated system-wide

## Screenshots Reference
Key UI components:
- User Management Dashboard Card (on main dashboard)
- User Statistics Cards
- User Table with Actions
- Add/Edit User Modal
- Delete Confirmation Dialog
- Search and Filter Bar

---

**Last Updated**: October 16, 2025  
**Version**: 1.0  
**Feature Status**: ✅ Complete and Production Ready
