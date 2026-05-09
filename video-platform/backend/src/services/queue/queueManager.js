const Bull = require('bull');
const logger = require('../../utils/logger');

const REDIS = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

const JOB_OPTS = { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 50, removeOnFail: 100 };

let transcodingQueue, aiQueue, uploadQueue;

const initQueues = async () => {
  transcodingQueue = new Bull('video-transcoding', { redis: REDIS, defaultJobOptions: JOB_OPTS });
  aiQueue = new Bull('ai-generation', { redis: REDIS, defaultJobOptions: { ...JOB_OPTS, timeout: 300000 } });
  uploadQueue = new Bull('video-upload', { redis: REDIS, defaultJobOptions: JOB_OPTS });

  const { processTranscoding } = require('../../workers/transcodingWorker');
  const { processScriptGeneration, processVoiceover, processSubtitles, processThumbnail, processTranslation } = require('../../workers/aiWorker');
  const { processUpload } = require('../../workers/uploadWorker');

  transcodingQueue.process('transcode', 2, processTranscoding);
  aiQueue.process('generate-script', 3, processScriptGeneration);
  aiQueue.process('generate-voiceover', 2, processVoiceover);
  aiQueue.process('generate-subtitles', 3, processSubtitles);
  aiQueue.process('generate-thumbnail', 3, processThumbnail);
  aiQueue.process('translate-subtitles', 3, processTranslation);
  uploadQueue.process('upload-to-storage', 2, processUpload);

  [transcodingQueue, aiQueue, uploadQueue].forEach(q => {
    q.on('completed', job => logger.info(`Job ${job.id} [${job.name}] completed`));
    q.on('failed', (job, err) => logger.error(`Job ${job.id} [${job.name}] failed: ${err.message}`));
  });

  logger.info('Job queues initialized');
};

const addTranscodingJob = (data, opts = {}) => transcodingQueue?.add('transcode', data, opts);
const addAIJob = (type, data, opts = {}) => aiQueue?.add(type, data, opts);
const addUploadJob = (data, opts = {}) => uploadQueue?.add('upload-to-storage', data, opts);

const getQueueStats = async () => {
  const result = {};
  for (const [name, q] of [['transcoding', transcodingQueue], ['ai', aiQueue], ['upload', uploadQueue]]) {
    if (!q) continue;
    const [waiting, active, completed, failed] = await Promise.all([q.getWaitingCount(), q.getActiveCount(), q.getCompletedCount(), q.getFailedCount()]);
    result[name] = { waiting, active, completed, failed };
  }
  return result;
};

module.exports = { initQueues, addTranscodingJob, addAIJob, addUploadJob, getQueueStats };
