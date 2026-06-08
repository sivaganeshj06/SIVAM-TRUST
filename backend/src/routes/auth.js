const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ token: data.session.access_token, user: data.user })
})

// Logout
router.post('/logout', async (req, res) => {
  await supabase.auth.signOut()
  res.json({ success: true })
})

module.exports = router