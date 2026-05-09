const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');
const { authenticate, optionalAuth, requireCreator, authorize } = require('../middleware/auth');
const { addAIJob } = require('../services/queue/queueManager');
const { getPublicUrl, PROVIDER } = require('../services/storage/storageService');
const logger = require('../utils/logger');

// ── Streaming ─────────────────────────────────────────────
const streamRouter = express.Router();

streamRouter.get('/:videoId/manifest', optionalAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT v.id, v.hls_manifest_key, v.status, v.variants
      FROM videos v
      WHERE v.id=$1 AND v.status='ready'
        AND (v.visibility='public' OR v.creator_id=(SELECT id FROM creators WHERE user_id=$2))
    `, [req.params.videoId, req.user?.id || '00000000-0000-0000-0000-000000000000']);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found or not ready' });
    const manifestUrl = PROVIDER === 'local'
      ? `/hls/${rows[0].hls_manifest_key}`
      : getPublicUrl(rows[0].hls_manifest_key);
    res.json({ manifestUrl, variants: rows[0].variants, videoId: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get manifest' });
  }
});

streamRouter.get('/:videoId/subtitles', async (req, res) => {
  try {
    const { rows } = await query('SELECT language, label, file_url, is_auto_generated FROM subtitles WHERE video_id=$1', [req.params.videoId]);
    res.json({ subtitles: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subtitles' });
  }
});

streamRouter.get('/hls/:videoId/*', (req, res) => {
  if (PROVIDER !== 'local') return res.status(404).json({ error: 'Use CDN URL' });
  const filePath = path.join(__dirname, '../../hls', req.params.videoId, req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Segment not found' });
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', ext === '.m3u8' ? 'application/x-mpegURL' : 'video/MP2T');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', ext === '.m3u8' ? 'no-cache' : 'max-age=31536000');
  res.sendFile(filePath);
});

// ── AI ────────────────────────────────────────────────────
const aiRouter = express.Router();
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 });

aiRouter.post('/generate-script', authenticate, requireCreator, aiLimiter,
  [body('topic').trim().isLength({ min: 3, max: 500 }), body('language').isIn(['ar', 'ru', 'en']), body('duration').isInt({ min: 1, max: 30 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { topic, language = 'ar', duration = 5, style = 'educational', category = 'general', videoId } = req.body;
    const jobId = uuidv4();
    try {
      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'script_gen','queued',$4)`,
        [jobId, req.creator.id, videoId || null, JSON.stringify({ topic, language, duration, style, category })]);
      await addAIJob('generate-script', { jobId, videoId, topic, language, duration, style, category });
      res.status(202).json({ jobId, message: 'Script generation queued' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to queue script generation' });
    }
  }
);

