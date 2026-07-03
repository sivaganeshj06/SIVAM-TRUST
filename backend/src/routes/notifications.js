const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { addSseClient, removeSseClient } = require('../utils/notificationService');
const auditLogger = require('../utils/logger');

// Fetch all notifications for the logged-in user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data || []);
});

// Mark specific notification as read
router.put('/:id/read', async (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId)
    .eq('user_id', userId)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data: data[0] });
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, message: 'All notifications marked as read' });
});

// Server-Sent Events stream for real-time notifications
router.get('/stream', (req, res) => {
  const userId = req.query.token 
    ? require('jsonwebtoken').decode(req.query.token)?.id 
    : req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized stream request' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add the client response stream to the active list
  addSseClient(userId, res);
  
  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 35000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(userId, res);
  });
});

module.exports = router;
