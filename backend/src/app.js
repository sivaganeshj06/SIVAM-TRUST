const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 min
  message: { error: 'Too many requests, please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later.' }
})

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use('/api/', limiter)

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/donations', require('./routes/donations'))
app.use('/api/events', require('./routes/events'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/photos', require('./routes/photos'))

app.get('/', (req, res) => {
  res.json({ message: 'Trust Website API Running ✅' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`)
})