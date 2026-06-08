const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect } = require('../middleware/authMiddleware')

// Get all events
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create event (admin only)
router.post('/', protect, async (req, res) => {
  const { title, description, event_date, location } = req.body
  const { data, error } = await supabase
    .from('events')
    .insert([{ title, description, event_date, location }])

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, data })
})

// Delete event (admin only)
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, message: 'Event deleted!' })
})

module.exports = router