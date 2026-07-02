const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { protect, requireRole } = require('../middleware/authMiddleware')
const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, WEBP allowed!'))
    }
  }
})

const crypto = require('crypto')

const isValidImageBuffer = (buffer) => {
  if (buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  const isJpeg = hex.startsWith('FFD8FF');
  const isPng = hex === '89504E47';
  const isWebp = hex === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57454250';
  return isJpeg || isPng || isWebp;
};

// Upload multiple photos
router.post('/upload', protect, requireRole('founder', 'co-founder', 'media'), upload.array('photos', 10), async (req, res) => {
  try {
    const { event_id, title, caption } = req.body
    const files = req.files

    if (!files || files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' })

    if (!event_id)
      return res.status(400).json({ error: 'event_id is required' })

    // Validate magic bytes for all files before starting upload
    for (const file of files) {
      if (!isValidImageBuffer(file.buffer)) {
        return res.status(400).json({ error: `File ${file.originalname} has invalid image content (failed magic bytes check)` });
      }
    }

    const uploadedPhotos = []

    for (const file of files) {
      const extension = file.originalname.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        return res.status(400).json({ error: 'Invalid file extension. Only JPG, JPEG, PNG, WEBP allowed.' });
      }
      
      // Secure random filename
      const fileName = `${event_id}_${crypto.randomUUID()}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (storageError) {
        console.error('Storage error:', storageError)
        return res.status(500).json({ error: `Storage upload failed: ${storageError.message}` })
      }

      const { data: urlData } = supabase.storage
        .from('event-photos')
        .getPublicUrl(fileName)

      const { data: photoData, error: dbError } = await supabase
        .from('event_photos')
        .insert([{
          event_id,
          photo_url: urlData.publicUrl,
          title: title || null,
          caption: caption || null
        }])
        .select()

      if (dbError) {
        console.error('DB error:', dbError)
        return res.status(500).json({ error: `Database error: ${dbError.message}` })
      }

      uploadedPhotos.push(photoData[0])
    }

    res.json({ success: true, photos: uploadedPhotos })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get all photos for an event
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

// Delete a photo
router.delete('/:id', protect, requireRole('founder', 'co-founder', 'media'), async (req, res) => {
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