const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, optionalAuth, requireCreator } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/videos
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, language, search, sort = 'recent', page = 1, limit = 24, creatorId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ["v.status = 'ready'", "v.visibility = 'public'", "v.is_approved = true"];

    if (category)  { params.push(category);  conditions.push(`v.category = $${params.length}`); }
    if (language)  { params.push(language);  conditions.push(`v.language = $${params.length}`); }
    if (creatorId) { params.push(creatorId); conditions.push(`v.creator_id = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(v.title ILIKE $${params.length} OR v.title_ar ILIKE $${params.length} OR v.description ILIKE $${params.length})`);
    }

    const orderMap = {
      recent:   'v.published_at DESC NULLS LAST',
      popular:  'v.view_count DESC',
      trending: '(v.view_count + v.like_count * 5) DESC',
      oldest:   'v.published_at ASC NULLS LAST',
    };
    const orderBy = orderMap[sort] || orderMap.recent;
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT v.id, v.title, v.title_ar, v.title_ru, v.thumbnail_url, v.ai_thumbnail_url,
             v.duration_seconds, v.view_count, v.like_count, v.category, v.language,
             v.ai_generated, v.published_at,
             c.channel_name, c.channel_slug, c.avatar_url as creator_avatar, c.is_verified as creator_verified
      FROM videos v JOIN creators c ON v.creator_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countRes = await query(`SELECT COUNT(*) FROM videos v WHERE ${conditions.join(' AND ')}`, params.slice(0, -2));
    res.json({ videos: rows, total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('List videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// GET /api/videos/feed/recommended
router.get('/feed/recommended', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    let videos;
    if (req.user) {
      const { rows: hist } = await query(`
        SELECT v.category, COUNT(*) as cnt FROM watch_history wh
        JOIN videos v ON wh.video_id = v.id WHERE wh.user_id = $1
        GROUP BY v.category ORDER BY cnt DESC LIMIT 3`, [req.user.id]);
      const cats = hist.map(h => h.category);
      const { rows } = await query(`
        SELECT v.id, v.title, v.title_ar, v.thumbnail_url, v.ai_thumbnail_url,
               v.duration_seconds, v.view_count, v.like_count, v.category, v.ai_generated,
               c.channel_name, c.channel_slug, c.is_verified as creator_verified
        FROM videos v JOIN creators c ON v.creator_id = c.id
        WHERE v.status='ready' AND v.visibility='public' AND v.is_approved=true
          AND v.id NOT IN (SELECT video_id FROM watch_history WHERE user_id=$1)
        ORDER BY CASE WHEN v.category = ANY($2) THEN 0 ELSE 1 END, (v.view_count + v.like_count*3) DESC
        LIMIT $3`, [req.user.id, cats, parseInt(limit)]);
      videos = rows;
    } else {
      const { rows } = await query(`
        SELECT v.id, v.title, v.title_ar, v.thumbnail_url, v.ai_thumbnail_url,
               v.duration_seconds, v.view_count, v.like_count, v.category, v.ai_generated,
               c.channel_name, c.channel_slug, c.is_verified as creator_verified
        FROM videos v JOIN creators c ON v.creator_id = c.id
        WHERE v.status='ready' AND v.visibility='public' AND v.is_approved=true
        ORDER BY (v.view_count + v.like_count*3) DESC LIMIT $1`, [parseInt(limit)]);
      videos = rows;
    }
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /api/videos/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT v.*, c.channel_name, c.channel_slug, c.avatar_url as creator_avatar,
             c.subscriber_count, c.is_verified as creator_verified, c.user_id as creator_user_id
      FROM videos v JOIN creators c ON v.creator_id = c.id
      WHERE v.id=$1 AND (v.visibility='public' OR v.creator_id=(SELECT id FROM creators WHERE user_id=$2))
    `, [req.params.id, req.user?.id || '00000000-0000-0000-0000-000000000000']);

    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    const video = rows[0];

    query('UPDATE videos SET view_count=view_count+1 WHERE id=$1', [req.params.id]).catch(() => {});

    const { rows: subtitles } = await query('SELECT language, label, file_url, is_auto_generated FROM subtitles WHERE video_id=$1', [req.params.id]);

    const { rows: related } = await query(`
      SELECT v.id, v.title, v.title_ar, v.thumbnail_url, v.ai_thumbnail_url,
             v.duration_seconds, v.view_count, v.ai_generated, c.channel_name, c.channel_slug
      FROM videos v JOIN creators c ON v.creator_id = c.id
      WHERE v.id!=$1 AND v.status='ready' AND v.visibility='public' AND v.is_approved=true
        AND (v.category=$2 OR v.creator_id=$3)
      ORDER BY v.view_count DESC LIMIT 12
    `, [req.params.id, video.category, video.creator_id]);

    let userLiked = null, userBookmarked = false, watchProgress = null, isSubscribed = false;
    if (req.user) {
      const [likeR, bookR, histR, subR] = await Promise.all([
        query('SELECT is_like FROM video_likes WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]),
        query('SELECT 1 FROM video_bookmarks WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]),
        query('SELECT last_position_seconds, completion_percent FROM watch_history WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]),
        query('SELECT 1 FROM subscriptions WHERE user_id=$1 AND creator_id=$2', [req.user.id, video.creator_id]),
      ]);
      userLiked = likeR.rows[0]?.is_like ?? null;
      userBookmarked = !!bookR.rows[0];
      watchProgress = histR.rows[0] || null;
      isSubscribed = !!subR.rows[0];
    }

    res.json({ video, subtitles, related, userLiked, userBookmarked, watchProgress, isSubscribed });
  } catch (err) {
    logger.error('Get video:', err);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// PUT /api/videos/:id
router.put('/:id', authenticate, requireCreator, async (req, res) => {
  const { title, title_ar, title_ru, description, category, tags, visibility } = req.body;
  try {
    const { rows } = await query('SELECT id FROM videos WHERE id=$1 AND creator_id=$2', [req.params.id, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    const { rows: updated } = await query(`
      UPDATE videos SET title=COALESCE($1,title), title_ar=COALESCE($2,title_ar), title_ru=COALESCE($3,title_ru),
        description=COALESCE($4,description), category=COALESCE($5,category),
        tags=COALESCE($6,tags), visibility=COALESCE($7,visibility), updated_at=NOW()
      WHERE id=$8 RETURNING *`, [title, title_ar, title_ru, description, category, tags, visibility, req.params.id]);
    res.json({ video: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query('SELECT id FROM videos WHERE id=$1 AND creator_id=$2', [req.params.id, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    await query("UPDATE videos SET status='deleted', visibility='private' WHERE id=$1", [req.params.id]);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// POST /api/videos/:id/like
router.post('/:id/like', authenticate, async (req, res) => {
  const { isLike = true } = req.body;
  try {
    const { rows: existing } = await query('SELECT is_like FROM video_likes WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]);
    if (existing[0]) {
      if (existing[0].is_like === isLike) {
        await query('DELETE FROM video_likes WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]);
        await query(`UPDATE videos SET ${isLike ? 'like_count' : 'dislike_count'}=GREATEST(0,${isLike ? 'like_count' : 'dislike_count'}-1) WHERE id=$1`, [req.params.id]);
        return res.json({ action: 'removed' });
      }
      await query('UPDATE video_likes SET is_like=$1 WHERE user_id=$2 AND video_id=$3', [isLike, req.user.id, req.params.id]);
      if (isLike) await query('UPDATE videos SET like_count=like_count+1, dislike_count=GREATEST(0,dislike_count-1) WHERE id=$1', [req.params.id]);
      else await query('UPDATE videos SET dislike_count=dislike_count+1, like_count=GREATEST(0,like_count-1) WHERE id=$1', [req.params.id]);
      return res.json({ action: 'switched', isLike });
    }
    await query('INSERT INTO video_likes (user_id, video_id, is_like) VALUES ($1,$2,$3)', [req.user.id, req.params.id, isLike]);
    await query(`UPDATE videos SET ${isLike ? 'like_count' : 'dislike_count'}=${isLike ? 'like_count' : 'dislike_count'}+1 WHERE id=$1`, [req.params.id]);
    res.json({ action: 'added', isLike });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// POST /api/videos/:id/bookmark
router.post('/:id/bookmark', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT 1 FROM video_bookmarks WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]);
    if (rows[0]) {
      await query('DELETE FROM video_bookmarks WHERE user_id=$1 AND video_id=$2', [req.user.id, req.params.id]);
      await query('UPDATE videos SET bookmark_count=GREATEST(0,bookmark_count-1) WHERE id=$1', [req.params.id]);
      return res.json({ bookmarked: false });
    }
    await query('INSERT INTO video_bookmarks (user_id, video_id) VALUES ($1,$2)', [req.user.id, req.params.id]);
    await query('UPDATE videos SET bookmark_count=bookmark_count+1 WHERE id=$1', [req.params.id]);
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// POST /api/videos/:id/watch-progress
router.post('/:id/watch-progress', optionalAuth, async (req, res) => {
  if (!req.user) return res.json({ saved: false });
  const { positionSeconds, completionPercent, deviceType, quality } = req.body;
  try {
    await query(`
      INSERT INTO watch_history (user_id, video_id, last_position_seconds, completion_percent, device_type, quality_watched, watch_duration_seconds)
      VALUES ($1,$2,$3,$4,$5,$6,$3)
      ON CONFLICT (user_id, video_id) DO UPDATE SET
        last_position_seconds=$3, completion_percent=$4, device_type=$5, quality_watched=$6,
        watch_duration_seconds=GREATEST(watch_history.watch_duration_seconds,$3), updated_at=NOW()
    `, [req.user.id, req.params.id, positionSeconds, completionPercent, deviceType, quality]);
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// GET /api/videos/:id/comments
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await query(`
      SELECT vc.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role,
             (SELECT COUNT(*) FROM video_comments r WHERE r.parent_id=vc.id) as reply_count
      FROM video_comments vc JOIN users u ON vc.user_id=u.id
      WHERE vc.video_id=$1 AND vc.parent_id IS NULL AND vc.is_approved=true
      ORDER BY vc.is_pinned DESC, vc.likes_count DESC, vc.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), offset]);
    res.json({ comments: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/videos/:id/comments
router.post('/:id/comments', authenticate,
  [body('content').trim().isLength({ min: 1, max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { content, parentId, timestampSeconds } = req.body;
    try {
      const { rows } = await query(`
        INSERT INTO video_comments (video_id, user_id, content, parent_id, timestamp_seconds)
        VALUES ($1,$2,$3,$4,$5) RETURNING *
      `, [req.params.id, req.user.id, content, parentId || null, timestampSeconds || null]);
      await query('UPDATE videos SET comment_count=comment_count+1 WHERE id=$1', [req.params.id]);
      req.app.get('io')?.of('/chat').to(`video:${req.params.id}`).emit('comment-added', rows[0]);
      res.status(201).json({ comment: rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to post comment' });
    }
  }
);

module.exports = router;
