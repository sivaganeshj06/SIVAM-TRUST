const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
require('dotenv').config()

const app = express()

// ===== SECURITY HEADERS =====
app.use(helmet())

// ===== CORS =====
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ===== LOGGING =====
app.use(morgan('dev'))

// ===== BODY PARSING =====
app.use(express.json({ limit: '10kb' })) // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ===== HTTP PARAMETER POLLUTION PROTECTION =====
app.use(hpp())

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

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ message: 'Trust Website API Running ✅', status: 'healthy' })
})

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`)
})