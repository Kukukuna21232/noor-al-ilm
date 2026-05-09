const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, name, email, role, is_verified, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows[0] || !rows[0].is_active) return res.status(401).json({ error: 'Unauthorized' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.userId]);
      if (rows[0]) req.user = rows[0];
    }
  } catch {}
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const requireCreator = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { rows } = await query('SELECT id, is_approved FROM creators WHERE user_id = $1', [req.user.id]);
    if (!rows[0]) return res.status(403).json({ error: 'Creator account required' });
    if (!rows[0].is_approved && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Creator account pending approval' });
    req.creator = rows[0];
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { authenticate, optionalAuth, authorize, requireCreator };
