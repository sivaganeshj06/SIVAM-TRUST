const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect } = require('../middleware/authMiddleware')
const nodemailer = require('nodemailer')

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sivamtrustfoundation@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
})

// Send notification emails
const sendDonationNotification = async (donation) => {
  const emails = [
    'Santhoshsuresh513@gmail.com',
    'prasathhari5490@gmail.com',
    'sivaganesh73acm@gmail.com',
    'agathiyan8778@gmail.com'
  ]

  const mailOptions = {
    from: 'sivamtrustfoundation@gmail.com',
    to: emails.join(','),
    subject: '🎉 New Donation Received - Sivam Trust Foundation',
    html: `
      <h2>New Donation Received!</h2>
      <table border="1" cellpadding="10">
        <tr><td><b>Donor Name</b></td><td>${donation.donor_name}</td></tr>
        <tr><td><b>Email</b></td><td>${donation.email}</td></tr>
        <tr><td><b>Phone</b></td><td>${donation.phone || 'N/A'}</td></tr>
        <tr><td><b>Amount</b></td><td>₹${donation.amount}</td></tr>
        <tr><td><b>Status</b></td><td>Pending</td></tr>
      </table>
      <p>Login to admin panel to view details.</p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Notification emails sent!')
  } catch (err) {
    console.log('Email error:', err.message)
  }
}

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

  // Send email notification
  await sendDonationNotification({ donor_name, email, phone, amount })

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