const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

router.post('/login', async (req, res) => {
  const { reference_number, password } = req.body

  if (!reference_number || !password)
    return res.status(400).json({ error: 'Reference number and password are required' })

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('reference_number', reference_number)
    .eq('status', 'active')
    .single()

  if (error || !member) {
    console.log('Member not found:', error)
    return res.status(401).json({ error: 'Invalid reference number or password' })
  }

  console.log('Password entered:', password)
  console.log('Hash in DB:', member.password_hash)

  const isMatch = await bcrypt.compare(password, member.password_hash)
  console.log('Match result:', isMatch)

  if (!isMatch)
    return res.status(401).json({ error: 'Invalid reference number or password' })

  const token = jwt.sign(
    { id: member.id, name: member.name, role: member.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  // Send login notification to Founder (skip for founder login)
  if (member.role !== 'founder') {
    try {
      const { sendLoginNotification } = require('../utils/mailer')
      sendLoginNotification({
        name: member.name,
        role: member.role,
        loginTime: new Date().toLocaleString('en-IN'),
        device: req.headers['user-agent'],
        ip: req.ip
      })
    } catch (e) {
      console.log('Notification error:', e.message)
    }
  }

  res.json({
    token,
    user: {
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      photo_url: member.photo_url
    }
  })
})

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' })
})

module.exports = router