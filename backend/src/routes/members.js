const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { body, param, validationResult } = require('express-validator')
const { validatePasswordStrength, passwordComplexityMessage } = require('../utils/validators')
const auditLogger = require('../utils/logger')

const isValidImageBuffer = (buffer) => {
  if (buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  const isJpeg = hex.startsWith('FFD8FF');
  const isPng = hex === '89504E47';
  const isWebp = hex === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57454250';
  return isJpeg || isPng || isWebp;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, WEBP allowed!'))
    }
  }
})

// Validation rules
const memberCreateValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Name must contain only letters, dots, and spaces'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('reference_number')
    .trim()
    .notEmpty().withMessage('Reference number is required')
    .matches(/^STF\/2026\/[A-Z0-9\/]+$/).withMessage('Invalid reference number format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom(val => {
      if (!validatePasswordStrength(val)) {
        throw new Error(passwordComplexityMessage);
      }
      return true;
    }),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['founder', 'co-founder', 'accountant', 'media']).withMessage('Invalid role'),
];

const memberUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Name must contain only letters, dots, and spaces'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .trim()
    .isIn(['founder', 'co-founder', 'accountant', 'media']).withMessage('Invalid role'),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('password')
    .optional({ checkFalsy: true })
    .custom(val => {
      if (!validatePasswordStrength(val)) {
        throw new Error(passwordComplexityMessage);
      }
      return true;
    }),
];

const validateId = [
  param('id').isUUID().withMessage('Invalid member ID format')
];

// Get all members (Founder only)
router.get('/', protect, requireRole('founder'), async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, phone, email, reference_number, role, photo_url, status, created_at')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Get single member (Founder only)
router.get('/:id', protect, requireRole('founder'), validateId, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { data, error } = await supabase
    .from('members')
    .select('id, name, phone, email, reference_number, role, photo_url, status, created_at')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create new member (Founder only)
router.post('/', protect, requireRole('founder'), memberCreateValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { name, phone, email, reference_number, password, role } = req.body

  const password_hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('members')
    .insert([{ name, phone, email, reference_number, password_hash, role, status: 'active' }])
    .select('id, name, phone, email, reference_number, role, status')

  if (error) return res.status(500).json({ error: error.message })
  
  auditLogger.info('MEMBER_CREATED', { creatorId: req.user.id, memberId: data[0].id, role });
  res.json({ success: true, member: data[0] })
})

// Update member (Founder only)
router.put('/:id', protect, requireRole('founder'), validateId, memberUpdateValidation, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { name, phone, email, role, status, password } = req.body
  const updates = { name, phone, email, role, status }

  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10)
  }

  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, name, phone, email, reference_number, role, status')

  if (error) return res.status(500).json({ error: error.message })
  
  auditLogger.info('MEMBER_UPDATED', { creatorId: req.user.id, memberId: req.params.id });
  res.json({ success: true, member: data[0] })
})

// Upload member photo (Founder only)
router.post('/:id/photo', protect, requireRole('founder'), validateId, upload.single('photo'), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    // Validate magic bytes
    if (!isValidImageBuffer(file.buffer)) {
      return res.status(400).json({ error: 'Invalid image file content (failed magic bytes check)' })
    }

    const extension = file.originalname.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return res.status(400).json({ error: 'Invalid file extension. Only JPG, JPEG, PNG, WEBP allowed.' });
    }

    // Secure random filename
    const fileName = `member_${req.params.id}_${crypto.randomUUID()}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from('member-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (storageError) return res.status(500).json({ error: storageError.message })

    const { data: urlData } = supabase.storage
      .from('member-photos')
      .getPublicUrl(fileName)

    const { data, error } = await supabase
      .from('members')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', req.params.id)
      .select('id, name, photo_url')

    if (error) return res.status(500).json({ error: error.message })
    
    auditLogger.info('MEMBER_PHOTO_UPLOADED', { creatorId: req.user.id, memberId: req.params.id });
    res.json({ success: true, member: data[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete member (Founder only)
router.delete('/:id', protect, requireRole('founder'), validateId, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  
  auditLogger.info('MEMBER_DELETED', { creatorId: req.user.id, memberId: req.params.id });
  res.json({ success: true, message: 'Member deleted' })
})

module.exports = router