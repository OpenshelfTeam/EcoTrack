# 🌱 EcoTrack - Smart Waste Management System

A comprehensive waste management system with IoT-enabled smart bins, route optimization, and real-time tracking. Built with React, Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## ✨ Features

### 🧩 Core User Roles & Interfaces

The system supports four main actor types:

1. **Resident (Mobile/Web App)**
   - Register/login
   - Request waste pickup
   - Pay service charges
   - View pickup schedules
   - Receive notifications
   - Submit feedback

2. **Waste Collector (Mobile/Web)**
   - View assigned routes
   - Scan smart bins (QR/RFID)
   - Record collections
   - Flag issues/exceptions
   - Submit completion reports

3. **City Authority (Web Dashboard)**
   - View/manage tickets & complaints
   - Monitor operations
   - Assign teams
   - Track issue status
   - View analytics

4. **System Operator (Web Dashboard)**
   - Assign/deliver smart bins
   - Manage residents
   - Verify payments
   - Maintain inventory

### ⚙️ Functional Components

| Module | Description | Key Features |
|--------|-------------|--------------|
| **User Management** | Registration, authentication, profiles | JWT auth, role-based access |
| **Smart Bin Management** | Track and assign bins | QR/RFID, IoT integration ready |
| **Waste Collection** | Route assignment and tracking | Real-time updates, GPS |
| **Ticket System** | Issue reporting and resolution | Priority levels, status tracking |
| **Payment & Billing** | Service charge management | Multiple payment methods |
| **Notifications** | Real-time updates | In-app, email, SMS ready |
| **Feedback & Analytics** | User feedback and system analytics | Ratings, performance metrics |

## 🏗️ System Architecture

```
┌─────────────────┐
│  Frontend (React) │
│  - Web App      │
│  - Mobile Ready │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│  Backend (Node)  │
│  - Express API   │
│  - JWT Auth      │
└────────┬────────┘
         │
         │
┌────────▼────────┐
│  MongoDB        │
│  - User Data    │
│  - Collections  │
│  - Transactions │
└─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

## 📁 Project Structure

```
EcoTrack/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── bin.service.ts
│   │   │   ├── ticket.service.ts
│   │   │   ├── collection.service.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── feedback.service.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── backend/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── smartBin.controller.js
    │   ├── collection.controller.js
    │   ├── ticket.controller.js
    │   ├── payment.controller.js
    │   ├── notification.controller.js
    │   └── feedback.controller.js
    ├── middleware/
    │   └── auth.middleware.js
    ├── models/
    │   ├── User.model.js
    │   ├── SmartBin.model.js
    │   ├── Route.model.js
    │   ├── CollectionRecord.model.js
    │   ├── Ticket.model.js
    │   ├── Payment.model.js
    │   ├── Notification.model.js
    │   └── Feedback.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── smartBin.routes.js
    │   ├── collection.routes.js
    │   ├── ticket.routes.js
    │   ├── payment.routes.js
    │   ├── notification.routes.js
    │   ├── feedback.routes.js
    │   └── analytics.routes.js
    ├── .env.example
    ├── package.json
    └── server.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd EcoTrack
```

2. **Setup Backend**
```bash
cd backend
npm install
```

Create a `.env` file:
```bash
copy .env.example .env
```

Update the `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ecotrack
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

Start MongoDB and run the backend:
```bash
npm run dev
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:
```bash
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 👥 User Roles

### 1. Resident
- **Access**: Mobile app & web dashboard
- **Permissions**: View own data, request pickups, pay bills, submit feedback
- **Key Features**: Track bins, schedule pickups, payment management

### 2. Waste Collector
- **Access**: Mobile app & web dashboard
- **Permissions**: View assigned routes, record collections, report issues
- **Key Features**: Route navigation, bin scanning, exception reporting

### 3. City Authority
- **Access**: Web dashboard
- **Permissions**: Monitor operations, manage tickets, view analytics
- **Key Features**: System oversight, issue resolution, performance tracking

### 4. System Operator
- **Access**: Web dashboard
- **Permissions**: Manage bins, users, payments, inventory
- **Key Features**: Bin assignment, user management, payment verification

### 5. Admin
- **Access**: Full system access
- **Permissions**: All operations
- **Key Features**: System configuration, user management, full oversight

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Smart Bin Endpoints
- `GET /api/smart-bins` - Get all bins
- `POST /api/smart-bins` - Create bin (Operator, Admin)
- `GET /api/smart-bins/:id` - Get bin details
- `PUT /api/smart-bins/:id` - Update bin
- `POST /api/smart-bins/:id/assign` - Assign bin to resident

### Collection Endpoints
- `GET /api/collections` - Get collection records
- `POST /api/collections` - Create collection record (Collector)
- `GET /api/collections/routes` - Get routes
- `POST /api/collections/routes` - Create route (Authority, Operator)

### Ticket Endpoints
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket (Authority, Operator)

### Payment Endpoints
- `GET /api/payments` - Get payments
- `POST /api/payments` - Create payment

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Feedback Endpoints
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Submit feedback

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard stats (Authority, Admin)

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. User logs in with email/password
2. Server validates credentials and returns JWT
3. Client stores token in localStorage
4. Token is sent with each API request in Authorization header
5. Server validates token for protected routes

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role-Based Dashboards**: Customized interface for each user type
- **Real-time Updates**: Instant notifications and status changes
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Dark Mode Ready**: Easy to implement color scheme toggle

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📱 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] IoT sensor integration (waste level, temperature)
- [ ] Real-time GPS tracking
- [ ] Payment gateway integration
- [ ] Email/SMS notifications
- [ ] Advanced analytics and reporting
- [ ] Route optimization algorithm
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Development Team

Year 3 CSSE Project - Smart Waste Management System

## 📞 Support

For support, email support@ecotrack.com or create an issue in the repository.

---

**Built with ❤️ for a cleaner, greener future** 🌍
