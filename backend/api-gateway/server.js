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
const { createLogger } = require('../../shared/logger');
const { activityLogger, ensureActivityTable } = require('./src/middleware/activityLogger');
const cron = require('node-cron');

const logger = createLogger('api-gateway');

const app = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  maxHttpBufferSize: 1e8,
});
app.set('io', io);
require('./src/realtime/socketHandlers')(io);

// ── Security middleware ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Global rate limiter ───────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '500'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
}));

// ── IP Activity Logger (records every request) ──────────
app.use(activityLogger);

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/hls', express.static(path.join(__dirname, 'hls'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'noor-al-ilm-api-gateway',
  version: '2.0.0',
  timestamp: new Date().toISOString(),
  uptime: Math.round(process.uptime()),
  environment: process.env.NODE_ENV || 'development',
}));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/users',        require('./src/routes/users'));
app.use('/api/courses',      require('./src/routes/courses'));
app.use('/api/quran',        require('./src/routes/quran'));
app.use('/api/forum',        require('./src/routes/forum'));
app.use('/api/media',        require('./src/routes/media'));
app.use('/api/ai',           require('./src/routes/ai'));
app.use('/api/videos',       require('./src/routes/videos'));
app.use('/api/upload',       require('./src/routes/upload'));
app.use('/api/stream',       require('./src/routes/streaming'));
app.use('/api/studio',       require('./src/routes/studio'));
app.use('/api/live',         require('./src/routes/live'));
app.use('/api/playlists',    require('./src/routes/playlists'));
app.use('/api/analytics',    require('./src/routes/analytics'));
app.use('/api/admin',        require('./src/routes/admin'));
app.use('/api/moderation',   require('./src/routes/moderation'));
app.use('/api/search',       require('./src/routes/search'));
app.use('/api/notifications',require('./src/routes/notifications'));

// ── GraphQL ───────────────────────────────────────────────
const { graphqlHTTP } = require('express-graphql');
const schema = require('./src/graphql/schema');
app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  graphiql: process.env.NODE_ENV !== 'production',
  context: { user: req.user },
})));

// ── Error handlers ────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.path }));
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`Noor Al-Ilm API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`GraphQL: http://localhost:${PORT}/graphql`);

  // Ensure activity logging table exists
  await ensureActivityTable();

  // Daily analytics aggregation — runs at 00:05 every day
  cron.schedule('5 0 * * *', async () => {
    try {
      const axios = require('axios');
      await axios.post(`http://localhost:${PORT}/api/analytics/aggregate-daily`, {}, {
        headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}` },
      });
      logger.info('Daily analytics aggregation completed');
    } catch (err) {
      logger.error('Daily aggregation cron failed:', err.message);
    }
  }, { timezone: 'Asia/Riyadh' });

  // Clean up old activity logs older than 90 days — runs weekly
  cron.schedule('0 2 * * 0', async () => {
    try {
      const { rowCount } = await require('../../shared/database').query(
        `DELETE FROM user_activity_logs WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      logger.info(`Cleaned ${rowCount} old activity log entries`);
    } catch (err) {
      logger.error('Activity log cleanup failed:', err.message);
    }
  });
});

module.exports = { app, io };
