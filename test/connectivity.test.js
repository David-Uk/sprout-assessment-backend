'use strict';

const chai = require('chai');
const { expect } = chai;
const { query } = require('../src/db');
const app = require('../src/app');

describe('Database connectivity', () => {
  it('executes a query through the pg pool', async () => {
    const result = await query('SELECT 1 AS ok, current_database() AS db');
    expect(result.rows[0].ok).to.equal(1);
    expect(result.rows[0].db).to.be.a('string').and.not.empty;
  });

  it('reports the database as ready on GET /health', async () => {
    const res = await chai.request(app).get('/health');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ status: 'ok', database: true });
  });
});
