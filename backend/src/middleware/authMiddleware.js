const jwt = require('jsonwebtoken')
const auditLogger = require('../utils/logger')
const { isAccessTokenBlacklisted } = require('../utils/tokenRegistry')

const ROLES = {
  FOUNDER: 'founder',
  CO_FOUNDER_1: 'co-founder-1',
  CO_FOUNDER_2: 'co-founder-2',
  ACCOUNTANT: 'accountant',
  MEDIA: 'media'
};

const JWT_OPTIONS = {
  issuer: 'sivam-trust-api',
  audience: 'sivam-trust-client'
};

const hasPermission = (userRole, requiredRoles) => {
  if (!userRole) return false;
  
  const userRolesList = [userRole];
  if (userRole === ROLES.CO_FOUNDER_1 || userRole === ROLES.CO_FOUNDER_2) {
    userRolesList.push('co-founder');
  }
  
  return requiredRoles.some(r => userRolesList.includes(r));
};

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1]
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Check token blacklist
    if (isAccessTokenBlacklisted(token)) {
      auditLogger.warn('AUTH_BLOCKED', { reason: 'Blacklisted token', ip: req.ip });
      return res.status(401).json({ error: 'Session expired. Please log in again.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS)
    req.user = decoded
    next()
  } catch (err) {
    auditLogger.warn('AUTH_BLOCKED', { reason: 'Invalid or expired token', error: err.message, ip: req.ip });
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    if (!hasPermission(req.user.role, roles)) {
      auditLogger.warn('PERMISSION_DENIED', { 
        userId: req.user.id, 
        userRole: req.user.role, 
        requiredRoles: roles,
        path: req.originalUrl,
        ip: req.ip 
      });
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' })
    }
    next()
  }
}

module.exports = { protect, requireRole, ROLES, hasPermission }