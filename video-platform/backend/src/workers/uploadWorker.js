const fs = require('fs');
const { query } = require('../config/database');
const { uploadFile } = require('../services/storage/storageService');
const { addTranscodingJob } = require('../services/queue/queueManager');
const logger = require('../utils/logger');

const processUpload = async (job) => {
  const { videoId, localPath, originalName, mimeType } = job.data;
  try {
    await job.progress(10);
    const key = `originals/${videoId}/${originalName}`;
    if (localPath && fs.existsSync(localPath)) {
      await uploadFile(localPath, key, mimeType);
    }
    await query('UPDATE videos SET original_file_key=$1 WHERE id=$2', [key, videoId]);
    await job.progress(50);
    await addTranscodingJob({ videoId, inputPath: localPath, originalKey: key }, { priority: 1 });
    await query(`INSERT INTO transcoding_jobs (video_id, status, input_key) VALUES ($1,'queued',$2)`, [videoId, key]);
    await job.progress(100);
    logger.info(`Upload processed for ${videoId}, transcoding queued`);
    return { videoId, key };
  } catch (err) {
    await query("UPDATE videos SET status='failed' WHERE id=$1", [videoId]);
    logger.error(`Upload failed for ${videoId}:`, err);
    throw err;
  }
};

module.exports = { processUpload };
