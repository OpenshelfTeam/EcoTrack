# EcoTrack Backend API

Backend API for the Smart Waste Management System built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for multiple user roles (Resident, Collector, Authority, Operator, Admin)
- **Smart Bin Management**: Track and manage smart waste bins
- **Collection Management**: Route assignment and waste collection tracking
- **Ticket System**: Issue reporting and resolution tracking
- **Payment System**: Service charge payments and billing
- **Notification System**: Real-time notifications for users
- **Feedback System**: Collect and manage user feedback
- **Analytics**: Dashboard analytics for authorities

## Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
copy .env.example .env
```

3. Update the `.env` file with your configuration:
- Set your MongoDB connection string
- Set your JWT secret
- Configure email settings (optional)

4. Start MongoDB (make sure MongoDB is running on your system)

5. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Users
- `GET /api/users` - Get all users (Admin, Authority, Operator)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Smart Bins
- `GET /api/smart-bins` - Get all smart bins
- `POST /api/smart-bins` - Create smart bin (Operator, Admin)
- `GET /api/smart-bins/:id` - Get single smart bin
- `PUT /api/smart-bins/:id` - Update smart bin
- `DELETE /api/smart-bins/:id` - Delete smart bin (Admin)
- `POST /api/smart-bins/:id/assign` - Assign bin to resident

### Collections
- `GET /api/collections` - Get all collection records
- `POST /api/collections` - Create collection record (Collector)
- `GET /api/collections/routes` - Get all routes
- `POST /api/collections/routes` - Create route (Authority, Operator)

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get single ticket
- `PUT /api/tickets/:id` - Update ticket (Authority, Operator, Admin)

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Feedback
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Create feedback

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics (Authority, Operator, Admin)

## User Roles

1. **Resident**: Can register, request pickups, view schedules, make payments, submit feedback
2. **Collector**: Can view assigned routes, record collections, report exceptions
3. **Authority**: Can manage tickets, monitor operations, view analytics
4. **Operator**: Can assign bins, manage residents, verify payments
5. **Admin**: Full system access

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── auth.controller.js    # Authentication controllers
│   ├── user.controller.js    # User management controllers
│   ├── smartBin.controller.js
│   ├── collection.controller.js
│   ├── ticket.controller.js
│   ├── payment.controller.js
│   ├── notification.controller.js
│   └── feedback.controller.js
├── middleware/
│   └── auth.middleware.js    # JWT & role authorization
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
├── .gitignore
├── package.json
└── server.js                 # Entry point
```

## Development

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Environment Variables

Required environment variables:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request
