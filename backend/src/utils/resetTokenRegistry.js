const crypto = require('crypto');

// In-memory store for reset tokens: hashedToken => { memberId, expiresAt }
const resetTokens = new Map();

// Helper to hash tokens
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createResetToken = (memberId) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(rawToken);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
  
  resetTokens.set(hashed, { memberId, expiresAt });
  
  return rawToken;
};

const verifyAndConsumeResetToken = (rawToken) => {
  const hashed = hashToken(rawToken);
  const data = resetTokens.get(hashed);
  
  if (!data) return null;
  
  // Consume token immediately (one-time use)
  resetTokens.delete(hashed);
  
  if (data.expiresAt < Date.now()) {
    return null; // Expired
  }
  
  return data.memberId;
};

// Periodically clean up expired reset tokens
setInterval(() => {
  const now = Date.now();
  for (const [hashed, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(hashed);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  createResetToken,
  verifyAndConsumeResetToken
};
