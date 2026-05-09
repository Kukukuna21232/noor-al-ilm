const { createClient } = require('redis');

let client = null;

const getRedis = async () => {
  if (!client) {
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });
    client.on('error', (err) => console.error('[Redis] Error:', err.message));
    client.on('connect', () => console.log('[Redis] Connected'));
    await client.connect();
  }
  return client;
};

// Cache helpers
const cache = {
  get: async (key) => {
    const r = await getRedis();
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  },
  set: async (key, value, ttlSeconds = 300) => {
    const r = await getRedis();
    await r.setEx(key, ttlSeconds, JSON.stringify(value));
  },
  del: async (key) => {
    const r = await getRedis();
    await r.del(key);
  },
  invalidatePattern: async (pattern) => {
    const r = await getRedis();
    const keys = await r.keys(pattern);
    if (keys.length > 0) await r.del(keys);
  },
};

// Rate limiter helper
const rateLimit = async (key, limit, windowSeconds) => {
  const r = await getRedis();
  const current = await r.incr(key);
  if (current === 1) await r.expire(key, windowSeconds);
  return { current, limit, allowed: current <= limit };
};

// Session store
const session = {
  set: async (sessionId, data, ttl = 86400) => {
    const r = await getRedis();
    await r.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
  },
  get: async (sessionId) => {
    const r = await getRedis();
    const val = await r.get(`session:${sessionId}`);
    return val ? JSON.parse(val) : null;
  },
  del: async (sessionId) => {
    const r = await getRedis();
    await r.del(`session:${sessionId}`);
  },
};

module.exports = { getRedis, cache, rateLimit, session };
