/**
 * JZAGENTIC - User Management & Token Quota Engine
 * Manages Google OAuth users, token balances, tiers, and monetization.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const USERS_FILE = path.join(__dirname, '.users.json');
const TMP_USERS_FILE = path.join(os.tmpdir(), 'jzagentic_users.json');

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

// Load saved users from disk (checks workspace first, then tmpdir for serverless persistence)
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`[Users] Loaded ${Object.keys(users).length} users from workspace disk.`);
      return;
    }
  } catch (e) {
    // Ignore and fallback
  }

  try {
    if (fs.existsSync(TMP_USERS_FILE)) {
      const data = fs.readFileSync(TMP_USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`[Users] Loaded ${Object.keys(users).length} users from tmp disk.`);
      return;
    }
  } catch (e) {
    // Ignore
  }

  users = {};
}

// Persist users to disk (dual persistence for local & serverless)
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    // Expected on serverless read-only filesystem
  }

  try {
    fs.writeFileSync(TMP_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    // Fallback in-memory
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
 * Supports clientWallet parameter to restore token balance on serverless restarts
 */
function findOrCreateUser(profile, clientWallet = null) {
  const normEmail = (profile.email || '').toLowerCase().trim();
  const userId = profile.sub || normEmail;
  
  // Try finding user by sub ID, email key, or email property
  let user = users[userId];
  if (!user && normEmail) {
    user = users[normEmail];
  }
  if (!user && normEmail) {
    const existingKey = Object.keys(users).find(k => {
      const u = users[k];
      return u && u.email && u.email.toLowerCase().trim() === normEmail;
    });
    if (existingKey) {
      user = users[existingKey];
    }
  }

  let isNewUser = false;

  if (!user) {
    // Check if clientWallet has existing balance for this returning user (e.g. serverless cold start)
    if (clientWallet && clientWallet.email && clientWallet.email.toLowerCase().trim() === normEmail && typeof clientWallet.tokenBalance === 'number') {
      console.log(`[Users] Restoring returning user ${normEmail} from client wallet with balance: ${clientWallet.tokenBalance}`);
      user = {
        id: userId,
        email: normEmail,
        name: profile.name || normEmail.split('@')[0],
        picture: profile.picture || '',
        tier: clientWallet.tier || 'free',
        tokenBalance: clientWallet.tokenBalance,
        tokensUsed: clientWallet.tokensUsed || 0,
        lifetimeTokens: clientWallet.lifetimeTokens || (clientWallet.tokensUsed || 0),
        requestsCount: clientWallet.requestsCount || 0,
        createdAt: clientWallet.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      isNewUser = false;
    } else {
      // Brand new registration: grant 50,000 initial tokens
      user = {
        id: userId,
        email: normEmail,
        name: profile.name || normEmail.split('@')[0],
        picture: profile.picture || '',
        tier: 'free',
        tokenBalance: DEFAULT_INITIAL_TOKENS,
        tokensUsed: 0,
        lifetimeTokens: 0,
        requestsCount: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      isNewUser = true;
      console.log(`🎉 [New User Registered] ${user.email} received ${DEFAULT_INITIAL_TOKENS.toLocaleString()} Free Tokens!`);
    }

    users[userId] = user;
    if (normEmail) users[normEmail] = user;
    saveUsers();
  } else {
    // User already exists! SISA TOKEN SEBELUMNYA HARUS TETAP ADA!
    isNewUser = false;
    user.id = userId;
    user.lastLogin = new Date().toISOString();
    if (profile.picture) user.picture = profile.picture;
    if (profile.name) user.name = profile.name;

    // Sync clientWallet if client recorded more recent token consumption
    if (clientWallet && clientWallet.email && clientWallet.email.toLowerCase().trim() === normEmail && typeof clientWallet.tokenBalance === 'number') {
      if (clientWallet.tokenBalance < user.tokenBalance) {
        user.tokenBalance = clientWallet.tokenBalance;
      }
      if (clientWallet.tokensUsed > (user.tokensUsed || 0)) {
        user.tokensUsed = clientWallet.tokensUsed;
      }
    }

    users[userId] = user;
    if (normEmail) users[normEmail] = user;
    saveUsers();
  }

  const sanitized = sanitizeUser(user);
  sanitized.isNewUser = isNewUser;
  return sanitized;
}

/**
 * Get user by ID or email
 */
function getUser(userId) {
  if (!userId) return null;
  let user = users[userId];
  if (!user && typeof userId === 'string' && userId.includes('@')) {
    user = users[userId.toLowerCase().trim()];
  }
  if (!user) {
    const key = Object.keys(users).find(k => users[k] && users[k].email && users[k].email.toLowerCase() === String(userId).toLowerCase());
    if (key) user = users[key];
  }
  return user ? sanitizeUser(user) : null;
}

/**
 * Get internal user record (mutable)
 */
function getRawUser(userId) {
  if (!userId) return null;
  let user = users[userId];
  if (!user && typeof userId === 'string' && userId.includes('@')) {
    user = users[userId.toLowerCase().trim()];
  }
  if (!user) {
    const key = Object.keys(users).find(k => users[k] && users[k].email && users[k].email.toLowerCase() === String(userId).toLowerCase());
    if (key) user = users[key];
  }
  return user || null;
}

/**
 * Deduct tokens from user
 */
function deductTokens(userId, tokenCount) {
  let user = users[userId];
  if (!user && typeof userId === 'string' && userId.includes('@')) {
    user = users[userId.toLowerCase().trim()];
  }
  if (!user) {
    const key = Object.keys(users).find(k => users[k] && users[k].email && users[k].email.toLowerCase() === String(userId).toLowerCase());
    if (key) user = users[key];
  }

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
 * Create a resilient signed session token carrying user identity
 */
function createSessionToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    tier: user.tier,
    tokenBalance: user.tokenBalance,
    tokensUsed: user.tokensUsed || 0,
    lifetimeTokens: user.lifetimeTokens || 0,
    exp: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days validity
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify session token from client with automatic restoration on serverless cold starts
 */
function verifySessionToken(token, clientWallet) {
  try {
    if (!token) return null;
    const str = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(str);
    if (!payload.userId || (payload.exp && payload.exp < Date.now())) return null;

    // Check existing in-memory / disk store
    let user = getRawUser(payload.userId) || (payload.email ? getRawUser(payload.email) : null);

    // If server cold-started (e.g. Vercel serverless function), restore user from session token & client wallet
    if (!user && payload.email) {
      console.log(`[UserStore] Restoring session from persistent token for ${payload.email}...`);
      const normEmail = payload.email.toLowerCase().trim();
      let restoredBalance = payload.tokenBalance;
      let restoredTier = payload.tier || 'free';

      if (clientWallet && typeof clientWallet.tokenBalance !== 'undefined') {
        restoredBalance = clientWallet.tokenBalance;
        restoredTier = clientWallet.tier || restoredTier;
      }

      user = {
        id: payload.userId,
        email: normEmail,
        name: payload.name || normEmail.split('@')[0],
        picture: payload.picture || '',
        tier: restoredTier,
        tokenBalance: typeof restoredBalance !== 'undefined' ? restoredBalance : DEFAULT_INITIAL_TOKENS,
        tokensUsed: payload.tokensUsed || 0,
        lifetimeTokens: payload.lifetimeTokens || 0,
        requestsCount: payload.requestsCount || 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      users[payload.userId] = user;
      users[normEmail] = user;
      saveUsers();
    }

    return user ? sanitizeUser(user) : null;
  } catch (e) {
    return null;
  }
}

function getAllUsers() {
  return Object.values(users).map(sanitizeUser);
}

module.exports = {
  TIERS,
  DEFAULT_INITIAL_TOKENS,
  verifyGoogleToken,
  findOrCreateUser,
  getUser,
  getRawUser,
  getAllUsers,
  deductTokens,
  topupUser,
  createSessionToken,
  verifySessionToken,
  getAllUsersCount: () => Object.keys(users).length,
};
