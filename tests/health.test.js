const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('System Health & Performance Metrics API', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
  });

  it('should return ping status', async () => {
    const res = await request(app).get('/api/health/ping');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toEqual('healthy');
  });

  it('should return detailed system health and diagnostics metrics', async () => {
    const res = await request(app).get('/api/health/detailed');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.health.status).toEqual('operational');
    expect(res.body.health.database.status).toEqual('connected');
    expect(res.body.health.system.platform).toBeDefined();
  });
});
