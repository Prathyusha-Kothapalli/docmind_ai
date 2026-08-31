const request = require('supertest');
const app = require('../server');
const { initDatabase, run, get } = require('../src/config/database');

describe('Documents API Endpoints', () => {
  let token;
  let workspaceId;
  let docId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    // Create user & workspace for testing
    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'doctest@docmind.ai', password: 'Demo@123password', name: 'Doc Tester' });

    token = authRes.body.token;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Doc Workspace', description: 'Testing workspace' });

    workspaceId = wsRes.body.workspace.id;
  });

  it('should upload a new document file', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Unit Test Document')
      .field('workspace_id', workspaceId)
      .attach('file', Buffer.from('Machine learning algorithms process data locally without external cloud dependencies.'), 'testdoc.txt');

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document.id).toBeDefined();
    docId = res.body.document.id;
  });

  it('should list uploaded documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documents.length).toBeGreaterThan(0);
  });

  it('should retrieve document details by ID', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.document.title).toBe('Unit Test Document');
  });
});
