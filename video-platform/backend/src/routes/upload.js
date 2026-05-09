const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');
const { authenticate, requireCreator } = require('../middleware/auth');
const { addUploadJob } = require('../services/queue/queueManager');
const { getPresignedUploadUrl, uploadBuffer } = require('../services/storage/storageService');
const logger = require('../utils/logger');

const router = express.Router();
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
const MAX_SIZE = parseInt(process.env.MAX_VIDEO_SIZE_MB || '2048') * 1024 * 1024;
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/temp');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error(`Invalid type: ${file.mimetype}`)),
  limits: { fileSize: MAX_SIZE },
});

// POST /api/upload/video
router.post('/video', authenticate, requireCreator, uploadLimiter,
  upload.single('video'),
  [body('title').trim().isLength({ min: 3, max: 500 }), body('category').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const { title, title_ar, title_ru, description, category, language = 'ar', visibility = 'private', courseId } = req.body;
    const videoId = uuidv4();
    try {
      await query(`INSERT INTO videos (id, creator_id, title, title_ar, title_ru, description, category, language, visibility, status, course_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'processing',$10)`,
        [videoId, req.creator.id, title, title_ar, title_ru, description, category, language, visibility, courseId || null]);

      await addUploadJob({ videoId, localPath: req.file.path, originalName: req.file.originalname, mimeType: req.file.mimetype });

      res.status(202).json({ message: 'Upload accepted and processing', videoId, status: 'processing' });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      logger.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// POST /api/upload/presigned
router.post('/presigned', authenticate, requireCreator,
  [body('filename').notEmpty(), body('contentType').isIn(ALLOWED)],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { filename, contentType, title, category } = req.body;
    const videoId = uuidv4();
    const key = `originals/${videoId}/source${path.extname(filename)}`;
    try {
      const { uploadUrl } = await getPresignedUploadUrl(key, contentType);
      await query(`INSERT INTO videos (id, creator_id, title, category, status, original_file_key)
        VALUES ($1,$2,$3,$4,'draft',$5)`,
        [videoId, req.creator.id, title || filename, category || 'general', key]);
      res.json({ uploadUrl, videoId, key });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  }
);

// POST /api/upload/confirm/:videoId
router.post('/confirm/:videoId', authenticate, requireCreator, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, original_file_key FROM videos WHERE id=$1 AND creator_id=$2',
      [req.params.videoId, req.creator.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    await addUploadJob({ videoId: req.params.videoId, localPath: null, originalKey: rows[0].original_file_key, fromStorage: true });
    await query("UPDATE videos SET status='processing' WHERE id=$1", [req.params.videoId]);
    res.json({ message: 'Processing started', videoId: req.params.videoId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

// POST /api/upload/thumbnail/:videoId
router.post('/thumbnail/:videoId', authenticate, requireCreator,
  multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, f, cb) => cb(null, f.mimetype.startsWith('image/')) }).single('thumbnail'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    try {
      const { rows } = await query('SELECT id FROM videos WHERE id=$1 AND creator_id=$2', [req.params.videoId, req.creator.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
      const sharp = require('sharp');
      const optimized = await sharp(req.file.buffer).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
      const key = `thumbnails/${req.params.videoId}/custom.jpg`;
      const { url } = await uploadBuffer(optimized, key, 'image/jpeg');
      await query('UPDATE videos SET thumbnail_url=$1, thumbnail_key=$2 WHERE id=$3', [url, key, req.params.videoId]);
      res.json({ thumbnailUrl: url });
    } catch (err) {
      res.status(500).json({ error: 'Thumbnail upload failed' });
    }
  }
);

// GET /api/upload/status/:videoId
router.get('/status/:videoId', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT v.id, v.status, v.hls_manifest_key, v.thumbnail_url, v.duration_seconds,
             tj.progress as transcode_progress, tj.status as transcode_status
      FROM videos v LEFT JOIN transcoding_jobs tj ON v.id = tj.video_id
      WHERE v.id=$1`, [req.params.videoId]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;
