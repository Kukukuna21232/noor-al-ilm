require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true },
  maxHttpBufferSize: 1e8,
});
app.set('io', io);

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/hls', express.static(path.join(__dirname, '../hls'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

// ── Health ────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'noor-video-platform', uptime: process.uptime() }));

// ── Routes ────────────────────────────────────────────────
app.use('/api/videos',     require('./routes/videos'));
app.use('/api/stream',     require('./routes/streaming'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/studio',     require('./routes/studio'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/playlists',  require('./routes/playlists'));
app.use('/api/live',       require('./routes/live'));
app.use('/api/upload',     require('./routes/upload'));

// ── Socket handlers ───────────────────────────────────────
require('./services/streaming/socketHandlers')(io);

// ── Queue init ────────────────────────────────────────────
require('./services/queue/queueManager').initQueues()
  .catch(err => logger.warn('Queue init skipped (Redis unavailable):', err.message));

// ── Error handlers ────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.VIDEO_PORT || 5001;
server.listen(PORT, () => logger.info(`Video Platform API running on port ${PORT}`));

module.exports = { app, io };
