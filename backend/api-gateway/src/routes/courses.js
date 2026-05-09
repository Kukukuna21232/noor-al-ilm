const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const { query, withTransaction } = require('../../../shared/database');
const { cache } = require('../../../shared/redis');
const { authenticate, optionalAuth, authorize, requireVerified } = require('../middleware/auth');
const router = express.Router();

// ── GET /api/courses ──────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, level, language, search, sort = 'popular', page = 1, limit = 12, free, featured } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ['c.is_published = true'];

    if (category)  { params.push(category);  conditions.push(`c.category = $${params.length}`); }
    if (level)     { params.push(level);     conditions.push(`c.level = $${params.length}`); }
    if (language)  { params.push(language);  conditions.push(`c.language = $${params.length}`); }
    if (featured === 'true') conditions.push('c.is_featured = true');
    if (free === 'true') conditions.push('c.price = 0');
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.title ILIKE $${params.length} OR c.title_ar ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    const orderMap = {
      popular: 'c.total_students DESC',
      rating: 'c.rating DESC',
      newest: 'c.created_at DESC',
      price_asc: 'c.price ASC',
    };
    const orderBy = orderMap[sort] || orderMap.popular;
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT c.id, c.title, c.title_ar, c.title_ru, c.description, c.category, c.level,
             c.language, c.thumbnail_url, c.price, c.currency, c.duration_hours,
             c.total_lessons, c.total_students, c.rating, c.total_ratings,
             c.certificate_enabled, c.tags, c.is_featured, c.created_at,
             u.name as instructor_name, u.name_ar as instructor_name_ar, u.avatar_url as instructor_avatar
      FROM courses c LEFT JOIN users u ON c.instructor_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countRes = await query(`SELECT COUNT(*) FROM courses c WHERE ${conditions.join(' AND ')}`, params.slice(0, -2));
    res.json({ courses: rows, total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('List courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// ── GET /api/courses/:id ──────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const cacheKey = `course:${req.params.id}`;
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached && !req.user) return res.json(cached);

    const { rows } = await query(`
      SELECT c.*, u.name as instructor_name, u.name_ar as instructor_name_ar,
             u.avatar_url as instructor_avatar, u.bio as instructor_bio
      FROM courses c LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1 AND c.is_published = true
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Course not found' });

    const { rows: sections } = await query(`
      SELECT cs.*, json_agg(json_build_object(
        'id', cl.id, 'title', cl.title, 'title_ar', cl.title_ar,
        'lesson_type', cl.lesson_type, 'duration_seconds', cl.video_duration_seconds,
        'is_free', cl.is_free, 'order_index', cl.order_index
      ) ORDER BY cl.order_index) as lessons
      FROM course_sections cs
      LEFT JOIN course_lessons cl ON cs.id = cl.section_id
      WHERE cs.course_id = $1
      GROUP BY cs.id ORDER BY cs.order_index
    `, [req.params.id]);

    let enrollment = null;
    if (req.user) {
      const { rows: enr } = await query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [req.user.id, req.params.id]);
      enrollment = enr[0] || null;
    }

    const result = { course: rows[0], sections, enrollment };
    await cache.set(cacheKey, result, 300).catch(() => {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// ── POST /api/courses/:id/enroll ──────────────────────────
router.post('/:id/enroll', authenticate, requireVerified, async (req, res) => {
  try {
    const { rows: course } = await query('SELECT id, price FROM courses WHERE id = $1 AND is_published = true', [req.params.id]);
    if (!course[0]) return res.status(404).json({ error: 'Course not found' });

    const { rows } = await query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1,$2) ON CONFLICT (user_id, course_id) DO NOTHING RETURNING *',
      [req.user.id, req.params.id]
    );

    if (rows[0]) {
      await query('UPDATE courses SET total_students = total_students + 1 WHERE id = $1', [req.params.id]);
      await cache.del(`course:${req.params.id}`).catch(() => {});
    }

    res.json({ message: 'Enrolled successfully', enrollment: rows[0] || { already_enrolled: true } });
  } catch (err) {
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

// ── POST /api/courses/:id/progress ───────────────────────
router.post('/:id/progress', authenticate, async (req, res) => {
  const { lessonId } = req.body;
  try {
    const { rows: enr } = await query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [req.user.id, req.params.id]);
    if (!enr[0]) return res.status(403).json({ error: 'Not enrolled' });

    const completedLessons = [...new Set([...enr[0].completed_lessons, lessonId])];
    const { rows: total } = await query('SELECT COUNT(*) FROM course_lessons WHERE course_id = $1', [req.params.id]);
    const progress = Math.round((completedLessons.length / parseInt(total[0].count)) * 100);
    const isCompleted = progress === 100;

    await query(`
      UPDATE enrollments SET completed_lessons = $1, progress = $2, is_completed = $3,
        completed_at = $4 WHERE user_id = $5 AND course_id = $6
    `, [completedLessons, progress, isCompleted, isCompleted ? new Date() : null, req.user.id, req.params.id]);

    res.json({ progress, completedLessons, isCompleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// ── POST /api/courses (create) ────────────────────────────
router.post('/', authenticate, authorize('teacher', 'scholar', 'admin', 'superadmin'),
  [body('title').trim().notEmpty(), body('category').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, title_ar, title_ru, description, description_ar, category, level, price, language, tags, requirements, outcomes } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();

    try {
      const { rows } = await query(`
        INSERT INTO courses (title, title_ar, title_ru, description, description_ar, category, level, instructor_id, price, language, slug, tags, requirements, outcomes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
      `, [title, title_ar, title_ru, description, description_ar, category, level || 'beginner', req.user.id, price || 0, language || 'ar', slug, tags || [], requirements || [], outcomes || []]);

      res.status(201).json({ course: rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create course' });
    }
  }
);

// ── PUT /api/courses/:id ──────────────────────────────────
router.put('/:id', authenticate, authorize('teacher', 'scholar', 'admin', 'superadmin'), async (req, res) => {
  const { title, title_ar, description, category, level, price, is_published, is_featured, tags } = req.body;
  try {
    const { rows } = await query(`
      UPDATE courses SET
        title = COALESCE($1, title), title_ar = COALESCE($2, title_ar),
        description = COALESCE($3, description), category = COALESCE($4, category),
        level = COALESCE($5, level), price = COALESCE($6, price),
        is_published = COALESCE($7, is_published), is_featured = COALESCE($8, is_featured),
        tags = COALESCE($9, tags), updated_at = NOW()
      WHERE id = $10 AND (instructor_id = $11 OR $12 IN ('admin','superadmin'))
      RETURNING *
    `, [title, title_ar, description, category, level, price, is_published, is_featured, tags, req.params.id, req.user.id, req.user.role]);

    if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
    await cache.del(`course:${req.params.id}`).catch(() => {});
    res.json({ course: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// ── GET /api/courses/my/enrolled ──────────────────────────
router.get('/my/enrolled', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT e.*, c.title, c.title_ar, c.category, c.thumbnail_url, c.total_lessons,
             u.name as instructor_name
      FROM enrollments e JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    res.json({ enrollments: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// ── GET /api/courses/my/teaching ──────────────────────────
router.get('/my/teaching', authenticate, authorize('teacher', 'scholar', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, COUNT(e.id) as enrolled_count
      FROM courses c LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.instructor_id = $1 GROUP BY c.id ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json({ courses: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch teaching courses' });
  }
});

module.exports = router;
