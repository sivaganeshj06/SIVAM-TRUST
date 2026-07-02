const jwt = require('jsonwebtoken');

// In-memory token storage (suitable for persistent Node.js servers)
const activeRefreshTokens = new Map(); // token => { userId, role, expiresAt }
const blacklistedAccessTokens = new Set(); // token (expired / logged out access tokens)

// Clean up expired tokens periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeRefreshTokens.entries()) {
    if (data.expiresAt < now) {
      activeRefreshTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

const addRefreshToken = (token, userId, role, expiresInSeconds) => {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  activeRefreshTokens.set(token, { userId, role, expiresAt });
};

const revokeRefreshToken = (token) => {
  activeRefreshTokens.delete(token);
};

const revokeAllUserTokens = (userId) => {
  for (const [token, data] of activeRefreshTokens.entries()) {
    if (data.userId === userId) {
      activeRefreshTokens.delete(token);
    }
  }
};

const isRefreshTokenActive = (token) => {
  const data = activeRefreshTokens.get(token);
  if (!data) return false;
  if (data.expiresAt < Date.now()) {
    activeRefreshTokens.delete(token);
    return false;
  }
  return true;
};

const blacklistAccessToken = (token) => {
  blacklistedAccessTokens.add(token);
  // Optional: Automatically remove from blacklist when JWT would naturally expire
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const msUntilExpiry = (decoded.exp * 1000) - Date.now();
      if (msUntilExpiry > 0) {
        setTimeout(() => {
          blacklistedAccessTokens.delete(token);
        }, msUntilExpiry);
      }
    }
  } catch (err) {
    // Ignore decoding errors
  }
};

const isAccessTokenBlacklisted = (token) => {
  return blacklistedAccessTokens.has(token);
};

module.exports = {
  addRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenActive,
  blacklistAccessToken,
  isAccessTokenBlacklisted,
  activeRefreshTokens // exported for test/debug visibility
};
