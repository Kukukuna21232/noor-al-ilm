const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../../../shared/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM forum_categories ORDER BY order_index');
    res.json({ categories: rows });
  } catch { res.status(500).json({ error: 'Failed to fetch categories' }); }
});

router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { category, sort = 'recent', page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = []; const conditions = ["p.is_approved = true"];
    if (category) { params.push(category); conditions.push(`fc.slug = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`p.title ILIKE $${params.length}`); }
    const orderBy = sort === 'trending' ? 'p.likes_count DESC, p.views_count DESC' : 'p.is_pinned DESC, p.created_at DESC';
    params.push(parseInt(limit), offset);
    const { rows } = await query(`SELECT p.*, u.name as author_name, u.role as author_role, u.avatar_url as author_avatar, fc.name as category_name, fc.slug as category_slug, fc.color as category_color FROM forum_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN forum_categories fc ON p.category_id = fc.id WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ posts: rows });
  } catch { res.status(500).json({ error: 'Failed to fetch posts' }); }
});

router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    await query('UPDATE forum_posts SET views_count = views_count + 1 WHERE id = $1', [req.params.id]);
    const { rows: post } = await query(`SELECT p.*, u.name as author_name, u.role as author_role, u.avatar_url as author_avatar, fc.name as category_name FROM forum_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN forum_categories fc ON p.category_id = fc.id WHERE p.id = $1 AND p.is_approved = true`, [req.params.id]);
    if (!post[0]) return res.status(404).json({ error: 'Post not found' });
    const { rows: replies } = await query(`SELECT r.*, u.name as author_name, u.role as author_role, u.avatar_url as author_avatar FROM forum_replies r LEFT JOIN users u ON r.author_id = u.id WHERE r.post_id = $1 AND r.is_approved = true ORDER BY r.created_at ASC`, [req.params.id]);
    let userLiked = false;
    if (req.user) { const { rows } = await query('SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, req.params.id]); userLiked = !!rows[0]; }
    res.json({ post: post[0], replies, userLiked });
  } catch { res.status(500).json({ error: 'Failed to fetch post' }); }
});

router.post('/posts', authenticate, [body('title').trim().isLength({ min: 5, max: 500 }), body('content').trim().isLength({ min: 10 }), body('category').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, content, category, tags = [] } = req.body;
  try {
    const { rows: cat } = await query('SELECT id FROM forum_categories WHERE slug = $1', [category]);
    if (!cat[0]) return res.status(400).json({ error: 'Invalid category' });
    const { rows } = await query('INSERT INTO forum_posts (title, content, author_id, category_id, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *', [title, content, req.user.id, cat[0].id, tags]);
    req.app.get('io')?.emit('new-post', { postId: rows[0].id });
    res.status(201).json({ post: rows[0] });
  } catch { res.status(500).json({ error: 'Failed to create post' }); }
});

router.post('/posts/:id/replies', authenticate, [body('content').trim().isLength({ min: 2 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { rows: post } = await query('SELECT id, is_locked FROM forum_posts WHERE id = $1', [req.params.id]);
    if (!post[0]) return res.status(404).json({ error: 'Post not found' });
    if (post[0].is_locked) return res.status(403).json({ error: 'Post is locked' });
    const { rows } = await query('INSERT INTO forum_replies (post_id, author_id, content) VALUES ($1,$2,$3) RETURNING *', [req.params.id, req.user.id, req.body.content]);
    await query('UPDATE forum_posts SET replies_count = replies_count + 1 WHERE id = $1', [req.params.id]);
    req.app.get('io')?.of('/forum').to(`post:${req.params.id}`).emit('reply-added', rows[0]);
    res.status(201).json({ reply: rows[0] });
  } catch { res.status(500).json({ error: 'Failed to post reply' }); }
});

router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    const existing = await query('SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, req.params.id]);
    if (existing.rows[0]) {
      await query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, req.params.id]);
      await query('UPDATE forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [req.params.id]);
      return res.json({ liked: false });
    }
    await query('INSERT INTO post_likes (user_id, post_id) VALUES ($1,$2)', [req.user.id, req.params.id]);
    await query('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ liked: true });
  } catch { res.status(500).json({ error: 'Failed to toggle like' }); }
});

module.exports = router;
