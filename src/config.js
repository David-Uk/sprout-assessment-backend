'use strict';

const path = require('node:path');
const dotenv = require('dotenv');

const root = path.join(__dirname, '..');

// neon deploy / env pull writes .env.local when no .env exists.
// Load .env.local first so it wins when both files are present.
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Run `neon env pull` or set it in .env.local.');
}

module.exports = {
  databaseUrl,
  // Direct connection for DDL; pooled URL is used by application traffic.
  migrationUrl: process.env.DATABASE_URL_UNPOOLED || databaseUrl,
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
