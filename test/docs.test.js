'use strict';

const chai = require('chai');
const { expect } = chai;
const app = require('../src/app');

describe('API documentation', () => {
  it('serves the Scalar reference page', async () => {
    const res = await chai.request(app).get('/docs');
    expect(res).to.have.status(200);
    expect(res).to.be.html;
    expect(res.text).to.include('id="api-reference"');
    expect(res.text).to.include('/docs/openapi.json');
    expect(res.text).to.include('cdn.jsdelivr.net/npm/@scalar/api-reference');
  });

  it('serves a valid OpenAPI document', async () => {
    const res = await chai.request(app).get('/docs/openapi.json');
    expect(res).to.have.status(200);
    expect(res.body.openapi).to.equal('3.1.0');
    expect(res.body.paths).to.include.all.keys('/health', '/api/tasks', '/api/tasks/{id}/status');
    expect(res.body.components.schemas.Status.enum).to.deep.equal([
      'pending',
      'in_progress',
      'completed',
    ]);
  });
});
