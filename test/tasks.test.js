'use strict';

const chai = require('chai');
const { expect } = chai;
const app = require('../src/app');
const { resetData } = require('./helpers/db');

describe('Tasks API', () => {
  beforeEach(resetData);

  it('retrieves tasks successfully', async () => {
    const res = await chai.request(app).get('/api/tasks');
    expect(res).to.have.status(200);
    expect(res.body.data).to.be.an('array').with.length(3);
    expect(res.body.count).to.equal(3);
    expect(res.body.data[0]).to.include.all.keys('id', 'title', 'status', 'created_at');
  });

  it('creates a task successfully', async () => {
    const res = await chai
      .request(app)
      .post('/api/tasks')
      .send({ title: 'New task', description: 'Created in a test', status: 'pending' });
    expect(res).to.have.status(201);
    expect(res.body.data).to.include({ title: 'New task', status: 'pending' });
    expect(res.body.data.id).to.exist;
  });

  it('rejects invalid or missing data', async () => {
    const cases = [
      { description: 'Missing title' },
      { title: '   ' },
      { title: 'Bad status', status: 'unknown' },
      { title: 'x'.repeat(151) },
      { title: 'Long description', description: 'y'.repeat(1001) },
    ];
    for (const body of cases) {
      const res = await chai.request(app).post('/api/tasks').send(body);
      expect(res).to.have.status(400);
      expect(res.body.error.code).to.equal('VALIDATION_ERROR');
    }
  });

  it('updates a task status successfully', async () => {
    const list = await chai.request(app).get('/api/tasks');
    const task = list.body.data.find((t) => t.status === 'pending');
    const res = await chai
      .request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .send({ status: 'completed' });
    expect(res).to.have.status(200);
    expect(res.body.data.status).to.equal('completed');
  });

  it('returns 404 for a non-existent task', async () => {
    const res = await chai
      .request(app)
      .patch('/api/tasks/999999/status')
      .send({ status: 'completed' });
    expect(res).to.have.status(404);
    expect(res.body.error.code).to.equal('NOT_FOUND');
  });

  it('rejects a malformed id with 400', async () => {
    const res = await chai
      .request(app)
      .patch('/api/tasks/abc/status')
      .send({ status: 'completed' });
    expect(res).to.have.status(400);
  });

  it('filters tasks by status', async () => {
    const res = await chai.request(app).get('/api/tasks?status=completed');
    expect(res).to.have.status(200);
    expect(res.body.data).to.have.length(1);
    expect(res.body.data[0].status).to.equal('completed');
  });

  it('rejects an invalid status filter', async () => {
    const res = await chai.request(app).get('/api/tasks?status=wrong');
    expect(res).to.have.status(400);
  });

  it('paginates the task list', async () => {
    const res = await chai.request(app).get('/api/tasks?page=1&limit=2');
    expect(res).to.have.status(200);
    expect(res.body.data).to.have.length(2);
    expect(res.body).to.include({ count: 2, total: 3, page: 1, limit: 2 });
  });

  it('rejects invalid pagination', async () => {
    const res = await chai.request(app).get('/api/tasks?page=0');
    expect(res).to.have.status(400);
  });

  it('allows the configured CORS origin', async () => {
    const res = await chai.request(app).get('/api/tasks').set('Origin', 'http://localhost:5173');
    expect(res).to.have.status(200);
    expect(res.header['access-control-allow-origin']).to.equal('http://localhost:5173');
  });

  it('rejects an unknown CORS origin', async () => {
    const res = await chai.request(app).get('/api/tasks').set('Origin', 'https://evil.example');
    expect(res).to.have.status(403);
  });

  it('sets security headers', async () => {
    const res = await chai.request(app).get('/health');
    expect(res.header['x-content-type-options']).to.equal('nosniff');
  });
});
