const request = require('supertest');
const app = require('../server');
const { initDatabase } = require('../src/config/database');

describe('Document Export API Endpoints', () => {
  let token;
  let workspaceId;
  let docId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'exporttest@docmind.ai', password: 'Demo@123password', name: 'Export Tester' });

    token = authRes.body.token;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Export Workspace', description: 'Testing exports' });

    workspaceId = wsRes.body.workspace.id;

    const docRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Export Sample Document')
      .field('workspace_id', workspaceId)
      .attach('file', Buffer.from('Export document content with keywords and metadata.'), 'export_sample.txt');

    docId = docRes.body.document.id;
  });

  it('should export document as TXT format', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}/export?format=txt`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Export Sample Document');
  });

  it('should export document as JSON format', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}/export?format=json`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(docId);
    expect(res.body.title).toEqual('Export Sample Document');
  });

  it('should perform batch export of documents', async () => {
    const res = await request(app)
      .post('/api/documents/batch-export')
      .set('Authorization', `Bearer ${token}`)
      .send({ document_ids: [docId] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toEqual(1);
  });
});
