const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect } = require('../middleware/authMiddleware')

// Send contact message
router.post('/', async (req, res) => {
  const { name, email, message } = req.body
  if (!name || !email || !message)
    return res.status(400).json({ error: 'All fields required' })

  const { data, error } = await supabase
    .from('contacts')
    .insert([{ name, email, message }])
    .select()

  if (error) {
    console.log('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }
  res.json({ success: true, message: 'Message sent!' })
})

// Get all messages (admin only)
router.get('/', protect, async (req, res) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router