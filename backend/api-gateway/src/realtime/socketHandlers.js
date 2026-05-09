const { query } = require('../../../shared/database');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // ── Auth middleware for sockets ───────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await query('SELECT id, name, role FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
        if (rows[0]) socket.user = rows[0];
      }
    } catch {}
    next();
  });

  // ── Live stream namespace ─────────────────────────────
  const liveNS = io.of('/live');
  liveNS.on('connection', (socket) => {
    socket.on('join-stream', async ({ streamId }) => {
      socket.join(`stream:${streamId}`);
      await query('UPDATE live_streams SET viewer_count = viewer_count + 1 WHERE id = $1', [streamId]).catch(() => {});
      const { rows } = await query('SELECT viewer_count FROM live_streams WHERE id = $1', [streamId]).catch(() => ({ rows: [] }));
      liveNS.to(`stream:${streamId}`).emit('viewer-count', { count: rows[0]?.viewer_count || 0 });
    });

    socket.on('leave-stream', async ({ streamId }) => {
      socket.leave(`stream:${streamId}`);
      await query('UPDATE live_streams SET viewer_count = GREATEST(0, viewer_count - 1) WHERE id = $1', [streamId]).catch(() => {});
    });

    socket.on('live-chat', ({ streamId, message }) => {
      if (!message?.trim() || message.length > 500) return;
      liveNS.to(`stream:${streamId}`).emit('live-chat', {
        id: Date.now(),
        userName: socket.user?.name || 'زائر',
        userId: socket.user?.id,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
    });
  });

  // ── Video comments namespace ──────────────────────────
  const videoNS = io.of('/video');
  videoNS.on('connection', (socket) => {
    socket.on('join-video', ({ videoId }) => socket.join(`video:${videoId}`));
    socket.on('leave-video', ({ videoId }) => socket.leave(`video:${videoId}`));
    socket.on('new-comment', ({ videoId, comment }) => {
      videoNS.to(`video:${videoId}`).emit('comment-added', comment);
    });
  });

  // ── Forum namespace ───────────────────────────────────
  const forumNS = io.of('/forum');
  forumNS.on('connection', (socket) => {
    socket.on('join-post', ({ postId }) => socket.join(`post:${postId}`));
    socket.on('leave-post', ({ postId }) => socket.leave(`post:${postId}`));
    socket.on('new-reply', ({ postId, reply }) => {
      forumNS.to(`post:${postId}`).emit('reply-added', reply);
    });
    socket.on('typing', ({ postId }) => {
      socket.to(`post:${postId}`).emit('user-typing', { userName: socket.user?.name });
    });
  });

  // ── Notifications namespace ───────────────────────────
  const notifNS = io.of('/notifications');
  notifNS.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);
  });

  // ── Main namespace ────────────────────────────────────
  io.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);

    socket.on('watch-video-status', ({ videoId }) => socket.join(`video-status:${videoId}`));
    socket.on('watch-job', ({ jobId }) => socket.join(`job:${jobId}`));

    socket.on('disconnect', () => {});
  });

  // ── Emit helpers ──────────────────────────────────────
  io.emitToUser = (userId, event, data) => io.to(`user:${userId}`).emit(event, data);
  io.emitTranscodingProgress = (videoId, progress) => io.to(`video-status:${videoId}`).emit('transcoding-progress', { videoId, progress });
  io.emitVideoReady = (videoId, data) => io.to(`video-status:${videoId}`).emit('video-ready', { videoId, ...data });
  io.emitNotification = (userId, notification) => notifNS.to(`user:${userId}`).emit('notification', notification);
};
