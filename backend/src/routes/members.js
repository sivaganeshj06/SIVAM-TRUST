const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const multer = require('multer')
const bcrypt = require('bcryptjs')

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
router.get('/:id', protect, requireRole('founder'), async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, phone, email, reference_number, role, photo_url, status, created_at')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create new member (Founder only)
router.post('/', protect, requireRole('founder'), async (req, res) => {
  const { name, phone, email, reference_number, password, role } = req.body

  if (!name || !reference_number || !password || !role)
    return res.status(400).json({ error: 'Name, reference number, password and role are required' })

  const password_hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('members')
    .insert([{ name, phone, email, reference_number, password_hash, role, status: 'active' }])
    .select('id, name, phone, email, reference_number, role, status')

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, member: data[0] })
})

// Update member (Founder only)
router.put('/:id', protect, requireRole('founder'), async (req, res) => {
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
  res.json({ success: true, member: data[0] })
})

// Upload member photo (Founder only)
router.post('/:id/photo', protect, requireRole('founder'), upload.single('photo'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileName = `member_${req.params.id}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`

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
    res.json({ success: true, member: data[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete member (Founder only)
router.delete('/:id', protect, requireRole('founder'), async (req, res) => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, message: 'Member deleted' })
})

module.exports = router