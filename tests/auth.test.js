const request = require('supertest');
const app = require('../server');
const { initDatabase, run, exec } = require('../src/config/database');

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
  });

  afterAll(async () => {
    await exec('DELETE FROM users WHERE email LIKE "%test%"');
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@docmind.ai',
        password: 'Demo@123password',
        name: 'Test User'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('testuser@docmind.ai');
  });

  it('should fail login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@docmind.ai',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@docmind.ai',
        password: 'Demo@123password'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});
