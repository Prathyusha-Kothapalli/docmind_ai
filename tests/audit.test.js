const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('Audit Logging System API', () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'audittest@docmind.ai', password: 'Demo@123password', name: 'Audit Tester' });

    token = authRes.body.token;
  });

  it('should create a manual audit log entry', async () => {
    const res = await request(app)
      .post('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'USER_SETTINGS_UPDATE',
        entity_type: 'user',
        details: 'User updated theme to dark mode'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it('should fetch audit log history', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toEqual('USER_SETTINGS_UPDATE');
  });
});
