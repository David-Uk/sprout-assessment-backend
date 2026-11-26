'use strict';

const path = require('node:path');
const { Client } = require('pg');
const config = require('../src/config');
const { loadSql } = require('./sql-loader');

async function main() {
  const sql = loadSql(path.join(__dirname, '..', 'database', 'seed.sql'));
  const client = new Client({
    connectionString: config.migrationUrl,
    ssl: config.migrationUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    const result = await client.query(sql);
    console.log(`Seed applied successfully (${result.rowCount} new rows).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
