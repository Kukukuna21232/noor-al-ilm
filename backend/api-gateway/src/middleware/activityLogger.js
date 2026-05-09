const { query } = require('../../../shared/database');
const { createLogger } = require('../../../shared/logger');

const logger = createLogger('activity-logger');

// Paths to skip logging (static assets, health checks)
const SKIP_PATHS = new Set(['/health', '/favicon.ico', '/robots.txt']);
const SKIP_PREFIXES = ['/uploads/', '/hls/', '/_next/'];

// Extract real IP from proxy headers
const getIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
};

// Async log — never blocks the request
const logActivity = async (data) => {
  try {
    await query(`
      INSERT INTO user_activity_logs
        (user_id, ip_address, user_agent, method, path, query_string,
         status_code, response_time_ms, referer, session_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [
      data.userId || null,
      data.ip,
      data.userAgent?.substring(0, 500) || null,
      data.method,
      data.path?.substring(0, 500),
      data.queryString?.substring(0, 1000) || null,
      data.statusCode || null,
      data.responseTimeMs || null,
      data.referer?.substring(0, 500) || null,
      data.sessionId || null,
    ]);
  } catch (err) {
    // Never crash the app on logging failure
    logger.warn('Activity log failed:', err.message);
  }
};

// Middleware factory
const activityLogger = (req, res, next) => {
  // Skip irrelevant paths
  if (SKIP_PATHS.has(req.path)) return next();
  if (SKIP_PREFIXES.some(p => req.path.startsWith(p))) return next();

  const startTime = Date.now();
  const ip = getIP(req);

  // Capture response status after it's sent
  res.on('finish', () => {
    logActivity({
      userId:          req.user?.id || null,
      ip,
      userAgent:       req.headers['user-agent'],
      method:          req.method,
      path:            req.path,
      queryString:     Object.keys(req.query).length ? JSON.stringify(req.query) : null,
      statusCode:      res.statusCode,
      responseTimeMs:  Date.now() - startTime,
      referer:         req.headers['referer'] || req.headers['referrer'] || null,
      sessionId:       req.cookies?.session_id || null,
    });
  });

  next();
};

// Migration: create the table if it doesn't exist
const ensureActivityTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id              BIGSERIAL PRIMARY KEY,
        user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_address      INET,
        user_agent      VARCHAR(500),
        method          VARCHAR(10) NOT NULL,
        path            VARCHAR(500) NOT NULL,
        query_string    TEXT,
        status_code     SMALLINT,
        response_time_ms INTEGER,
        referer         VARCHAR(500),
        session_id      VARCHAR(255),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_activity_user    ON user_activity_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_ip      ON user_activity_logs(ip_address, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_path    ON user_activity_logs(path, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_logs(created_at DESC);
    `);
    logger.info('user_activity_logs table ready');
  } catch (err) {
    logger.warn('Could not create activity table:', err.message);
  }
};

module.exports = { activityLogger, ensureActivityTable, getIP };
