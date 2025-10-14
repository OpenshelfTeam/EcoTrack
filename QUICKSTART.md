# 🚀 Quick Start Guide - EcoTrack

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

**Backend** - Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecotrack
JWT_SECRET=ecotrack_secret_2024
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Already configured in `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as a service)
# It should already be running

# Or start manually
mongod
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running at: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running at: http://localhost:5173

### Step 5: Test the Application

1. Open browser: http://localhost:5173
2. Click "Sign up" to create an account
3. Or use demo credentials (after creating test users):
   - Email: `test@resident.com`
   - Password: `password123`

## 📋 What You Built

### ✅ Backend Features
- ✅ RESTful API with Express
- ✅ MongoDB database with Mongoose
- ✅ JWT authentication
- ✅ Role-based authorization (Resident, Collector, Authority, Operator, Admin)
- ✅ 8 Data models (User, SmartBin, Route, Collection, Ticket, Payment, Notification, Feedback)
- ✅ 9 API route modules
- ✅ Complete CRUD operations
- ✅ Error handling middleware
- ✅ Password hashing with bcrypt

### ✅ Frontend Features
- ✅ React 19 with TypeScript
- ✅ Tailwind CSS 4 for styling
- ✅ React Router for navigation
- ✅ React Query for data fetching
- ✅ Protected routes with role-based access
- ✅ Authentication context
- ✅ Login/Register pages
- ✅ Dashboard with role-specific content
- ✅ Responsive layout with sidebar navigation
- ✅ Service layer for API calls

## 🎯 Next Steps

### 1. Create Test Users
Use an API client like Postman or Thunder Client to create test users:

```json
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "resident@test.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "resident"
}
```

Create users for each role:
- `resident@test.com` (role: resident)
- `collector@test.com` (role: collector)
- `authority@test.com` (role: authority)
- `operator@test.com` (role: operator)

### 2. Implement Additional Pages

Create more pages for each module:

**For Residents:**
- `pages/BinsPage.tsx` - View and manage assigned bins
- `pages/PickupsPage.tsx` - Schedule and track pickups
- `pages/PaymentsPage.tsx` - View bills and make payments
- `pages/TicketsPage.tsx` - Create and track support tickets

**For Collectors:**
- `pages/RoutesPage.tsx` - View assigned routes
- `pages/CollectionsPage.tsx` - Record collections

**For Authority/Admin:**
- `pages/AnalyticsPage.tsx` - System analytics
- `pages/ManageTicketsPage.tsx` - Manage all tickets
- `pages/UsersPage.tsx` - Manage users

### 3. Add More Features

**Smart Bin Features:**
```typescript
// Create a bin scanning component
// Add QR code scanning
// Show bin fill level with progress bars
// Display bin location on a map
```

**Payment Integration:**
```typescript
// Integrate payment gateway (Stripe, PayPal)
// Generate invoices
// Payment history and receipts
```

**Notifications:**
```typescript
// Real-time notifications with WebSocket
// Email notifications
// Push notifications
```

**Analytics:**
```typescript
// Charts with Recharts or Chart.js
// Collection efficiency metrics
// Waste reduction tracking
```

## 🔧 Development Commands

### Backend
```bash
npm start          # Production server
npm run dev        # Development with nodemon
```

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🐛 Common Issues & Solutions

### Issue: MongoDB connection error
**Solution:** Make sure MongoDB is running
```bash
# Check MongoDB status (Windows)
sc query MongoDB

# Start MongoDB service (Windows)
net start MongoDB
```

### Issue: Port already in use
**Solution:** Change ports in `.env` files or kill the process
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue: CORS errors
**Solution:** Verify `FRONTEND_URL` in backend `.env` matches your frontend URL

### Issue: Authentication not working
**Solution:** 
1. Check if JWT_SECRET is set in backend `.env`
2. Clear browser localStorage
3. Try registering a new user

## 📚 API Testing

Use these curl commands to test APIs:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"phone\":\"+1234567890\",\"role\":\"resident\"}"

# Login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Get user profile (replace TOKEN)
curl -X GET http://localhost:5000/api/auth/me -H "Authorization: Bearer TOKEN"

# Health check
curl http://localhost:5000/api/health
```

## 🎓 Learning Resources

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Express**: https://expressjs.com
- **MongoDB**: https://www.mongodb.com/docs/
- **React Query**: https://tanstack.com/query/latest

## 📞 Need Help?

1. Check the main README.md for detailed documentation
2. Review the backend/README.md for API details
3. Look at existing code examples in the project
4. Create an issue if you find bugs

## 🎉 Congratulations!

You now have a fully functional Smart Waste Management System! 

**What's working:**
- ✅ User authentication and authorization
- ✅ Role-based access control
- ✅ Database models for all entities
- ✅ RESTful API endpoints
- ✅ Modern React frontend
- ✅ Responsive UI with Tailwind CSS

**Time to build more features and make it your own!** 🚀
