const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const { sendDonationNotification } = require('../utils/mailer')
const { body, param, validationResult } = require('express-validator')
const auditLogger = require('../utils/logger')

// Validation rules
const donationValidation = [
  body('donor_name')
    .trim()
    .notEmpty().withMessage('Donor name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Name must contain only letters, dots, and spaces'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom(val => {
      if (Number(val) < 1) throw new Error('Amount must be at least ₹1')
      if (Number(val) > 1000000) throw new Error('Amount cannot exceed ₹10,00,000')
      return true;
    }),
]

const donationUpdateValidation = [
  body('payment_status')
    .trim()
    .notEmpty().withMessage('Payment status is required')
    .isIn(['pending', 'completed', 'failed']).withMessage('Invalid payment status'),
  body('transaction_id')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage('Transaction ID must be 5-100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Transaction ID must contain only alphanumeric characters, dashes, or underscores'),
]

const validateDonationId = [
  param('id').isUUID().withMessage('Invalid donation ID format')
]

// Submit donation (public)
router.post('/', donationValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { donor_name, email, phone, amount } = req.body

  // Duplicate donation check — same email + same amount within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('donations')
    .select('id')
    .eq('email', email)
    .eq('amount', Number(amount))
    .gte('created_at', fiveMinutesAgo)
    .limit(1)

  if (existing && existing.length > 0) {
    return res.status(400).json({
      error: 'Duplicate donation detected. Please wait 5 minutes before submitting again.'
    })
  }

  const { data, error } = await supabase
    .from('donations')
    .insert([{ donor_name, email, phone, amount: Number(amount), payment_status: 'pending' }])
    .select()

  if (error) {
    auditLogger.error('DONATION_SUBMISSION_FAILED', { error: error.message, donor_name, email });
    return res.status(500).json({ error: error.message })
  }

  auditLogger.info('DONATION_SUBMITTED', { donationId: data[0].id, amount });

  try {
    const { createNotificationForRole } = require('../utils/notificationService');
    await createNotificationForRole('founder', 'donation', 'New Donation Registered', `A pending donation of ₹${amount} was registered by ${donor_name}.`);
    await createNotificationForRole('accountant', 'donation', 'New Donation Registered', `A pending donation of ₹${amount} was registered by ${donor_name}.`);
  } catch (err) {
    auditLogger.error('DONATION_NOTIFICATION_FAILED', { error: err.message });
  }

  // Send email notification
  await sendDonationNotification({ donor_name, email, phone, amount, payment_status: 'pending' })

  res.json({
    success: true,
    message: 'Thank you for your generous contribution. Your donation has been successfully received. Your support helps us continue our mission.',
    data: data[0]
  })
})

// Get all donations (Founder + Co-Founder + Accountant)
router.get('/', protect, requireRole('founder', 'co-founder-1', 'co-founder-2', 'accountant'), async (req, res) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Update donation status (Founder + Accountant)
router.put('/:id', protect, requireRole('founder', 'accountant'), validateDonationId, donationUpdateValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { payment_status, transaction_id } = req.body
  const { data, error } = await supabase
    .from('donations')
    .update({ payment_status, transaction_id })
    .eq('id', req.params.id)
    .select()

  auditLogger.info('DONATION_UPDATED', { updaterId: req.user.id, donationId: req.params.id, status: payment_status });

  try {
    const { createNotificationForRole } = require('../utils/notificationService');
    await createNotificationForRole('founder', 'donation', 'Donation Status Updated', `The status of donation from ${data[0].donor_name} of ₹${data[0].amount} has been updated to "${payment_status}".`);
    await createNotificationForRole('accountant', 'donation', 'Donation Status Updated', `The status of donation from ${data[0].donor_name} of ₹${data[0].amount} has been updated to "${payment_status}".`);
  } catch (err) {
    auditLogger.error('DONATION_UPDATE_NOTIFICATION_FAILED', { error: err.message });
  }

  res.json({ success: true, data: data[0] })
})

// Delete donation (Founder only)
router.delete('/:id', protect, requireRole('founder'), validateDonationId, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  
  auditLogger.info('DONATION_DELETED', { deleterId: req.user.id, donationId: req.params.id });
  res.json({ success: true, message: 'Donation deleted' })
})

module.exports = router