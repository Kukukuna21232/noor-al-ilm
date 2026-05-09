const jwt = require('jsonwebtoken');
const { query } = require('../../../shared/database');
const { cache, rateLimit } = require('../../../shared/redis');

// ── JWT Authentication ────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check cache first
    const cached = await cache.get(`user:${decoded.userId}`).catch(() => null);
    if (cached) { req.user = cached; return next(); }

    const { rows } = await query(
      'SELECT id, name, email, role, is_verified, is_active, is_2fa_enabled, locale FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    if (!rows[0].is_active) return res.status(403).json({ error: 'Account suspended' });

    // Cache user for 5 minutes
    await cache.set(`user:${decoded.userId}`, rows[0], 300).catch(() => {});
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Optional Auth ─────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const cached = await cache.get(`user:${decoded.userId}`).catch(() => null);
      if (cached) { req.user = cached; return next(); }
      const { rows } = await query('SELECT id, name, email, role, locale FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
      if (rows[0]) req.user = rows[0];
    }
  } catch {}
  next();
};

// ── Role Authorization ────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions', required: roles });
  next();
};

// ── Creator Check ─────────────────────────────────────────
const requireCreator = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { rows } = await query('SELECT id, is_approved FROM creators WHERE user_id = $1', [req.user.id]);
    if (!rows[0]) return res.status(403).json({ error: 'Creator account required' });
    if (!rows[0].is_approved && !['admin','superadmin'].includes(req.user.role))
      return res.status(403).json({ error: 'Creator account pending approval' });
    req.creator = rows[0];
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

// ── Email Verification ────────────────────────────────────
const requireVerified = (req, res, next) => {
  if (!req.user?.is_verified) return res.status(403).json({ error: 'Email verification required', code: 'EMAIL_NOT_VERIFIED' });
  next();
};

// ── API Rate Limiter (Redis-backed) ───────────────────────
const apiRateLimit = (limit, windowSeconds, keyFn) => async (req, res, next) => {
  try {
    const key = `rl:${keyFn ? keyFn(req) : req.ip}:${req.path}`;
    const result = await rateLimit(key, limit, windowSeconds);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - result.current));
    if (!result.allowed) return res.status(429).json({ error: 'Too many requests', retryAfter: windowSeconds });
    next();
  } catch {
    next(); // Don't block on Redis failure
  }
};

// ── Token generators ──────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

module.exports = { authenticate, optionalAuth, authorize, requireCreator, requireVerified, apiRateLimit, generateTokens };
