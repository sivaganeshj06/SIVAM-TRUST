const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect } = require('../middleware/authMiddleware')
const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, WEBP allowed!'))
    }
  }
})

// Upload photo for event (admin only)
router.post('/upload', protect, upload.single('photo'), async (req, res) => {
  try {
    const { event_id, caption } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileName = `${Date.now()}_${file.originalname}`

    const { data, error } = await supabase.storage
      .from('event-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      })

    if (error) return res.status(500).json({ error: error.message })

    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(fileName)

    const { data: photoData, error: dbError } = await supabase
      .from('event_photos')
      .insert([{
        event_id,
        photo_url: urlData.publicUrl,
        caption
      }])
      .select()

    if (dbError) return res.status(500).json({ error: dbError.message })

    res.json({ success: true, photo: photoData[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get photos for event
router.get('/:event_id', async (req, res) => {
  const { event_id } = req.params
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .eq('event_id', event_id)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete photo (admin only)
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params

  const { data: photo } = await supabase
    .from('event_photos')
    .select('photo_url')
    .eq('id', id)
    .single()

  if (photo) {
    const fileName = photo.photo_url.split('/').pop()
    await supabase.storage.from('event-photos').remove([fileName])
  }

  const { error } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router