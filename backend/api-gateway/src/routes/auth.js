const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../../../shared/database');
const { cache, session } = require('../../../shared/redis');
const { authenticate, generateTokens, apiRateLimit } = require('../middleware/auth');
const { emailQueue } = require('../../../shared/queue');
const router = express.Router();

const authLimiter = apiRateLimit(10, 15 * 60, (req) => `auth:${req.ip}`);

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('locale').optional().isIn(['ar', 'ru', 'en']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, locale = 'ar' } = req.body;
    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const { rows } = await query(`
        INSERT INTO users (name, email, password_hash, locale, verification_token)
        VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, is_verified, locale
      `, [name, email, passwordHash, locale, verificationToken]);

      const user = rows[0];
      const { accessToken, refreshToken } = generateTokens(user.id, user.role);

      // Queue verification email
      await emailQueue().add('send-verification', { to: email, name, token: verificationToken, locale }).catch(() => {});

      // Store refresh token
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
        [user.id, tokenHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

      res.cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
      res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000 });

      res.status(201).json({ message: 'Registration successful. Please verify your email.', accessToken, user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, totpCode } = req.body;
    try {
      const { rows } = await query(
        'SELECT id, name, email, password_hash, role, is_verified, is_active, is_2fa_enabled, two_fa_secret, locale FROM users WHERE email = $1',
        [email]
      );

      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash)))
        return res.status(401).json({ error: 'Invalid email or password' });

      if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

      // 2FA check
      if (user.is_2fa_enabled) {
        if (!totpCode) return res.status(200).json({ requires2FA: true, message: '2FA code required' });
        const verified = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: totpCode, window: 2 });
        if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });
      }

      await query('UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1', [user.id]);

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at) VALUES ($1,$2,$3,$4)',
        [user.id, tokenHash, req.ip, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

      res.cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
      res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000 });

      const { password_hash, two_fa_secret, ...safeUser } = user;
      res.json({ accessToken, user: safeUser });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const { rows } = await query(
      'SELECT rt.*, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token_hash = $1 AND rt.expires_at > NOW()',
      [tokenHash]
    );

    if (!rows[0]) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, rows[0].role);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await query('UPDATE refresh_tokens SET token_hash = $1, expires_at = $2 WHERE id = $3',
      [newHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), rows[0].id]);

    res.cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }
    await cache.del(`user:${req.user.id}`).catch(() => {});
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, name_ar, email, role, avatar_url, bio, locale, is_verified, is_2fa_enabled, reputation_points, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── GET /api/auth/verify/:token ───────────────────────────
router.get('/verify/:token', async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id',
      [req.params.token]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired verification token' });
    res.json({ message: 'Email verified successfully' });
  } catch {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────
router.post('/forgot-password', authLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const { email } = req.body;
    try {
      const { rows } = await query('SELECT id, name FROM users WHERE email = $1', [email]);
      if (rows[0]) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
          [resetToken, expires, rows[0].id]);
        await emailQueue().add('send-reset-password', { to: email, name: rows[0].name, token: resetToken }).catch(() => {});
      }
      res.json({ message: 'If this email exists, a reset link has been sent.' });
    } catch {
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// ── POST /api/auth/reset-password ────────────────────────
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { token, password } = req.body;
    try {
      const { rows } = await query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
      if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset token' });
      const hash = await bcrypt.hash(password, 12);
      await query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, rows[0].id]);
      await cache.del(`user:${rows[0].id}`).catch(() => {});
      res.json({ message: 'Password reset successfully' });
    } catch {
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

// ── POST /api/auth/2fa/setup ──────────────────────────────
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Noor Al-Ilm (${req.user.email})`, length: 32 });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    await session.set(`2fa_setup:${req.user.id}`, { secret: secret.base32 }, 600);
    res.json({ secret: secret.base32, qrCode });
  } catch {
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// ── POST /api/auth/2fa/verify ─────────────────────────────
router.post('/2fa/verify', authenticate,
  [body('code').isLength({ min: 6, max: 6 })],
  async (req, res) => {
    try {
      const setupData = await session.get(`2fa_setup:${req.user.id}`);
      if (!setupData) return res.status(400).json({ error: '2FA setup session expired' });
      const verified = speakeasy.totp.verify({ secret: setupData.secret, encoding: 'base32', token: req.body.code, window: 2 });
      if (!verified) return res.status(400).json({ error: 'Invalid code' });
      await query('UPDATE users SET is_2fa_enabled = true, two_fa_secret = $1 WHERE id = $2', [setupData.secret, req.user.id]);
      await session.del(`2fa_setup:${req.user.id}`);
      await cache.del(`user:${req.user.id}`).catch(() => {});
      res.json({ message: '2FA enabled successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to verify 2FA' });
    }
  }
);

// ── DELETE /api/auth/2fa ──────────────────────────────────
router.delete('/2fa', authenticate, async (req, res) => {
  try {
    await query('UPDATE users SET is_2fa_enabled = false, two_fa_secret = NULL WHERE id = $1', [req.user.id]);
    await cache.del(`user:${req.user.id}`).catch(() => {});
    res.json({ message: '2FA disabled' });
  } catch {
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

module.exports = router;
