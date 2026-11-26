'use strict';

const path = require('node:path');
const { Client } = require('pg');
const config = require('../../src/config');
const { loadSql } = require('../../scripts/sql-loader');

function sslOptions(url) {
  return url.includes('neon.tech') ? { rejectUnauthorized: false } : undefined;
}

async function withClient(fn) {
  const client = new Client({
    connectionString: config.migrationUrl,
    ssl: sslOptions(config.migrationUrl),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function prepareSchema() {
  const sql = loadSql(path.join(__dirname, '..', '..', 'database', 'schema.sql'));
  await withClient((client) => client.query(sql));
}

async function resetData() {
  await withClient(async (client) => {
    await client.query('TRUNCATE TABLE tasks RESTART IDENTITY');
    await client.query(`
      INSERT INTO tasks (title, description, status) VALUES
        ('Completed task', 'Done', 'completed'),
        ('Active task', 'In progress', 'in_progress'),
        ('Queued task', 'Not started', 'pending')
    `);
  });
}

module.exports = { withClient, prepareSchema, resetData };
