'use strict';

const chai = require('chai');
const {
  buildSelect,
  buildInsert,
  buildUpdate,
  buildDelete,
  buildCount,
  identifier,
} = require('../src/models/sql-builder');

const { expect } = chai;

describe('SQL builder', () => {
  it('builds a SELECT with custom columns, filters, ordering and limit', () => {
    const statement = buildSelect({
      table: 'tasks',
      columns: ['id', 'title'],
      where: { status: 'pending' },
      orderBy: [{ column: 'created_at', direction: 'DESC' }],
      limit: 10,
    });
    expect(statement.text).to.equal(
      'SELECT "id", "title" FROM "tasks" WHERE "status" = $1 ORDER BY "created_at" DESC LIMIT $2'
    );
    expect(statement.values).to.deep.equal(['pending', 10]);
  });

  it('builds INSERT, UPDATE, DELETE and COUNT with parameterised values', () => {
    expect(buildInsert({ table: 'tasks', data: { title: 'T', status: 'pending' }, returning: ['id'] }))
      .to.deep.equal({
        text: 'INSERT INTO "tasks" ("title", "status") VALUES ($1, $2) RETURNING "id"',
        values: ['T', 'pending'],
      });

    expect(buildUpdate({ table: 'tasks', data: { status: 'completed' }, where: { id: 7 }, returning: ['id'] }))
      .to.deep.equal({
        text: 'UPDATE "tasks" SET "status" = $1 WHERE "id" = $2 RETURNING "id"',
        values: ['completed', 7],
      });

    expect(buildDelete({ table: 'tasks', where: { id: 7 } })).to.deep.equal({
      text: 'DELETE FROM "tasks" WHERE "id" = $1',
      values: [7],
    });

    expect(buildCount({ table: 'tasks', where: { status: 'pending' } })).to.deep.equal({
      text: 'SELECT count(*)::int AS count FROM "tasks" WHERE "status" = $1',
      values: ['pending'],
    });
  });

  it('rejects unsafe identifiers and sort directions', () => {
    expect(() => identifier('tasks; DROP TABLE users')).to.throw('Invalid SQL identifier');
    expect(() => buildSelect({ table: 'tasks', orderBy: [{ column: 'id', direction: 'DROP' }] })).to.throw(
      'Invalid sort direction'
    );
  });
});
