const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Database connection
const { connectDB, mongoose } = require('./config/db');
connectDB();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cmsRoutes = require('./routes/cmsRoutes');

// Error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Origin validator helper for CORS and Socket.io
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  // Allow localhost / 127.0.0.1 on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Allow any Vercel deployment URL
  if (origin.endsWith('.vercel.app')) return true;
  // Allow configured CLIENT_URL
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  // Allow all origins in non-production
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available globally
app.set('io', io);

// Socket handler
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Gzip compression for production performance
app.use(compression());

// Body parsers
// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected';
  res.json({
    success: true,
    message: 'FreelanceHub API is running 🚀',
    database: 'MongoDB Atlas',
    dbStatus,
    timestamp: new Date()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `\n${'='.repeat(50)}`.cyan.bold +
      `\n🚀 FreelanceHub Server running on port ${PORT}`.green.bold +
      `\n📊 Environment: ${process.env.NODE_ENV}`.yellow +
      `\n🌐 API: http://localhost:${PORT}/api`.blue +
      `\n${'='.repeat(50)}`.cyan.bold
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection:`, err);
});

module.exports = { app, server, io };
