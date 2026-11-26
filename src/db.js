'use strict';

const { Pool } = require('pg');
const config = require('./config');

// Neon requires TLS. PgBouncer (the -pooler host) works with node-postgres
// connection pooling for ordinary application queries.
const isNeon = config.databaseUrl.includes('neon.tech');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, close };
