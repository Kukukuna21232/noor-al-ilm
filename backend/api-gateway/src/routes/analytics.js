const express = require('express');
const { query } = require('../../../shared/database');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { cache } = require('../../../shared/redis');

const router = express.Router();

// ── Helper: extract real IP ───────────────────────────────
const getIP = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
};

// ── POST /api/analytics/pageview ──────────────────────────
// Called by frontend on every page navigation
router.post('/pageview', optionalAuth, async (req, res) => {
  const { path, referrer, sessionId, title } = req.body;
  if (!path) return res.status(400).json({ error: 'path required' });

  const ip = getIP(req);
  const userAgent = req.headers['user-agent']?.substring(0, 500) || null;

  try {
    // Insert raw page view
    await query(`
      INSERT INTO page_views (path, user_id, session_id, ip_address, referrer)
      VALUES ($1, $2, $3, $4::inet, $5)
    `, [
      path.substring(0, 500),
      req.user?.id || null,
      sessionId || null,
      ip !== 'unknown' ? ip : null,
      referrer?.substring(0, 500) || null,
    ]);

    // Update or create session
    if (sessionId) {
      await query(`
        INSERT INTO user_sessions (id, user_id, ip_address, user_agent, page_count)
        VALUES ($1, $2, $3::inet, $4, 1)
        ON CONFLICT (id) DO UPDATE SET
          last_active_at = NOW(),
          page_count = user_sessions.page_count + 1,
          user_id = COALESCE(user_sessions.user_id, $2)
      `, [sessionId, req.user?.id || null, ip !== 'unknown' ? ip : null, userAgent]);
    }

    res.json({ recorded: true });
  } catch (err) {
    // Never fail the client on analytics errors
    res.json({ recorded: false });
  }
});

