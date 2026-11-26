'use strict';

const { query } = require('../db');
const { buildSelect, buildInsert, buildUpdate, buildCount } = require('./sql-builder');

const TABLE = 'tasks';
const COLUMNS = ['id', 'title', 'description', 'status', 'created_at'];
const STATUS_COLUMNS = ['id', 'title', 'status', 'updated_at'];

async function list(status, { limit = 20, offset = 0 } = {}) {
  const where = status !== undefined ? { status } : {};
  const select = buildSelect({
    table: TABLE,
    columns: COLUMNS,
    where,
    orderBy: [{ column: 'created_at', direction: 'DESC' }],
    limit,
    offset,
  });
  const count = buildCount({ table: TABLE, where });
  const [result, totalResult] = await Promise.all([
    query(select.text, select.values),
    query(count.text, count.values),
  ]);
  return { rows: result.rows, total: totalResult.rows[0].count };
}

async function create({ title, description, status }) {
  const statement = buildInsert({
    table: TABLE,
    data: { title, description, status },
    returning: COLUMNS,
  });
  const result = await query(statement.text, statement.values);
  return result.rows[0];
}

async function updateStatus(id, status) {
  const statement = buildUpdate({
    table: TABLE,
    data: { status, updated_at: new Date() },
    where: { id },
    returning: STATUS_COLUMNS,
  });
  const result = await query(statement.text, statement.values);
  return result.rows[0] || null;
}

async function findById(id) {
  const statement = buildSelect({ table: TABLE, columns: COLUMNS, where: { id } });
  const result = await query(statement.text, statement.values);
  return result.rows[0] || null;
}

module.exports = { list, create, updateStatus, findById };
