'use strict';

// Small query builders. Every user-supplied value becomes a parameter; only
// validated identifiers are interpolated into the SQL text.

function identifier(name) {
  if (typeof name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

function columnList(columns) {
  return columns.map((column) => (column === '*' ? '*' : identifier(column))).join(', ');
}

function buildWhere(filters = {}, offset = 1) {
  const entries = Object.entries(filters);
  if (entries.length === 0) return { clause: '', values: [] };
  return {
    clause: entries.map(([column], i) => `${identifier(column)} = $${offset + i}`).join(' AND '),
    values: entries.map(([, value]) => value),
  };
}

function buildSelect({ table, columns = ['*'], where = {}, orderBy = [], limit, offset }) {
  const wherePart = buildWhere(where);
  let text = `SELECT ${columnList(columns)} FROM ${identifier(table)}`;
  if (wherePart.clause) text += ` WHERE ${wherePart.clause}`;

  if (orderBy.length > 0) {
    const order = orderBy
      .map(({ column, direction = 'ASC' }) => {
        const dir = String(direction).toUpperCase();
        if (dir !== 'ASC' && dir !== 'DESC') throw new Error(`Invalid sort direction: ${direction}`);
        return `${identifier(column)} ${dir}`;
      })
      .join(', ');
    text += ` ORDER BY ${order}`;
  }

  const values = [...wherePart.values];
  if (limit !== undefined) {
    values.push(limit);
    text += ` LIMIT $${values.length}`;
  }
  if (offset !== undefined) {
    values.push(offset);
    text += ` OFFSET $${values.length}`;
  }
  return { text, values };
}

function buildInsert({ table, data, returning = [] }) {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error('INSERT requires at least one column');
  const columns = columnList(entries.map(([column]) => column));
  const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
  let text = `INSERT INTO ${identifier(table)} (${columns}) VALUES (${placeholders})`;
  if (returning.length > 0) text += ` RETURNING ${columnList(returning)}`;
  return { text, values: entries.map(([, value]) => value) };
}

function buildUpdate({ table, data, where = {}, returning = [] }) {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error('UPDATE requires at least one column');
  const set = entries.map(([column], i) => `${identifier(column)} = $${i + 1}`).join(', ');
  const wherePart = buildWhere(where, entries.length + 1);
  let text = `UPDATE ${identifier(table)} SET ${set}`;
  if (wherePart.clause) text += ` WHERE ${wherePart.clause}`;
  if (returning.length > 0) text += ` RETURNING ${columnList(returning)}`;
  return { text, values: [...entries.map(([, value]) => value), ...wherePart.values] };
}

function buildDelete({ table, where = {}, returning = [] }) {
  const wherePart = buildWhere(where);
  let text = `DELETE FROM ${identifier(table)}`;
  if (wherePart.clause) text += ` WHERE ${wherePart.clause}`;
  if (returning.length > 0) text += ` RETURNING ${columnList(returning)}`;
  return { text, values: wherePart.values };
}

function buildCount({ table, where = {} }) {
  const wherePart = buildWhere(where);
  let text = `SELECT count(*)::int AS count FROM ${identifier(table)}`;
  if (wherePart.clause) text += ` WHERE ${wherePart.clause}`;
  return { text, values: wherePart.values };
}

module.exports = { identifier, buildSelect, buildInsert, buildUpdate, buildDelete, buildCount };