aiRouter.post('/generate-voiceover', authenticate, requireCreator, aiLimiter,
  [body('text').trim().isLength({ min: 10, max: 5000 }), body('language').isIn(['ar', 'ru', 'en'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { text, language = 'ar', voice = 'alloy', videoId } = req.body;
    const jobId = uuidv4();
    try {
      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'voiceover','queued',$4)`,
        [jobId, req.creator.id, videoId || null, JSON.stringify({ language, voice })]);
      await addAIJob('generate-voiceover', { jobId, videoId, text, language, voice });
      res.status(202).json({ jobId, message: 'Voiceover generation queued' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to queue voiceover' });
    }
  }
);

aiRouter.post('/generate-subtitles/:videoId', authenticate, requireCreator, aiLimiter, async (req, res) => {
  const { language = 'ar' } = req.body;
  const jobId = uuidv4();
  try {
    const { rows } = await query('SELECT id FROM videos WHERE id=$1 AND creator_id=$2', [req.params.videoId, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
      VALUES ($1,$2,$3,'subtitle_gen','queued',$4)`,
      [jobId, req.creator.id, req.params.videoId, JSON.stringify({ language })]);
    await addAIJob('generate-subtitles', { jobId, videoId: req.params.videoId, audioPath: null, language });
    res.status(202).json({ jobId, message: 'Subtitle generation queued' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to queue subtitle generation' });
  }
});

aiRouter.post('/translate-subtitles/:videoId', authenticate, requireCreator, aiLimiter,
  [body('targetLanguage').isIn(['ar', 'ru', 'en']), body('sourceLanguage').isIn(['ar', 'ru', 'en'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { targetLanguage, sourceLanguage = 'ar' } = req.body;
    const jobId = uuidv4();
    try {
      const { rows: subs } = await query('SELECT * FROM subtitles WHERE video_id=$1 AND language=$2', [req.params.videoId, sourceLanguage]);
      if (!subs[0]) return res.status(404).json({ error: 'Source subtitles not found' });
      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'translation','queued',$4)`,
        [jobId, req.creator.id, req.params.videoId, JSON.stringify({ sourceLanguage, targetLanguage })]);
      await addAIJob('translate-subtitles', { jobId, videoId: req.params.videoId, sourceLanguage, targetLanguage, segments: [] });
      res.status(202).json({ jobId, message: 'Translation queued' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to queue translation' });
    }
  }
);

aiRouter.post('/generate-thumbnail/:videoId', authenticate, requireCreator, aiLimiter, async (req, res) => {
  const jobId = uuidv4();
  try {
    const { rows } = await query('SELECT id, title, category FROM videos WHERE id=$1 AND creator_id=$2', [req.params.videoId, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
      VALUES ($1,$2,$3,'thumbnail','queued',$4)`,
      [jobId, req.creator.id, req.params.videoId, JSON.stringify({ title: rows[0].title, category: rows[0].category })]);
    await addAIJob('generate-thumbnail', { jobId, videoId: req.params.videoId, title: rows[0].title, category: rows[0].category });
    res.status(202).json({ jobId, message: 'Thumbnail generation queued' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to queue thumbnail generation' });
  }
});

aiRouter.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM ai_generation_jobs WHERE id=$1', [req.params.jobId]);
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

aiRouter.get('/jobs', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM ai_generation_jobs WHERE creator_id=$1 ORDER BY created_at DESC LIMIT 50', [req.creator.id]);
    res.json({ jobs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ── Studio ────────────────────────────────────────────────
const studioRouter = express.Router();

studioRouter.get('/dashboard', authenticate, requireCreator, async (req, res) => {
  try {
    const [videos, stats, jobs] = await Promise.all([
      query(`SELECT v.id, v.title, v.status, v.visibility, v.view_count, v.like_count,
               v.thumbnail_url, v.duration_seconds, v.created_at, v.moderation_status
             FROM videos v WHERE v.creator_id=$1 ORDER BY v.created_at DESC LIMIT 20`, [req.creator.id]),
      query(`SELECT COUNT(*) as total_videos, SUM(view_count) as total_views, SUM(like_count) as total_likes,
               COUNT(*) FILTER (WHERE status='ready') as published_videos,
               COUNT(*) FILTER (WHERE status IN ('processing','transcoding')) as processing_videos
             FROM videos WHERE creator_id=$1`, [req.creator.id]),
      query(`SELECT id, job_type, status, progress, created_at, error_message
             FROM ai_generation_jobs WHERE creator_id=$1 ORDER BY created_at DESC LIMIT 10`, [req.creator.id]),
    ]);
    res.json({ videos: videos.rows, stats: stats.rows[0], recentJobs: jobs.rows, creator: req.creator });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

studioRouter.put('/videos/:id/publish', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query(`
      UPDATE videos SET visibility='public', moderation_status='pending', published_at=COALESCE(published_at,NOW())
      WHERE id=$1 AND creator_id=$2 AND status='ready' RETURNING id, visibility, published_at`,
      [req.params.id, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not ready or not found' });
    res.json({ video: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish video' });
  }
});

// ── Analytics ─────────────────────────────────────────────
const analyticsRouter = express.Router();

analyticsRouter.get('/video/:videoId', authenticate, requireCreator, async (req, res) => {
  try {
    const [daily, totals, devices] = await Promise.all([
      query('SELECT date, views, unique_viewers, watch_time_seconds, likes, comments FROM video_analytics WHERE video_id=$1 ORDER BY date DESC LIMIT 30', [req.params.videoId]),
      query('SELECT SUM(views) as total_views, SUM(watch_time_seconds) as total_watch_time, SUM(likes) as total_likes FROM video_analytics WHERE video_id=$1', [req.params.videoId]),
      query('SELECT device_type, COUNT(*) as count FROM watch_history WHERE video_id=$1 GROUP BY device_type', [req.params.videoId]),
    ]);
    res.json({ daily: daily.rows.reverse(), totals: totals.rows[0], devices: devices.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

analyticsRouter.get('/creator', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT va.date, SUM(va.views) as views, SUM(va.watch_time_seconds) as watch_time, SUM(va.likes) as likes
      FROM video_analytics va JOIN videos v ON va.video_id=v.id
      WHERE v.creator_id=$1 GROUP BY va.date ORDER BY va.date DESC LIMIT 30`, [req.creator.id]);
    res.json({ analytics: rows.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch creator analytics' });
  }
});

// ── Moderation ────────────────────────────────────────────
const moderationRouter = express.Router();

moderationRouter.get('/pending', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT v.id, v.title, v.thumbnail_url, v.category, v.created_at, v.moderation_status,
             c.channel_name FROM videos v JOIN creators c ON v.creator_id=c.id
      WHERE v.moderation_status='pending' AND v.status='ready' ORDER BY v.created_at ASC LIMIT 50`);
    res.json({ videos: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending' });
  }
});

moderationRouter.post('/review/:videoId', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  const { action, notes } = req.body;
  if (!['approve', 'reject', 'flag'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
  try {
    await query('UPDATE videos SET moderation_status=$1, is_approved=$2, moderation_notes=$3 WHERE id=$4',
      [statusMap[action], action === 'approve', notes || null, req.params.videoId]);
    res.json({ message: `Video ${action}d` });
  } catch (err) {
    res.status(500).json({ error: 'Moderation failed' });
  }
});

moderationRouter.post('/report', authenticate, async (req, res) => {
  const { videoId, reason, description } = req.body;
  if (!videoId || !reason) return res.status(400).json({ error: 'videoId and reason required' });
  try {
    await query('INSERT INTO content_reports (reporter_id, video_id, reason, description) VALUES ($1,$2,$3,$4)',
      [req.user.id, videoId, reason, description]);
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// ── Playlists ─────────────────────────────────────────────
const playlistsRouter = express.Router();

playlistsRouter.get('/', async (req, res) => {
  const { creatorId } = req.query;
  try {
    const { rows } = await query(`
      SELECT p.*, c.channel_name FROM playlists p JOIN creators c ON p.creator_id=c.id
      WHERE ($1::uuid IS NULL OR p.creator_id=$1) AND p.visibility='public'
      ORDER BY p.created_at DESC`, [creatorId || null]);
    res.json({ playlists: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

playlistsRouter.post('/', authenticate, requireCreator, async (req, res) => {
  const { title, description, visibility = 'public' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const { rows } = await query('INSERT INTO playlists (creator_id, title, description, visibility) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.creator.id, title, description, visibility]);
    res.status(201).json({ playlist: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

playlistsRouter.post('/:id/videos', authenticate, requireCreator, async (req, res) => {
  const { videoId } = req.body;
  try {
    const { rows: pl } = await query('SELECT id FROM playlists WHERE id=$1 AND creator_id=$2', [req.params.id, req.creator.id]);
    if (!pl[0]) return res.status(404).json({ error: 'Playlist not found' });
    const { rows: maxO } = await query('SELECT COALESCE(MAX(order_index),0) as max FROM playlist_videos WHERE playlist_id=$1', [req.params.id]);
    await query('INSERT INTO playlist_videos (playlist_id, video_id, order_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [req.params.id, videoId, maxO[0].max + 1]);
    await query('UPDATE playlists SET video_count=video_count+1 WHERE id=$1', [req.params.id]);
    res.json({ message: 'Video added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add video' });
  }
});

playlistsRouter.get('/:id/videos', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT v.id, v.title, v.title_ar, v.thumbnail_url, v.duration_seconds, v.view_count,
             pv.order_index, c.channel_name
      FROM playlist_videos pv JOIN videos v ON pv.video_id=v.id JOIN creators c ON v.creator_id=c.id
      WHERE pv.playlist_id=$1 AND v.status='ready' ORDER BY pv.order_index`, [req.params.id]);
    res.json({ videos: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist videos' });
  }
});

// ── Live ──────────────────────────────────────────────────
const liveRouter = express.Router();

liveRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT ls.id, ls.title, ls.thumbnail_url, ls.viewer_count, ls.started_at,
             c.channel_name, c.channel_slug, c.is_verified
      FROM live_streams ls JOIN creators c ON ls.creator_id=c.id
      WHERE ls.status='live' ORDER BY ls.viewer_count DESC`);
    res.json({ streams: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

liveRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT ls.*, c.channel_name, c.channel_slug FROM live_streams ls
      JOIN creators c ON ls.creator_id=c.id WHERE ls.id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Stream not found' });
    res.json({ stream: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

liveRouter.post('/create', authenticate, requireCreator, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const streamKey = crypto.randomBytes(24).toString('hex');
  const rtmpUrl = `${process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935'}/live`;
  try {
    const { rows } = await query(`
      INSERT INTO live_streams (id, creator_id, title, description, stream_key, rtmp_url, status)
      VALUES ($1,$2,$3,$4,$5,$6,'idle') RETURNING *`,
      [uuidv4(), req.creator.id, title, description, streamKey, rtmpUrl]);
    res.status(201).json({ stream: rows[0], streamKey, rtmpUrl,
      instructions: { obs: `Server: ${rtmpUrl}, Key: ${streamKey}`, ffmpeg: `ffmpeg -re -i input.mp4 -c:v libx264 -c:a aac -f flv ${rtmpUrl}/${streamKey}` } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

liveRouter.post('/:id/end', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query(`UPDATE live_streams SET status='ended', ended_at=NOW()
      WHERE id=$1 AND creator_id=$2 RETURNING *`, [req.params.id, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Stream not found' });
    req.app.get('io')?.of('/live').to(`stream:${req.params.id}`).emit('stream-ended', { streamId: req.params.id });
    res.json({ message: 'Stream ended', stream: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end stream' });
  }
});

module.exports = { streamRouter, aiRouter, studioRouter, analyticsRouter, moderationRouter, playlistsRouter, liveRouter };
