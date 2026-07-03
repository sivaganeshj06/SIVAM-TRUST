const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const { body, param, validationResult } = require('express-validator')
const auditLogger = require('../utils/logger')

// Validation rules
const eventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('event_date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid event date format'),
  body('end_date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid end date format'),
  body('location')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 }).withMessage('Location cannot exceed 300 characters'),
]

const eventUpdateValidation = [
  ...eventValidation,
  body('status')
    .optional()
    .trim()
    .isIn(['upcoming', 'completed', 'cancelled']).withMessage('Invalid status'),
]

const validateEventId = [
  param('id').isUUID().withMessage('Invalid event ID format')
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
    auditLogger.error('AUTO_COMPLETE_EVENTS_FAILED', { error: err.message });
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

  auditLogger.info('EVENT_CREATED', { creatorId: req.user.id, eventId: data[0].id, title });

  if (req.user.role !== 'founder') {
    try {
      const { createNotificationForRole } = require('../utils/notificationService');
      await createNotificationForRole('founder', 'event', 'New Event Created', `Co-founder ${req.user.name} created a new event: "${title}".`);
    } catch (err) {
      auditLogger.error('EVENT_NOTIFICATION_FAILED', { error: err.message });
    }
  }

  res.json({ success: true, data })
})

// Update event (Founder + Co-Founder only)
router.put('/:id', protect, requireRole('founder', 'co-founder'), validateEventId, eventUpdateValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { title, description, event_date, end_date, location, status } = req.body

  const { data, error } = await supabase
    .from('events')
    .update({ title, description, event_date, end_date, location, status })
    .eq('id', req.params.id)
    .select()

  auditLogger.info('EVENT_UPDATED', { creatorId: req.user.id, eventId: req.params.id });

  if (req.user.role !== 'founder') {
    try {
      const { createNotificationForRole } = require('../utils/notificationService');
      await createNotificationForRole('founder', 'event', 'Event Updated', `Co-founder ${req.user.name} updated event: "${title}".`);
    } catch (err) {
      auditLogger.error('EVENT_NOTIFICATION_FAILED', { error: err.message });
    }
  }

  res.json({ success: true, data })
})

// Delete event (Founder only)
router.delete('/:id', protect, requireRole('founder'), validateEventId, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  
  auditLogger.info('EVENT_DELETED', { creatorId: req.user.id, eventId: req.params.id });
  res.json({ success: true, message: 'Event deleted!' })
})

module.exports = router