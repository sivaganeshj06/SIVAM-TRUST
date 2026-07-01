const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const { body, validationResult } = require('express-validator')

// Validation rules
const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
]

// Send contact message (public)
router.post('/', contactValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { name, email, message } = req.body

  // Duplicate message check — same email within 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .gte('created_at', tenMinutesAgo)
    .limit(1)

  if (existing && existing.length > 0) {
    return res.status(400).json({
      error: 'You already sent a message recently. Please wait 10 minutes.'
    })
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([{ name, email, message }])
    .select()

  if (error) {
    console.log('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ success: true, message: 'Message sent successfully!' })
})

// Get all messages (Founder only)
router.get('/', protect, requireRole('founder'), async (req, res) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete message (Founder only)
router.delete('/:id', protect, requireRole('founder'), async (req, res) => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, message: 'Message deleted' })
})

module.exports = router