const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')
const auditLogger = require('../utils/logger')
const {
  addRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenActive,
  blacklistAccessToken
} = require('../utils/tokenRegistry')
const { createResetToken, verifyAndConsumeResetToken } = require('../utils/resetTokenRegistry')
const { validatePasswordStrength, passwordComplexityMessage } = require('../utils/validators')
const { sendPasswordResetEmail } = require('../utils/mailer')

const JWT_OPTIONS = {
  issuer: 'sivam-trust-api',
  audience: 'sivam-trust-client'
};

const generateTokens = (member, resolvedRole) => {
  const accessToken = jwt.sign(
    { id: member.id, name: member.name, role: resolvedRole },
    process.env.JWT_SECRET,
    { expiresIn: '15m', ...JWT_OPTIONS }
  );

  const refreshToken = jwt.sign(
    { id: member.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', ...JWT_OPTIONS }
  );

  return { accessToken, refreshToken };
};

// Logins
router.post('/login', async (req, res) => {
  const { reference_number, password } = req.body

  if (!reference_number || !password) {
    auditLogger.warn('AUTH_FAILED', { reason: 'Missing credentials', ip: req.ip });
    return res.status(400).json({ error: 'Reference number and password are required' })
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('reference_number', reference_number)
    .eq('status', 'active')
    .single()

  if (error || !member) {
    auditLogger.warn('AUTH_FAILED', { reason: 'User not found or inactive', reference_number, ip: req.ip });
    return res.status(401).json({ error: 'Invalid reference number or password' })
  }

  const isMatch = await bcrypt.compare(password, member.password_hash)

  if (!isMatch) {
    auditLogger.warn('AUTH_FAILED', { reason: 'Password mismatch', reference_number, ip: req.ip });
    return res.status(401).json({ error: 'Invalid reference number or password' })
  }

  // Differentiate co-founder roles based on reference numbers
  let resolvedRole = member.role;
  if (member.role === 'co-founder') {
    if (member.reference_number === 'STF/2026/COF/01') {
      resolvedRole = 'co-founder-1';
    } else if (member.reference_number === 'STF/2026/COF/02') {
      resolvedRole = 'co-founder-2';
    }
  }

  // Generate short-lived access token and longer-lived refresh token
  const { accessToken, refreshToken } = generateTokens(member, resolvedRole);

  // Register the refresh token
  addRefreshToken(refreshToken, member.id, resolvedRole, 7 * 24 * 60 * 60);

  // Send login notification to Founder (skip for founder login)
  if (member.role !== 'founder') {
    try {
      const { sendLoginNotification } = require('../utils/mailer')
      sendLoginNotification({
        name: member.name,
        role: resolvedRole,
        loginTime: new Date().toLocaleString('en-IN'),
        device: req.headers['user-agent'],
        ip: req.ip
      })
    } catch (e) {
      auditLogger.error('NOTIFICATION_ERROR', { error: e.message });
    }
  }

  auditLogger.info('AUTH_SUCCESS', { userId: member.id, role: resolvedRole, ip: req.ip });

  // Store refresh token in secure HttpOnly cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });

  res.json({
    token: accessToken,
    user: {
      id: member.id,
      name: member.name,
      role: resolvedRole,
      email: member.email,
      photo_url: member.photo_url
    }
  })
})

// Refresh Access Token using Rotate mechanism
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, JWT_OPTIONS);
    
    // Check if token is active in registry
    if (!isRefreshTokenActive(refreshToken)) {
      // Reuse detected! Breach prevention: revoke all tokens for this user
      revokeAllUserTokens(decoded.id);
      res.clearCookie('refresh_token');
      auditLogger.warn('TOKEN_REUSE_DETECTED', { userId: decoded.id, ip: req.ip });
      return res.status(401).json({ error: 'Session compromised. Please re-authenticate.' });
    }

    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', decoded.id)
      .eq('status', 'active')
      .single()

    if (error || !member) {
      revokeRefreshToken(refreshToken);
      res.clearCookie('refresh_token');
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    let resolvedRole = member.role;
    if (member.role === 'co-founder') {
      if (member.reference_number === 'STF/2026/COF/01') {
        resolvedRole = 'co-founder-1';
      } else if (member.reference_number === 'STF/2026/COF/02') {
        resolvedRole = 'co-founder-2';
      }
    }

    const tokens = generateTokens(member, resolvedRole);

    // Rotate refresh token
    revokeRefreshToken(refreshToken);
    addRefreshToken(tokens.refreshToken, member.id, resolvedRole, 7 * 24 * 60 * 60);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token: tokens.accessToken,
      user: {
        id: member.id,
        name: member.name,
        role: resolvedRole,
        email: member.email,
        photo_url: member.photo_url
      }
    });

  } catch (err) {
    auditLogger.warn('REFRESH_FAILED', { error: err.message, ip: req.ip });
    res.clearCookie('refresh_token');
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout (Revoke tokens)
router.post('/logout', (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }

  // Blacklist the current access token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.split(' ')[1];
    blacklistAccessToken(accessToken);
  }

  res.clearCookie('refresh_token');
  res.json({ success: true, message: 'Logged out successfully' })
})

// Request Password Reset Link (Generic response for security)
router.post('/forgot-password', async (req, res) => {
  const { email, reference_number } = req.body;

  if (!email && !reference_number) {
    return res.status(400).json({ error: 'Email or reference number is required' });
  }

  try {
    let query = supabase.from('members').select('*');
    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('reference_number', reference_number);
    }

    const { data: member, error } = await query.eq('status', 'active').single();

    if (error || !member) {
      // Return success even if user not found to prevent user enumeration
      auditLogger.warn('FORGOT_PASSWORD_ATTEMPT', { reason: 'User not found', email, reference_number, ip: req.ip });
      return res.json({ success: true, message: 'If an active account exists with the provided credentials, a password reset link has been sent to the registered email.' });
    }

    if (!member.email) {
      auditLogger.warn('FORGOT_PASSWORD_FAILED', { reason: 'User has no email registered', userId: member.id, ip: req.ip });
      return res.json({ success: true, message: 'If an active account exists with the provided credentials, a password reset link has been sent to the registered email.' });
    }

    // Generate reset token and email it
    const token = createResetToken(member.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(member.email, resetLink);
    auditLogger.info('FORGOT_PASSWORD_REQUESTED', { userId: member.id, email: member.email, ip: req.ip });

    res.json({ success: true, message: 'If an active account exists with the provided credentials, a password reset link has been sent to the registered email.' });
  } catch (err) {
    auditLogger.error('FORGOT_PASSWORD_ERROR', { error: err.message, ip: req.ip });
    res.json({ success: true, message: 'If an active account exists with the provided credentials, a password reset link has been sent to the registered email.' });
  }
});

// Perform Password Reset
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  // Validate password strength
  if (!validatePasswordStrength(newPassword)) {
    return res.status(400).json({ error: passwordComplexityMessage });
  }

  try {
    const memberId = verifyAndConsumeResetToken(token);
    if (!memberId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('members')
      .update({ password_hash })
      .eq('id', memberId);

    if (error) {
      auditLogger.error('RESET_PASSWORD_DB_ERROR', { userId: memberId, error: error.message });
      return res.status(500).json({ error: 'Internal server error' });
    }

    auditLogger.info('PASSWORD_RESET_SUCCESS', { userId: memberId, ip: req.ip });
    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    auditLogger.error('RESET_PASSWORD_ERROR', { error: err.message, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router