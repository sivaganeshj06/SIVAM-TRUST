const supabase = require('../config/supabase')

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const { data, error } = await supabase.auth.getUser(token)
    
    if (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = data.user
    next()
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { protect }
