# 🧪 Testing Guide - EcoTrack

## Testing Your Smart Waste Management System

This guide will help you test all the features of your EcoTrack application.

## 📋 Pre-Testing Setup

### 1. Start MongoDB
```bash
# Windows - MongoDB should be running as a service
# Verify it's running:
sc query MongoDB
```

### 2. Seed the Database
```bash
cd backend
npm run seed
```

This will create:
- ✅ 5 test users (one for each role)
- ✅ 3 smart bins
- ✅ 1 collection route
- ✅ 2 sample tickets

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🔐 Test User Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Resident | resident@test.com | password123 | End user with bins |
| Collector | collector@test.com | password123 | Waste collector |
| Authority | authority@test.com | password123 | City authority |
| Operator | operator@test.com | password123 | System operator |
| Admin | admin@test.com | password123 | System admin |

## 🧪 Test Cases

### Test 1: Authentication Flow

#### 1.1 Registration
1. Open http://localhost:5173
2. Click "Sign up"
3. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: newuser@test.com
   - Phone: +1234567899
   - Password: password123
   - Role: Resident
4. Click "Create Account"
5. ✅ Should redirect to dashboard
6. ✅ Should see welcome message with your name

#### 1.2 Login
1. Logout (click logout button in header)
2. Click "Sign in" 
3. Enter credentials:
   - Email: resident@test.com
   - Password: password123
4. Click "Sign In"
5. ✅ Should redirect to dashboard
6. ✅ Should see "Welcome back, John!"

#### 1.3 Protected Routes
1. While logged out, try to access: http://localhost:5173/dashboard
2. ✅ Should redirect to login page
3. After login, try accessing different pages
4. ✅ Should be able to access allowed pages based on role

### Test 2: API Endpoints

#### 2.1 Health Check
```bash
curl http://localhost:5000/api/health
```
✅ Should return: `{"status":"OK","message":"EcoTrack API is running",...}`

#### 2.2 User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\":\"API\",
    \"lastName\":\"Test\",
    \"email\":\"apitest@test.com\",
    \"password\":\"password123\",
    \"phone\":\"+1234567895\",
    \"role\":\"resident\"
  }"
```
✅ Should return user data with token

#### 2.3 User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"resident@test.com\",
    \"password\":\"password123\"
  }"
```
✅ Should return user data with token
💾 Save the token for next requests

#### 2.4 Get User Profile
```bash
# Replace YOUR_TOKEN with the token from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Should return user profile

#### 2.5 Get Smart Bins
```bash
curl -X GET http://localhost:5000/api/smart-bins \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Should return list of bins

#### 2.6 Get Tickets
```bash
curl -X GET http://localhost:5000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Should return list of tickets

### Test 3: Role-Based Access

#### 3.1 Resident Access
Login as: resident@test.com / password123

**Should See:**
- ✅ Dashboard
- ✅ My Bins
- ✅ Pickups
- ✅ Tickets
- ✅ Payments
- ✅ Feedback

**Should NOT See:**
- ❌ Analytics
- ❌ Manage Users
- ❌ System Routes

#### 3.2 Collector Access
Login as: collector@test.com / password123

**Should See:**
- ✅ Dashboard
- ✅ My Routes
- ✅ Collections

**Should NOT See:**
- ❌ Analytics
- ❌ Manage Users
- ❌ Payment Management

#### 3.3 Authority Access
Login as: authority@test.com / password123

**Should See:**
- ✅ Dashboard
- ✅ Analytics
- ✅ All Tickets
- ✅ All Collections
- ✅ All Bins
- ✅ Feedback

#### 3.4 Operator Access
Login as: operator@test.com / password123

**Should See:**
- ✅ Dashboard
- ✅ Bins Management
- ✅ Users Management
- ✅ Routes
- ✅ Payments

#### 3.5 Admin Access
Login as: admin@test.com / password123

**Should See:**
- ✅ Everything
- ✅ All modules
- ✅ Full system access

### Test 4: Dashboard Statistics

1. Login with any account
2. Navigate to Dashboard
3. ✅ Should see stats cards (numbers may vary)
4. ✅ Should see recent activity section
5. ✅ Stats should be relevant to user role

### Test 5: Responsive Design

1. Open the application
2. Resize browser window to different sizes:
   - Desktop (1920px)
   - Laptop (1366px)
   - Tablet (768px)
   - Mobile (375px)
3. ✅ Sidebar should collapse on mobile
4. ✅ Menu icon should appear on mobile
5. ✅ All content should be readable
6. ✅ No horizontal scrolling

### Test 6: Navigation

1. Login as any user
2. Click each menu item in the sidebar
3. ✅ URL should change
4. ✅ Active menu item should be highlighted
5. ✅ Page title should update

### Test 7: Logout

1. Click logout button (top right)
2. ✅ Should redirect to login page
3. ✅ Token should be removed from localStorage
4. ✅ Cannot access protected routes

## 🔍 Testing with Developer Tools

### Check API Calls

1. Open browser DevTools (F12)
2. Go to Network tab
3. Login to the application
4. ✅ Should see POST request to `/api/auth/login`
5. ✅ Response should contain token
6. Navigate to different pages
7. ✅ Should see API requests with Authorization header

### Check Local Storage

1. Open DevTools (F12)
2. Go to Application tab → Local Storage
3. After login, check:
   - ✅ `token` key exists
   - ✅ `user` key exists with user data

### Check Console for Errors

1. Open DevTools Console
2. Navigate through the app
3. ✅ No red errors should appear
4. ✅ API calls should succeed

## 🧰 Testing Backend Directly

### Using VS Code REST Client

Create a file `test.http`:

```http
### Health Check
GET http://localhost:5000/api/health

### Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test2@test.com",
  "password": "password123",
  "phone": "+1234567896",
  "role": "resident"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "resident@test.com",
  "password": "password123"
}

### Get Profile (Replace TOKEN)
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN

### Get Bins
GET http://localhost:5000/api/smart-bins
Authorization: Bearer YOUR_TOKEN

### Get Tickets
GET http://localhost:5000/api/tickets
Authorization: Bearer YOUR_TOKEN
```

### Using Postman

1. Import the API collection
2. Set environment variable: `baseUrl = http://localhost:5000/api`
3. Test each endpoint
4. Use the returned token in Authorization header

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check MongoDB status
sc query MongoDB

# Start MongoDB if not running
net start MongoDB
```

### Issue: "JWT token expired"
**Solution:** 
- Logout and login again
- Or clear localStorage and login

### Issue: "Port already in use"
**Solution:**
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "CORS error"
**Solution:** 
- Check backend `.env` has correct `FRONTEND_URL`
- Restart backend server

### Issue: "401 Unauthorized"
**Solution:**
- Check if token is being sent in Authorization header
- Verify token hasn't expired
- Try logging in again

## ✅ Test Checklist

Before considering your app ready:

- [ ] All 5 user roles can register
- [ ] All 5 user roles can login
- [ ] Protected routes work correctly
- [ ] Role-based access control works
- [ ] Dashboard shows correct data for each role
- [ ] API endpoints respond correctly
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Logout works properly
- [ ] Navigation works smoothly
- [ ] MongoDB connection is stable
- [ ] Backend API is accessible
- [ ] Frontend communicates with backend

## 📊 Performance Testing

### Check Response Times

1. Open Network tab in DevTools
2. Make API calls
3. ✅ API responses should be < 1 second
4. ✅ Page loads should be < 2 seconds

### Check Memory Usage

1. Open Performance tab in DevTools
2. Record a session
3. Navigate through pages
4. ✅ No memory leaks
5. ✅ Stable memory usage

## 🎉 Success Criteria

Your app is working correctly if:

1. ✅ All test users can login
2. ✅ Each role sees appropriate menu items
3. ✅ API calls return expected data
4. ✅ No errors in console
5. ✅ Responsive on all screen sizes
6. ✅ Protected routes are secure
7. ✅ Data persists in MongoDB
8. ✅ Authentication flow works smoothly

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________

Authentication Tests:
[ ] Registration works
[ ] Login works
[ ] Logout works
[ ] Protected routes work

API Tests:
[ ] Health check responds
[ ] All endpoints accessible
[ ] Authentication required
[ ] Correct responses

Role Tests:
[ ] Resident access correct
[ ] Collector access correct
[ ] Authority access correct
[ ] Operator access correct
[ ] Admin access correct

UI Tests:
[ ] Dashboard renders
[ ] Navigation works
[ ] Responsive design works
[ ] No visual bugs

Notes:
_________________________________
_________________________________
```

Happy Testing! 🚀
