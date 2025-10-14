# 🎨 System Architecture Diagrams

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Resident   │  │  Collector   │  │  Authority   │      │
│  │   Web App    │  │   Web App    │  │   Dashboard  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                     SERVER LAYER                              │
├────────────────────────────┼──────────────────────────────────┤
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Express.js API Server                      │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │          Middleware Layer                     │   │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │    │
│  │  │  │   CORS   │  │   JWT    │  │  Error   │  │   │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘  │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │          API Routes Layer                     │   │    │
│  │  │  Auth  Users  Bins  Collections  Tickets     │   │    │
│  │  │  Payments  Notifications  Feedback  Analytics│   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │         Controllers Layer                     │   │    │
│  │  │  Business Logic & Request Handling           │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │          Models Layer                         │   │    │
│  │  │  MongoDB Schema Definitions                   │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └────────────────────┬──────────────────────────────┘    │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ MongoDB Driver
                        │
┌───────────────────────┼─────────────────────────────────────┐
│                  DATABASE LAYER                             │
├───────────────────────┼─────────────────────────────────────┤
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              MongoDB Database                        │  │
│  │                                                       │  │
│  │  Collections:                                        │  │
│  │  • users                                             │  │
│  │  • smartbins                                         │  │
│  │  • routes                                            │  │
│  │  • collectionrecords                                 │  │
│  │  • tickets                                           │  │
│  │  • payments                                          │  │
│  │  • notifications                                     │  │
│  │  • feedbacks                                         │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Authentication Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │                │ Database │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  1. POST /auth/login      │                           │
     │  { email, password }      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  2. Find user by email    │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  3. Return user + hash    │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │  4. Compare password      │
     │                           │     with bcrypt           │
     │                           │                           │
     │                           │  5. Generate JWT token    │
     │                           │     with user ID          │
     │                           │                           │
     │  6. Return token + user   │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │  7. Store token in        │                           │
     │     localStorage          │                           │
     │                           │                           │
     │                           │                           │
     │  8. API Request with      │                           │
     │  Authorization: Bearer    │                           │
     │  <token>                  │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  9. Verify JWT            │
     │                           │                           │
     │                           │  10. Get user from DB     │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  11. Return user          │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │  12. Check role/perms     │
     │                           │                           │
     │  13. Return data          │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

## 3. User Role Hierarchy

```
                    ┌──────────┐
                    │  Admin   │
                    │ (Level 5)│
                    └────┬─────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      ┌─────▼─────┐            ┌─────▼─────┐
      │ Authority │            │ Operator  │
      │ (Level 4) │            │ (Level 4) │
      └─────┬─────┘            └─────┬─────┘
            │                         │
            │                         │
            │                  ┌──────▼──────┐
            │                  │  Collector  │
            │                  │  (Level 3)  │
            │                  └──────┬──────┘
            │                         │
            └─────────┬───────────────┘
                      │
                ┌─────▼─────┐
                │ Resident  │
                │ (Level 1) │
                └───────────┘

Permissions:
• Admin: Full access to everything
• Authority: Monitor, manage tickets, view analytics
• Operator: Manage bins, users, payments, routes
• Collector: View routes, record collections
• Resident: Manage own bins, tickets, payments
```

## 4. Data Model Relationships

```
┌──────────────┐
│     User     │
│              │
│ • firstName  │
│ • email      │
│ • password   │
│ • role       │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  SmartBin    │  │   Ticket    │  │   Payment    │  │   Feedback  │
│              │  │             │  │              │  │             │
│ • binId      │  │ • title     │  │ • amount     │  │ • rating    │
│ • location   │  │ • status    │  │ • status     │  │ • message   │
│ • capacity   │  │ • priority  │  │ • method     │  │ • category  │
│ • status     │  └─────────────┘  └──────────────┘  └─────────────┘
│ assignedTo → │
└──────┬───────┘
       │
       │ N:M
       │
       ▼
┌──────────────┐       1:N       ┌──────────────────┐
│    Route     │◄─────────────────│ CollectionRecord │
│              │                  │                  │
│ • routeCode  │                  │ • wasteWeight    │
│ • area       │                  │ • status         │
│ • date       │                  │ • images         │
│ collector →  │                  │ route →          │
│ bins[] →     │                  │ bin →            │
└──────────────┘                  │ collector →      │
                                  └──────────────────┘

┌────────────────┐
│  Notification  │
│                │
│ • title        │
│ • message      │
│ • type         │
│ • status       │
│ recipient →    │
└────────────────┘
```

## 5. API Request Flow

```
Client Request
      │
      ▼
┌─────────────────────┐
│  CORS Middleware    │  ← Check origin
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Body Parser        │  ← Parse JSON
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Auth Middleware    │  ← Verify JWT (if protected route)
│  • Extract token    │
│  • Verify signature │
│  • Get user         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Role Check         │  ← Check permissions
│  (if required)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Route Handler      │  ← Match route
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Controller         │  ← Business logic
│  • Validate input   │
│  • Process request  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Model/Database     │  ← Data operations
│  • Query DB         │
│  • Transform data   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response           │  ← Send JSON
│  { success, data }  │
└─────────────────────┘
           │
           ▼
      Client
```

## 6. Frontend Component Tree

```
App.tsx
 │
 ├─ AuthProvider (Context)
 │   │
 │   └─ Router
 │       │
 │       ├─ Public Routes
 │       │   ├─ LoginPage
 │       │   └─ RegisterPage
 │       │
 │       └─ Protected Routes
 │           │
 │           └─ Layout
 │               ├─ Header
 │               │   ├─ Logo
 │               │   ├─ NotificationBell
 │               │   └─ UserMenu
 │               │
 │               ├─ Sidebar
 │               │   └─ Navigation
 │               │       ├─ Dashboard Link
 │               │       ├─ Profile Link
 │               │       └─ Role-specific Links
 │               │
 │               └─ Main Content
 │                   ├─ DashboardPage
 │                   │   ├─ WelcomeBanner
 │                   │   ├─ StatCards
 │                   │   └─ RecentActivity
 │                   │
 │                   ├─ BinsPage
 │                   ├─ TicketsPage
 │                   ├─ PaymentsPage
 │                   └─ ... (other pages)
```

## 7. State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
└───────────┬────────────────────────────┬────────────────┘
            │                            │
            │ useAuth()                  │ useQuery()
            │                            │
            ▼                            ▼
┌───────────────────┐          ┌───────────────────┐
│  AuthContext      │          │  React Query      │
│                   │          │                   │
│  • user           │          │  • Caching        │
│  • login()        │          │  • Auto-refetch   │
│  • logout()       │          │  • Loading states │
│  • isAuth         │          │  • Error handling │
└─────────┬─────────┘          └─────────┬─────────┘
          │                              │
          │ API Call                     │ API Call
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│                                                           │
│  auth.service.ts  bin.service.ts  ticket.service.ts     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Axios Instance (api.ts)             │   │
│  │  • Base URL                                      │   │
│  │  • Interceptors (add token, handle errors)      │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ HTTP Request
                            │
                            ▼
                    Backend API
```

## 8. Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │    Load Balancer     │
           │     (Optional)       │
           └──────────┬───────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐      ┌─────────────────┐
│  Frontend Server│      │  Backend Server │
│   (Vercel/      │      │   (Railway/     │
│    Netlify)     │      │    Render/AWS)  │
└─────────────────┘      └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  MongoDB Atlas  │
                         │   (Cloud DB)    │
                         └─────────────────┘
```

---

These diagrams illustrate the complete architecture and data flow of the EcoTrack system!
