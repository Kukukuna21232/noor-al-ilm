const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { runTranscodingPipeline } = require('../services/transcoding/ffmpegService');
const { uploadHLSDirectory, uploadFile } = require('../services/storage/storageService');
const logger = require('../utils/logger');

const processTranscoding = async (job) => {
  const { videoId, inputPath } = job.data;
  logger.info(`Transcoding job started: ${videoId}`);

  try {
    await query("UPDATE videos SET status = 'transcoding' WHERE id = $1", [videoId]);
    await query("UPDATE transcoding_jobs SET status = 'processing', started_at = NOW(), worker_id = $1 WHERE video_id = $2",
      [String(process.pid), videoId]);

    const result = await runTranscodingPipeline(inputPath, videoId, async (progress) => {
      await job.progress(Math.round(progress * 0.7));
      await query('UPDATE transcoding_jobs SET progress = $1 WHERE video_id = $2', [Math.round(progress * 0.7), videoId]);
    });

    const hlsDir = path.join(__dirname, '../../hls', videoId);
    const { masterUrl } = await uploadHLSDirectory(hlsDir, videoId, async (p) => {
      await job.progress(70 + Math.round(p * 0.2));
    });

    let thumbnailUrl = null;
    if (result.thumbnail) {
      const thumbLocal = path.join(__dirname, '../../uploads', result.thumbnail);
      if (fs.existsSync(thumbLocal)) {
        const { url } = await uploadFile(thumbLocal, result.thumbnail, 'image/jpeg');
        thumbnailUrl = url;
      }
    }

    await query(`
      UPDATE videos SET
        status = 'ready', hls_manifest_key = $1, variants = $2,
        thumbnail_url = COALESCE(thumbnail_url, $3),
        duration_seconds = $4, file_size_bytes = $5,
        resolution = $6, fps = $7, codec = $8, format = $9, updated_at = NOW()
      WHERE id = $10
    `, [
      masterUrl, JSON.stringify(result.variants), thumbnailUrl,
      result.metadata.duration, result.metadata.fileSize,
      `${result.metadata.width}x${result.metadata.height}`,
      result.metadata.fps, result.metadata.videoCodec, result.metadata.format,
      videoId,
    ]);

    await query("UPDATE transcoding_jobs SET status = 'completed', progress = 100, completed_at = NOW() WHERE video_id = $1", [videoId]);

    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    // Notify via socket
    const io = require('../server').io;
    io?.emitVideoReady?.(videoId, { masterUrl, variants: result.variants });

    logger.info(`Transcoding complete: ${videoId}`);
    return { videoId, masterUrl };
  } catch (err) {
    logger.error(`Transcoding failed ${videoId}:`, err);
    await query("UPDATE videos SET status = 'failed' WHERE id = $1", [videoId]);
    await query("UPDATE transcoding_jobs SET status = 'failed', error_message = $1 WHERE video_id = $2", [err.message, videoId]);
    throw err;
  }
};

module.exports = { processTranscoding };
