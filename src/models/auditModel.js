const { run, all } = require('../config/database');

const initAuditSchema = async () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      ip_address TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `;
  await run(schema);
};

const logAuditEvent = async ({ userId, action, entityType = null, entityId = null, ipAddress = null, details = '' }) => {
  try {
    await initAuditSchema();
    await run(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, ipAddress, details]
    );
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
};

const getAuditLogs = async ({ userId = null, limit = 50, offset = 0 } = {}) => {
  await initAuditSchema();
  let query = `
    SELECT a.*, u.name as user_name, u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (userId) {
    query += ` AND a.user_id = ?`;
    params.push(userId);
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return await all(query, params);
};

module.exports = {
  initAuditSchema,
  logAuditEvent,
  getAuditLogs
};
