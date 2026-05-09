const Bull = require('bull');

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

const DEFAULT_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

const queues = {};

const getQueue = (name, opts = {}) => {
  if (!queues[name]) {
    queues[name] = new Bull(name, {
      redis: REDIS_CONFIG,
      defaultJobOptions: { ...DEFAULT_OPTS, ...opts },
    });
  }
  return queues[name];
};

// Named queues
const QUEUE_NAMES = {
  EMAIL:        'email-notifications',
  TRANSCODING:  'video-transcoding',
  AI_GENERATE:  'ai-generation',
  AI_MODERATE:  'ai-moderation',
  SEARCH_INDEX: 'search-indexing',
  ANALYTICS:    'analytics-events',
  PUSH_NOTIFY:  'push-notifications',
};

const emailQueue       = () => getQueue(QUEUE_NAMES.EMAIL);
const transcodingQueue = () => getQueue(QUEUE_NAMES.TRANSCODING, { timeout: 600000 });
const aiQueue          = () => getQueue(QUEUE_NAMES.AI_GENERATE, { timeout: 300000 });
const moderationQueue  = () => getQueue(QUEUE_NAMES.AI_MODERATE);
const searchQueue      = () => getQueue(QUEUE_NAMES.SEARCH_INDEX);
const analyticsQueue   = () => getQueue(QUEUE_NAMES.ANALYTICS, { removeOnComplete: 500 });

module.exports = { getQueue, emailQueue, transcodingQueue, aiQueue, moderationQueue, searchQueue, analyticsQueue, QUEUE_NAMES };
