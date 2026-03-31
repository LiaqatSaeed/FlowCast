const { Pool } = require('pg');
const logger = require('./logger');

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL env var (set automatically in Docker)
 * or individual PG_* vars for local development.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

/**
 * Execute a parameterized query.
 * @param {string} text  - SQL query with $1, $2 placeholders
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
    return result;
  } catch (err) {
    logger.error({ err, query: text }, 'Database query error');
    throw err;
  }
}

/**
 * Get a dedicated client for transactions.
 * Always call client.release() in a finally block.
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  // Wrap release to log slow transactions
  const timeout = setTimeout(() => {
    logger.warn('PostgreSQL client checkout exceeded 5 seconds');
  }, 5000);
  client.release = () => {
    clearTimeout(timeout);
    client.release = originalRelease;
    return originalRelease();
  };
  return client;
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { query, getClient, pool, testConnection };