// ── POST /api/analytics/session/end ──────────────────────
// Called by frontend on page unload / tab close
router.post('/session/end', optionalAuth, async (req, res) => {
  const { sessionId, durationSeconds } = req.body;
  if (!sessionId) return res.json({ ok: false });

  try {
    await query(`
      UPDATE user_sessions
      SET ended_at = NOW(),
          is_active = FALSE,
          duration_seconds = $1
      WHERE id = $2 AND ended_at IS NULL
    `, [durationSeconds || 0, sessionId]);
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

// ── POST /api/analytics/event ─────────────────────────────
// Track custom events (course_enroll, video_play, ai_query, etc.)
router.post('/event', optionalAuth, async (req, res) => {
  const { eventType, entityId, entityType, metadata } = req.body;
  if (!eventType) return res.status(400).json({ error: 'eventType required' });

  const ip = getIP(req);

  try {
    await query(`
      INSERT INTO user_activity_logs
        (user_id, ip_address, user_agent, method, path, query_string, status_code)
      VALUES ($1, $2::inet, $3, 'EVENT', $4, $5, 200)
    `, [
      req.user?.id || null,
      ip !== 'unknown' ? ip : null,
      req.headers['user-agent']?.substring(0, 500) || null,
      `/event/${eventType}`,
      JSON.stringify({ entityId, entityType, ...metadata }).substring(0, 1000),
    ]);
    res.json({ recorded: true });
  } catch {
    res.json({ recorded: false });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN ANALYTICS — all routes below require admin role
// ═══════════════════════════════════════════════════════════

// ── GET /api/analytics/overview ──────────────────────────
router.get('/overview', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { period = '30' } = req.query;
  const days = Math.min(parseInt(period) || 30, 365);
  const cacheKey = `analytics:overview:${days}`;

  try {
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached) return res.json(cached);

    const [
      totals,
      pageViewsDaily,
      topPages,
      topCountries,
      sessionStats,
      newUsersDaily,
      activeUsers,
      deviceBreakdown,
    ] = await Promise.all([
      // Platform totals
      query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE is_active = true)                          AS total_users,
          (SELECT COUNT(*) FROM users WHERE created_at > NOW() - ($1 || ' days')::INTERVAL) AS new_users,
          (SELECT COUNT(*) FROM page_views WHERE created_at > NOW() - ($1 || ' days')::INTERVAL) AS page_views,
          (SELECT COUNT(*) FROM user_sessions WHERE started_at > NOW() - ($1 || ' days')::INTERVAL) AS sessions,
          (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE created_at > NOW() - ($1 || ' days')::INTERVAL) AS unique_sessions,
          (SELECT ROUND(AVG(duration_seconds)) FROM user_sessions WHERE started_at > NOW() - ($1 || ' days')::INTERVAL AND duration_seconds IS NOT NULL) AS avg_session_duration,
          (SELECT COUNT(*) FROM enrollments WHERE enrolled_at > NOW() - ($1 || ' days')::INTERVAL) AS enrollments,
          (SELECT COUNT(*) FROM ai_conversations WHERE created_at > NOW() - ($1 || ' days')::INTERVAL) AS ai_queries
      `, [days]),

      // Daily page views
      query(`
        SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*) AS views
        FROM page_views
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
        GROUP BY date ORDER BY date
      `, [days]),

      // Top pages
      query(`
        SELECT path, COUNT(*) AS views,
               COUNT(DISTINCT COALESCE(user_id::text, ip_address::text)) AS unique_visitors
        FROM page_views
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
        GROUP BY path ORDER BY views DESC LIMIT 20
      `, [days]),

      // Top countries (from IP — simplified, no GeoIP library needed)
      query(`
        SELECT
          COALESCE(country, 'Unknown') AS country,
          COUNT(*) AS visits
        FROM user_activity_logs
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
          AND country IS NOT NULL
        GROUP BY country ORDER BY visits DESC LIMIT 10
      `, [days]),

      // Session duration distribution
      query(`
        SELECT
          CASE
            WHEN duration_seconds < 30   THEN '< 30s'
            WHEN duration_seconds < 120  THEN '30s–2m'
            WHEN duration_seconds < 300  THEN '2–5m'
            WHEN duration_seconds < 600  THEN '5–10m'
            WHEN duration_seconds < 1800 THEN '10–30m'
            ELSE '> 30m'
          END AS bucket,
          COUNT(*) AS sessions
        FROM user_sessions
        WHERE started_at > NOW() - ($1 || ' days')::INTERVAL
          AND duration_seconds IS NOT NULL
        GROUP BY bucket ORDER BY MIN(duration_seconds)
      `, [days]),

      // New users daily
      query(`
        SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*) AS users
        FROM users
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
        GROUP BY date ORDER BY date
      `, [days]),

      // Active users (had at least one page view)
      query(`
        SELECT COUNT(DISTINCT user_id) AS active_users
        FROM page_views
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
          AND user_id IS NOT NULL
      `, [days]),

      // Device breakdown from user agent
      query(`
        SELECT
          CASE
            WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
            WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'Tablet'
            ELSE 'Desktop'
          END AS device,
          COUNT(*) AS sessions
        FROM user_sessions
        WHERE started_at > NOW() - ($1 || ' days')::INTERVAL
          AND user_agent IS NOT NULL
        GROUP BY device
      `, [days]),
    ]);

    const result = {
      totals: totals.rows[0],
      pageViewsDaily: pageViewsDaily.rows,
      topPages: topPages.rows,
      topCountries: topCountries.rows,
      sessionDuration: sessionStats.rows,
      newUsersDaily: newUsersDaily.rows,
      activeUsers: activeUsers.rows[0]?.active_users || 0,
      deviceBreakdown: deviceBreakdown.rows,
      period: days,
    };

    await cache.set(cacheKey, result, 300).catch(() => {}); // cache 5 min
    res.json(result);
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ── GET /api/analytics/realtime ───────────────────────────
// Active sessions in last 5 minutes
router.get('/realtime', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const [activeSessions, recentPageViews, activeUsers] = await Promise.all([
      query(`
        SELECT COUNT(*) AS active_sessions
        FROM user_sessions
        WHERE last_active_at > NOW() - INTERVAL '5 minutes' AND is_active = true
      `),
      query(`
        SELECT path, COUNT(*) AS views
        FROM page_views
        WHERE created_at > NOW() - INTERVAL '5 minutes'
        GROUP BY path ORDER BY views DESC LIMIT 10
      `),
      query(`
        SELECT COUNT(DISTINCT user_id) AS active_users
        FROM page_views
        WHERE created_at > NOW() - INTERVAL '5 minutes' AND user_id IS NOT NULL
      `),
    ]);

    res.json({
      activeSessions: parseInt(activeSessions.rows[0]?.active_sessions || 0),
      activeUsers: parseInt(activeUsers.rows[0]?.active_users || 0),
      recentPageViews: recentPageViews.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

// ── GET /api/analytics/users ──────────────────────────────
// Per-user activity breakdown
router.get('/users', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { page = 1, limit = 20, period = '30' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const days = parseInt(period) || 30;

  try {
    const { rows } = await query(`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(DISTINCT pv.id)         AS page_views,
        COUNT(DISTINCT us.id)         AS sessions,
        ROUND(AVG(us.duration_seconds)) AS avg_session_duration,
        MAX(us.last_active_at)        AS last_active,
        COUNT(DISTINCT e.id)          AS enrollments,
        COUNT(DISTINCT ac.id)         AS ai_queries
      FROM users u
      LEFT JOIN page_views pv ON pv.user_id = u.id
        AND pv.created_at > NOW() - ($3 || ' days')::INTERVAL
      LEFT JOIN user_sessions us ON us.user_id = u.id
        AND us.started_at > NOW() - ($3 || ' days')::INTERVAL
      LEFT JOIN enrollments e ON e.user_id = u.id
        AND e.enrolled_at > NOW() - ($3 || ' days')::INTERVAL
      LEFT JOIN ai_conversations ac ON ac.user_id = u.id
        AND ac.created_at > NOW() - ($3 || ' days')::INTERVAL
      GROUP BY u.id
      ORDER BY page_views DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset, days]);

    res.json({ users: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// ── GET /api/analytics/ip-logs ────────────────────────────
// Raw IP activity log for security monitoring
router.get('/ip-logs', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { ip, userId, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (ip)     { params.push(ip);     conditions.push(`ip_address = $${params.length}::inet`); }
  if (userId) { params.push(userId); conditions.push(`user_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit), offset);

  try {
    const { rows } = await query(`
      SELECT id, user_id, ip_address, user_agent, method, path,
             status_code, response_time_ms, created_at
      FROM user_activity_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ logs: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IP logs' });
  }
});

// ── GET /api/analytics/sessions ───────────────────────────
router.get('/sessions', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { page = 1, limit = 30, active } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const conditions = active === 'true' ? "WHERE is_active = true AND last_active_at > NOW() - INTERVAL '30 minutes'" : '';
    const { rows } = await query(`
      SELECT s.*, u.name AS user_name, u.email AS user_email
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ${conditions}
      ORDER BY s.last_active_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset]);

    res.json({ sessions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ── GET /api/analytics/courses ────────────────────────────
router.get('/courses', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period) || 30;

  try {
    const { rows } = await query(`
      SELECT
        c.id, c.title, c.category, c.total_students,
        COUNT(e.id) FILTER (WHERE e.enrolled_at > NOW() - ($1 || ' days')::INTERVAL) AS new_enrollments,
        ROUND(AVG(e.progress)) AS avg_progress,
        COUNT(e.id) FILTER (WHERE e.is_completed = true) AS completions
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.is_published = true
      GROUP BY c.id
      ORDER BY new_enrollments DESC NULLS LAST
      LIMIT 20
    `, [days]);

    res.json({ courses: rows, period: days });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course analytics' });
  }
});

// ── GET /api/analytics/videos ─────────────────────────────
router.get('/videos', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period) || 30;

  try {
    const { rows } = await query(`
      SELECT
        v.id, v.title, v.view_count, v.like_count,
        COUNT(va.id) FILTER (WHERE va.date > NOW() - ($1 || ' days')::INTERVAL) AS recent_views,
        SUM(va.watch_time_seconds) FILTER (WHERE va.date > NOW() - ($1 || ' days')::INTERVAL) AS watch_time
      FROM videos v
      LEFT JOIN video_analytics va ON va.video_id = v.id
      WHERE v.status = 'ready' AND v.visibility = 'public'
      GROUP BY v.id
      ORDER BY recent_views DESC NULLS LAST
      LIMIT 20
    `, [days]);

    res.json({ videos: rows, period: days });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video analytics' });
  }
});

// ── GET /api/analytics/ai ─────────────────────────────────
router.get('/ai', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period) || 30;

  try {
    const [daily, categories, topQuestions] = await Promise.all([
      query(`
        SELECT DATE_TRUNC('day', created_at)::date AS date,
               COUNT(*) AS conversations,
               SUM(message_count) AS messages
        FROM ai_conversations
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
        GROUP BY date ORDER BY date
      `, [days]),

      query(`
        SELECT category, COUNT(*) AS count
        FROM ai_conversations
        WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
        GROUP BY category ORDER BY count DESC
      `, [days]),

      query(`
        SELECT content AS question, created_at
        FROM ai_messages
        WHERE role = 'user'
          AND created_at > NOW() - ($1 || ' days')::INTERVAL
        ORDER BY created_at DESC LIMIT 20
      `, [days]),
    ]);

    res.json({
      daily: daily.rows,
      categories: categories.rows,
      topQuestions: topQuestions.rows,
      period: days,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI analytics' });
  }
});

// ── POST /api/analytics/aggregate-daily ───────────────────
// Cron job endpoint — aggregate yesterday's stats into site_analytics
router.post('/aggregate-daily', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  try {
    const [users, pageViews, sessions, enrollments, aiQueries, videoViews] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE DATE(created_at) = $1) AS new_today FROM users`, [dateStr]),
      query(`SELECT COUNT(*) AS total FROM page_views WHERE DATE(created_at) = $1`, [dateStr]),
      query(`SELECT COUNT(*) AS total, COUNT(DISTINCT COALESCE(user_id::text, ip_address::text)) AS unique_visitors FROM user_sessions WHERE DATE(started_at) = $1`, [dateStr]),
      query(`SELECT COUNT(*) AS total FROM enrollments WHERE DATE(enrolled_at) = $1`, [dateStr]),
      query(`SELECT COUNT(*) AS total FROM ai_conversations WHERE DATE(created_at) = $1`, [dateStr]),
      query(`SELECT COALESCE(SUM(views), 0) AS total FROM video_analytics WHERE date = $1`, [dateStr]),
    ]);

    await query(`
      INSERT INTO site_analytics
        (date, total_users, new_users, active_users, total_sessions,
         total_page_views, total_video_views, total_ai_queries, total_course_enrollments)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (date) DO UPDATE SET
        total_users              = $2,
        new_users                = $3,
        active_users             = $4,
        total_sessions           = $5,
        total_page_views         = $6,
        total_video_views        = $7,
        total_ai_queries         = $8,
        total_course_enrollments = $9
    `, [
      dateStr,
      parseInt(users.rows[0]?.total || 0),
      parseInt(users.rows[0]?.new_today || 0),
      parseInt(sessions.rows[0]?.unique_visitors || 0),
      parseInt(sessions.rows[0]?.total || 0),
      parseInt(pageViews.rows[0]?.total || 0),
      parseInt(videoViews.rows[0]?.total || 0),
      parseInt(aiQueries.rows[0]?.total || 0),
      parseInt(enrollments.rows[0]?.total || 0),
    ]);

    res.json({ aggregated: true, date: dateStr });
  } catch (err) {
    console.error('Aggregation error:', err);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// ── GET /api/analytics/history ────────────────────────────
// Historical site_analytics for charts
router.get('/history', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { days = '90' } = req.query;
  try {
    const { rows } = await query(`
      SELECT * FROM site_analytics
      WHERE date > NOW() - ($1 || ' days')::INTERVAL
      ORDER BY date ASC
    `, [parseInt(days) || 90]);
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
