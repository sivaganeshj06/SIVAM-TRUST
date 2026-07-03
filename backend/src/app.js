const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
require('dotenv').config()

const auditLogger = require('./utils/logger')
const { sanitizeMiddleware, errorResponder } = require('./middleware/securityMiddleware')

const app = express()

// ===== SECURITY HEADERS (HELMET) =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

// ===== CUSTOM COOKIE PARSER MIDDLEWARE =====
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
  }
  next();
});

// ===== CORS SECURE CONFIGURATION =====
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim());

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  let corsOptions;
  if (!origin) {
    corsOptions = { origin: true };
  } else if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
    corsOptions = { origin: true };
  } else {
    auditLogger.warn('CORS_BLOCKED', { origin, ip: req.ip });
    corsOptions = { origin: false };
  }
  corsOptions.methods = ['GET', 'POST', 'PUT', 'DELETE'];
  corsOptions.allowedHeaders = ['Content-Type', 'Authorization'];
  corsOptions.credentials = true;
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate))

// ===== LOGGING =====
app.use(morgan('dev'))

// ===== BODY PARSING WITH SIZES LIMIT =====
app.use(express.json({ limit: '10kb' })) // Limit body size to 10KB
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ===== HTTP PARAMETER POLLUTION PROTECTION =====
app.use(hpp())

// ===== INPUT SANITIZATION =====
app.use(sanitizeMiddleware)

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
})

const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many donation requests, please try again later.' }
})

app.use('/api/', limiter)

// ===== ROUTES =====
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/donations', donationLimiter, require('./routes/donations'))
app.use('/api/events', require('./routes/events'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/photos', require('./routes/photos'))
app.use('/api/members', require('./routes/members'))

const { protect } = require('./middleware/authMiddleware')
app.use('/api/notifications', protect, require('./routes/notifications'))

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ message: 'Trust Website API Running ✅', status: 'healthy' })
})

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ===== GLOBAL ERROR HANDLER =====
app.use(errorResponder)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  auditLogger.info('SERVER_STARTED', { port: PORT, env: process.env.NODE_ENV });
  console.log(`Server running on port ${PORT} 🚀`)
})