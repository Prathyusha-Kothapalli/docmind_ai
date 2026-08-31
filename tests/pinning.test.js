const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('Document Pinning & Favorites API', () => {
  let token;
  let workspaceId;
  let docId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'pintest@docmind.ai', password: 'Demo@123password', name: 'Pin Tester' });

    token = authRes.body.token;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pin Workspace', description: 'Testing pinning feature' });

    workspaceId = wsRes.body.workspace.id;

    const docRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Pinnable Document')
      .field('workspace_id', workspaceId)
      .attach('file', Buffer.from('Testing document pinning and favorite features.'), 'pin_sample.txt');

    docId = docRes.body.document.id;
  });

  it('should toggle document pin status to true', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/pin`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pinned).toBe(true);
  });

  it('should filter documents by pinned status', async () => {
    const res = await request(app)
      .get('/api/documents?pinned=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.documents.length).toBeGreaterThan(0);
    expect(res.body.documents[0].is_pinned).toEqual(1);
  });

  it('should toggle document pin status back to false', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/pin`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.pinned).toBe(false);
  });
});
