const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect } = require('../middleware/authMiddleware')

// Submit donation
router.post('/', async (req, res) => {
  const { donor_name, email, phone, amount } = req.body
  
  if (!donor_name || !email || !amount)
    return res.status(400).json({ error: 'Required fields missing' })

  const { data, error } = await supabase
    .from('donations')
    .insert([{ donor_name, email, phone, amount, status: 'pending' }])
    .select()

  if (error) {
    console.log('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }
  
  res.json({ success: true, message: 'Donation recorded!' })
})

// Get all donations (admin only)
router.get('/', protect, async (req, res) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router