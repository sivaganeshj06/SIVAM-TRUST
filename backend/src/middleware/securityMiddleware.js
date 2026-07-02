const auditLogger = require('../utils/logger');

// Central XSS Sanitizer & Prototype Pollution blocker
const sanitizeInput = (val) => {
  if (typeof val === 'string') {
    // Escape script tags and dangerous HTML tags
    return val
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, '') // remove HTML tags
      .trim();
  }
  
  if (typeof val === 'object' && val !== null) {
    // Prototype Pollution Prevention: block __proto__, constructor, prototype
    for (const key in val) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete val[key];
        continue;
      }
      val[key] = sanitizeInput(val[key]);
    }
  }
  
  return val;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// Generic Error Responder: logs stack trace internally, returns generic 500 error response
const errorResponder = (err, req, res, next) => {
  const errStatus = err.status || 500;
  const errMessage = err.message || 'Internal server error';

  // Log full trace internally for debug/audit
  auditLogger.error('UNHANDLED_ERROR', {
    message: errMessage,
    status: errStatus,
    stack: err.stack,
    path: req.originalUrl,
    ip: req.ip
  });

  // Never leak internal stack trace, paths, or DB error details to client in production
  const responseMessage = errStatus === 500 ? 'Internal server error' : errMessage;
  
  res.status(errStatus).json({
    error: responseMessage
  });
};

module.exports = {
  sanitizeMiddleware,
  errorResponder
};
