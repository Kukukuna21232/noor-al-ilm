const express = require('express');
const { query } = require('../../../shared/database');
const { cache } = require('../../../shared/redis');
const { authenticate, authorize } = require('../middleware/auth');
const { getQueueStats } = require('../../../shared/queue');
const router = express.Router();

// All admin routes require admin/superadmin
router.use(authenticate, authorize('admin', 'superadmin'));

// ── GET /api/admin/stats ──────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'admin:stats';
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached) return res.json(cached);

    const [users, courses, videos, posts, aiConvs, enrollments, reports] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_month,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_week,
               COUNT(*) FILTER (WHERE is_active = false) as suspended FROM users`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_published = true) as published FROM courses`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'ready') as ready,
               COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_moderation FROM videos`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_approved = false) as pending FROM forum_posts`),
      query(`SELECT COUNT(*) as total, SUM(message_count) as total_messages FROM ai_conversations`),
      query(`SELECT COUNT(*) as total FROM enrollments`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pending') as pending FROM content_reports`),
    ]);

    // Growth data (last 30 days)
    const { rows: growth } = await query(`
      SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as users
      FROM users WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY date ORDER BY date
    `);

    // Top courses
    const { rows: topCourses } = await query(`
      SELECT c.title, c.total_students, c.rating, u.name as instructor
      FROM courses c LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.is_published = true ORDER BY c.total_students DESC LIMIT 5
    `);

    // Queue stats
    let queueStats = {};
    try { queueStats = await getQueueStats(); } catch {}

    const result = {
      users: users.rows[0],
      courses: courses.rows[0],
      videos: videos.rows[0],
      posts: posts.rows[0],
      aiConversations: aiConvs.rows[0],
      enrollments: enrollments.rows[0],
      reports: reports.rows[0],
      growth,
      topCourses,
      queueStats,
    };

    await cache.set(cacheKey, result, 60).catch(() => {});
    res.json(result);
  } catch (err) {
    console.error('Admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (role)   { params.push(role);   conditions.push(`role = $${params.length}`); }
    if (status === 'active')    conditions.push('is_active = true');
    if (status === 'suspended') conditions.push('is_active = false');
    if (status === 'unverified') conditions.push('is_verified = false');
    if (search) { params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), offset);

    const { rows } = await query(
      `SELECT id, name, email, role, is_verified, is_active, reputation_points, last_login, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));
    res.json({ users: rows, total: parseInt(count.rows[0].count) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PUT /api/admin/users/:id ──────────────────────────────
router.put('/users/:id', async (req, res) => {
  const { role, is_active, is_verified } = req.body;
  try {
    const updates = []; const params = [];
    if (role !== undefined)        { params.push(role);        updates.push(`role = $${params.length}`); }
    if (is_active !== undefined)   { params.push(is_active);   updates.push(`is_active = $${params.length}`); }
    if (is_verified !== undefined) { params.push(is_verified); updates.push(`is_verified = $${params.length}`); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, name, email, role, is_active`, params);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    await cache.del(`user:${req.params.id}`).catch(() => {});
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete own account' });
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await cache.del(`user:${req.params.id}`).catch(() => {});
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── GET /api/admin/content/pending ───────────────────────
router.get('/content/pending', async (req, res) => {
  try {
    const [posts, videos, reports] = await Promise.all([
      query(`SELECT p.id, p.title, p.created_at, 'post' as type, u.name as author_name
             FROM forum_posts p LEFT JOIN users u ON p.author_id = u.id
             WHERE p.is_approved = false ORDER BY p.created_at DESC LIMIT 20`),
      query(`SELECT v.id, v.title, v.created_at, 'video' as type, c.channel_name as author_name
             FROM videos v LEFT JOIN creators c ON v.creator_id = c.id
             WHERE v.moderation_status = 'pending' AND v.status = 'ready' ORDER BY v.created_at ASC LIMIT 20`),
      query(`SELECT cr.*, u.name as reporter_name FROM content_reports cr
             LEFT JOIN users u ON cr.reporter_id = u.id WHERE cr.status = 'pending' ORDER BY cr.created_at DESC LIMIT 20`),
    ]);
    res.json({ posts: posts.rows, videos: videos.rows, reports: reports.rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch pending content' });
  }
});

// ── POST /api/admin/content/:id/moderate ─────────────────
router.post('/content/:id/moderate', async (req, res) => {
  const { action, type, notes } = req.body;
  if (!['approve', 'reject', 'flag'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  try {
    if (type === 'post') {
      if (action === 'approve') await query('UPDATE forum_posts SET is_approved = true WHERE id = $1', [req.params.id]);
      else await query('DELETE FROM forum_posts WHERE id = $1', [req.params.id]);
    } else if (type === 'video') {
      const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
      await query('UPDATE videos SET moderation_status = $1, is_approved = $2, moderation_notes = $3 WHERE id = $4',
        [statusMap[action], action === 'approve', notes || null, req.params.id]);
    }
    res.json({ message: `Content ${action}d` });
  } catch {
    res.status(500).json({ error: 'Moderation failed' });
  }
});

// ── GET /api/admin/ai-monitoring ─────────────────────────
router.get('/ai-monitoring', async (req, res) => {
  try {
    const [conversations, flagged, jobs] = await Promise.all([
      query(`SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count, SUM(message_count) as messages
             FROM ai_conversations WHERE created_at > NOW() - INTERVAL '30 days'
             GROUP BY date ORDER BY date`),
      query(`SELECT am.*, ac.user_id FROM ai_messages am JOIN ai_conversations ac ON am.conversation_id = ac.id
             WHERE am.flagged = true ORDER BY am.created_at DESC LIMIT 20`),
      query(`SELECT job_type, status, COUNT(*) as count FROM ai_generation_jobs
             WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY job_type, status`),
    ]);
    res.json({ conversations: conversations.rows, flaggedMessages: flagged.rows, jobStats: jobs.rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch AI monitoring data' });
  }
});

// ── GET /api/admin/analytics ──────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const [userGrowth, videoViews, courseEnrollments, topVideos] = await Promise.all([
      query(`SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as users
             FROM users WHERE created_at > NOW() - INTERVAL '${days} days' GROUP BY date ORDER BY date`),
      query(`SELECT DATE_TRUNC('day', watched_at)::date as date, COUNT(*) as views
             FROM watch_history WHERE watched_at > NOW() - INTERVAL '${days} days' GROUP BY date ORDER BY date`),
      query(`SELECT DATE_TRUNC('day', enrolled_at)::date as date, COUNT(*) as enrollments
             FROM enrollments WHERE enrolled_at > NOW() - INTERVAL '${days} days' GROUP BY date ORDER BY date`),
      query(`SELECT v.title, v.view_count, v.like_count, c.channel_name
             FROM videos v LEFT JOIN creators c ON v.creator_id = c.id
             WHERE v.status = 'ready' ORDER BY v.view_count DESC LIMIT 10`),
    ]);

    res.json({ userGrowth: userGrowth.rows, videoViews: videoViews.rows, courseEnrollments: courseEnrollments.rows, topVideos: topVideos.rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ── POST /api/admin/creators/approve/:id ─────────────────
router.post('/creators/approve/:id', async (req, res) => {
  try {
    const { rows } = await query('UPDATE creators SET is_approved = true WHERE id = $1 RETURNING *', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Creator not found' });
    res.json({ message: 'Creator approved', creator: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to approve creator' });
  }
});

module.exports = router;
