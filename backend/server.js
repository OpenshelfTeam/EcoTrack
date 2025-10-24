import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import smartBinRoutes from './routes/smartBin.routes.js';
import binRequestRoutes from './routes/binRequest.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import pickupRoutes from './routes/pickup.routes.js';
import routeRoutes from './routes/route.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/smart-bins', smartBinRoutes);
app.use('/api/bin-requests', binRequestRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection && mongoose.connection.readyState;
  const dbHost = mongoose.connection && mongoose.connection.host;

  res.status(200).json({ 
    status: 'OK', 
    message: 'EcoTrack API is running',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    nodeVersion: process.version,
    db: {
      readyState: dbState,
      host: dbHost || null
    },
    checkUrl: '/api/check'
  });
});

// Route checker
app.get('/api/check', (req, res) => {
  const { path } = req.query || {};
  
  const routes = [];
  if (app && app._router && Array.isArray(app._router.stack)) {
    app._router.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
        routes.push({ path: layer.route.path, methods });
      }
      
      if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach((nested) => {
          if (nested.route && nested.route.path) {
            const methods = Object.keys(nested.route.methods || {}).map(m => m.toUpperCase());
            routes.push({ path: nested.route.path, methods });
          }
        });
      }
    });
  }
  
  const info = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    nodeVersion: process.version,
    dbReadyState: mongoose.connection && mongoose.connection.readyState
  };
  
  if (path) {
    const requested = String(path);
    const matches = routes.filter(r => r.path === requested || (Array.isArray(r.path) && r.path.includes(requested)));
    info.requestedPath = requested;
    info.exists = matches.length > 0;
    info.matches = matches;
  } else {
    info.availableRoutes = routes.slice(0, 200);
    info.totalRoutes = routes.length;
  }
  
  res.status(200).json(info);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server only if not in test mode
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for testing
export default app;
