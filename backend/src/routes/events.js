const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const { body, param, validationResult } = require('express-validator')

// Validation rules
const eventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('event_date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid event date format'),
  body('end_date')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Location cannot exceed 300 characters'),
]

// Auto-complete events past their end date
const autoCompleteEvents = async () => {
  try {
    const now = new Date().toISOString()
    await supabase
      .from('events')
      .update({ status: 'completed' })
      .lt('end_date', now)
      .neq('status', 'completed')
  } catch (err) {
    console.log('Auto-complete error:', err.message)
  }
}

// Get all events (public)
router.get('/', async (req, res) => {
  await autoCompleteEvents()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create event (Founder + Co-Founder only)
router.post('/', protect, requireRole('founder', 'co-founder'), eventValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { title, description, event_date, end_date, location } = req.body

  // Check duplicate event title on same date
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('title', title)
    .eq('event_date', event_date)
    .limit(1)

  if (existing && existing.length > 0) {
    return res.status(400).json({ error: 'An event with this title and date already exists.' })
  }

  const { data, error } = await supabase
    .from('events')
    .insert([{ title, description, event_date, end_date, location, status: 'upcoming' }])
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, data })
})

// Update event (Founder + Co-Founder only)
router.put('/:id', protect, requireRole('founder', 'co-founder'), async (req, res) => {
  const { title, description, event_date, end_date, location, status } = req.body

  if (!req.params.id) {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  const { data, error } = await supabase
    .from('events')
    .update({ title, description, event_date, end_date, location, status })
    .eq('id', req.params.id)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, data })
})

// Delete event (Founder only)
router.delete('/:id', protect, requireRole('founder'), async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, message: 'Event deleted!' })
})

module.exports = router