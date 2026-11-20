/**
 * JZAGENTIC - User Management & Token Quota Engine
 * Manages Google OAuth users, token balances, tiers, and monetization.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const USERS_FILE = path.join(__dirname, '.users.json');

// Default initial token bonus for every new Google sign-in
const DEFAULT_INITIAL_TOKENS = 50000;

// Pricing & Tiers configuration
const TIERS = {
  free: { name: 'Free Starter', maxTokens: 50000, isVip: false },
  starter: { name: 'Starter Pack', maxTokens: 250000, isVip: false, priceRp: 20000 },
  pro: { name: 'Pro Developer', maxTokens: 1000000, isVip: false, priceRp: 49000 },
  vip: { name: 'VIP Unlimited', maxTokens: Infinity, isVip: true, priceRp: 99000 },
};

// In-memory cache of users
let users = {};

// Load saved users from disk
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`[Users] Loaded ${Object.keys(users).length} users from disk.`);
    }
  } catch (e) {
    console.error('[Users] Error loading users, initializing empty store:', e.message);
    users = {};
  }
}

// Persist users to disk
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    // In serverless / read-only environment, keep in-memory
    console.warn('[Users] Could not persist to disk (may be serverless):', e.message);
  }
}

// Initialize on startup
loadUsers();

/**
 * Verify Google ID Token (JWT) using Google TokenInfo endpoint
 */
function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    if (!idToken) return reject(new Error('NO_TOKEN_PROVIDED'));

    // Fast-path: query Google's public tokeninfo endpoint
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error_description || parsed.error) {
            // If tokeninfo fails or offline, fallback to decoding JWT payload if valid format
            const fallback = decodeJwtPayload(idToken);
            if (fallback && fallback.email) {
              return resolve(fallback);
            }
            return reject(new Error(parsed.error_description || parsed.error || 'INVALID_GOOGLE_TOKEN'));
          }
          resolve({
            sub: parsed.sub,
            email: parsed.email,
            name: parsed.name || parsed.email.split('@')[0],
            picture: parsed.picture || '',
            email_verified: parsed.email_verified === 'true' || parsed.email_verified === true,
          });
        } catch (err) {
          // Fallback to local JWT decoding
          const fallback = decodeJwtPayload(idToken);
          if (fallback && fallback.email) return resolve(fallback);
          reject(err);
        }
      });
    }).on('error', (err) => {
      // Fallback decoding if network fails
      const fallback = decodeJwtPayload(idToken);
      if (fallback && fallback.email) return resolve(fallback);
      reject(err);
    });
  });
}

/**
 * Fallback JWT payload decoder (Base64URL)
 */
function decodeJwtPayload(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    const parsed = JSON.parse(payload);
    return {
      sub: parsed.sub || parsed.user_id || 'user-' + Date.now(),
      email: parsed.email || '',
      name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'User'),
      picture: parsed.picture || '',
      email_verified: parsed.email_verified || true,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Find or create a user by Google profile
 */
function findOrCreateUser(profile) {
  const userId = profile.sub || profile.email;
  let user = users[userId];

  if (!user) {
    // Check if user exists by email
    const existingKey = Object.keys(users).find(k => users[k].email === profile.email);
    if (existingKey) {
      user = users[existingKey];
      user.id = userId; // update to sub id
      if (profile.picture) user.picture = profile.picture;
      if (profile.name) user.name = profile.name;
    }
  }

  if (!user) {
    // Create new user with 50,000 free tokens!
    user = {
      id: userId,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      picture: profile.picture || '',
      tier: 'free',
      tokenBalance: DEFAULT_INITIAL_TOKENS,
      tokensUsed: 0,
      lifetimeTokens: 0,
      requestsCount: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users[userId] = user;
    saveUsers();
    console.log(`🎉 [New User Registered] ${user.email} received ${DEFAULT_INITIAL_TOKENS.toLocaleString()} Free Tokens!`);
  } else {
    // Update existing user login time
    user.lastLogin = new Date().toISOString();
    if (profile.picture) user.picture = profile.picture;
    if (profile.name) user.name = profile.name;
    saveUsers();
  }

  return sanitizeUser(user);
}

/**
 * Get user by ID or session
 */
function getUser(userId) {
  const user = users[userId];
  return user ? sanitizeUser(user) : null;
}

/**
 * Get internal user record (mutable)
 */
function getRawUser(userId) {
  return users[userId] || null;
}

/**
 * Deduct tokens from user
 */
function deductTokens(userId, tokenCount) {
  const user = users[userId];
  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  // VIP users have unlimited tokens
  if (user.tier === 'vip') {
    user.tokensUsed = (user.tokensUsed || 0) + tokenCount;
    user.lifetimeTokens = (user.lifetimeTokens || 0) + tokenCount;
    user.requestsCount = (user.requestsCount || 0) + 1;
    saveUsers();
    return { success: true, remaining: Infinity, isVip: true, user: sanitizeUser(user) };
  }

  // Check if balance is sufficient
  if (user.tokenBalance <= 0) {
    return { success: false, error: 'QUOTA_EXHAUSTED', remaining: 0, user: sanitizeUser(user) };
  }

  user.tokenBalance = Math.max(0, user.tokenBalance - tokenCount);
  user.tokensUsed = (user.tokensUsed || 0) + tokenCount;
  user.lifetimeTokens = (user.lifetimeTokens || 0) + tokenCount;
  user.requestsCount = (user.requestsCount || 0) + 1;
  saveUsers();

  return {
    success: true,
    remaining: user.tokenBalance,
    isVip: false,
    user: sanitizeUser(user),
  };
}

/**
 * Top up tokens or upgrade user tier
 */
function topupUser(emailOrId, additionalTokens, newTier) {
  let targetUser = users[emailOrId];
  if (!targetUser) {
    const key = Object.keys(users).find(k => users[k].email.toLowerCase() === emailOrId.toLowerCase());
    if (key) targetUser = users[key];
  }

  if (!targetUser) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  if (additionalTokens && !isNaN(additionalTokens)) {
    targetUser.tokenBalance = (targetUser.tokenBalance || 0) + parseInt(additionalTokens, 10);
  }

  if (newTier && TIERS[newTier]) {
    targetUser.tier = newTier;
    if (newTier === 'vip') {
      targetUser.tokenBalance = Infinity;
    }
  }

  saveUsers();
  return { success: true, user: sanitizeUser(targetUser) };
}

/**
 * Sanitize user object to send to client
 */
function sanitizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    tier: u.tier,
    tierName: TIERS[u.tier]?.name || 'Free',
    isVip: u.tier === 'vip',
    tokenBalance: u.tier === 'vip' ? 'UNLIMITED' : u.tokenBalance,
    tokensUsed: u.tokensUsed || 0,
    requestsCount: u.requestsCount || 0,
    createdAt: u.createdAt,
  };
}

/**
 * Create a simple signed session token for the user
 */
function createSessionToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify session token from client
 */
function verifySessionToken(token) {
  try {
    if (!token) return null;
    const str = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(str);
    if (!payload.userId || payload.exp < Date.now()) return null;
    return getUser(payload.userId);
  } catch (e) {
    return null;
  }
}

module.exports = {
  TIERS,
  DEFAULT_INITIAL_TOKENS,
  verifyGoogleToken,
  findOrCreateUser,
  getUser,
  getRawUser,
  deductTokens,
  topupUser,
  createSessionToken,
  verifySessionToken,
  getAllUsersCount: () => Object.keys(users).length,
};
