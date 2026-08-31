const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('Search API Endpoints', () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'searchtester@docmind.ai', password: 'Demo@123password', name: 'Search Tester' });

    token = authRes.body.token;
  });

  it('should return error for empty search query', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should return search results for valid query', async () => {
    const res = await request(app)
      .get('/api/search?q=document')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});
