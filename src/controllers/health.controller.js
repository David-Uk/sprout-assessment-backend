'use strict';

const { query } = require('../db');

async function check(_req, res, next) {
  try {
    const result = await query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: result.rows[0].ok === 1 });
  } catch (err) {
    next(err);
  }
}

module.exports = { check };
