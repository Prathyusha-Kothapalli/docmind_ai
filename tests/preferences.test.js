const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('User Preferences & Custom Theme API', () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'preftest@docmind.ai', password: 'Demo@123password', name: 'Preferences Tester' });

    token = authRes.body.token;
  });

  it('should fetch user preferences', async () => {
    const res = await request(app)
      .get('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preferences.theme).toBeDefined();
  });

  it('should update theme preference to light', async () => {
    const res = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'light' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preferences.theme).toEqual('light');
  });

  it('should reject invalid theme option', async () => {
    const res = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'neon_pink' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });
});
