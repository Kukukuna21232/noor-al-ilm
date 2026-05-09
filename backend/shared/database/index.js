const { Pool } = require('pg');

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'noor_al_ilm',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD,
      max:      parseInt(process.env.DB_POOL_MAX || '30'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', (err) => console.error('[DB] Pool error:', err.message));
  }
  return pool;
};

const query = (text, params) => getPool().query(text, params);

const getClient = () => getPool().connect();

const withTransaction = async (fn) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getPool, query, getClient, withTransaction };
