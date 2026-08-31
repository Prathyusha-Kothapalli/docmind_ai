const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('Workspaces API Endpoints', () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'wstester@docmind.ai', password: 'Demo@123password', name: 'Workspace Tester' });

    token = authRes.body.token;
  });

  it('should create a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Finance Testing', description: 'Financial documents' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.workspace.name).toBe('Finance Testing');
  });

  it('should list all workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.workspaces.length).toBeGreaterThan(0);
  });
});
