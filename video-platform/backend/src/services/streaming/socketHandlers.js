const { query } = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = (io) => {
  const liveNS = io.of('/live');
  const chatNS = io.of('/chat');

  // ── Live stream namespace ─────────────────────────────
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
      const { rows } = await query('SELECT viewer_count FROM live_streams WHERE id = $1', [streamId]).catch(() => ({ rows: [] }));
      liveNS.to(`stream:${streamId}`).emit('viewer-count', { count: rows[0]?.viewer_count || 0 });
    });

    socket.on('live-chat', ({ streamId, message, userName }) => {
      if (!message?.trim() || message.length > 500) return;
      liveNS.to(`stream:${streamId}`).emit('live-chat', {
        id: Date.now(),
        userName: userName || 'زائر',
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => logger.info(`Live viewer disconnected: ${socket.id}`));
  });

  // ── Video comments namespace ──────────────────────────
  chatNS.on('connection', (socket) => {
    socket.on('join-video', ({ videoId }) => socket.join(`video:${videoId}`));
    socket.on('leave-video', ({ videoId }) => socket.leave(`video:${videoId}`));
    socket.on('new-comment', ({ videoId, comment }) => {
      chatNS.to(`video:${videoId}`).emit('comment-added', comment);
    });
  });

  // ── Main namespace for job progress ──────────────────
  io.on('connection', (socket) => {
    socket.on('watch-video-status', ({ videoId }) => socket.join(`video-status:${videoId}`));
  });

  io.emitTranscodingProgress = (videoId, progress) =>
    io.to(`video-status:${videoId}`).emit('transcoding-progress', { videoId, progress });

  io.emitVideoReady = (videoId, data) =>
    io.to(`video-status:${videoId}`).emit('video-ready', { videoId, ...data });
};
