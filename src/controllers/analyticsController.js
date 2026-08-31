const { get, all } = require('../config/database');

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const totalDocsRow = await get('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM documents');
    const totalWorkspacesRow = await get('SELECT COUNT(*) as count FROM workspaces');
    const totalNotesRow = await get('SELECT COUNT(*) as count FROM notes');
    const totalUsersRow = await get('SELECT COUNT(*) as count FROM users');

    const fileTypeBreakdown = await all(`
      SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size
      FROM documents
      GROUP BY file_type
    `);

    const workspaceStats = await all(`
      SELECT w.id, w.name, w.color, COUNT(d.id) as doc_count, COALESCE(SUM(d.file_size), 0) as total_size
      FROM workspaces w
      LEFT JOIN documents d ON d.workspace_id = w.id
      GROUP BY w.id
    `);

    const topKeywords = await all(`
      SELECT keyword, COUNT(*) as frequency, AVG(score) as avg_score
      FROM document_keywords
      GROUP BY keyword
      ORDER BY frequency DESC, avg_score DESC
      LIMIT 15
    `);

    const recentActivities = await all(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      metrics: {
        total_documents: totalDocsRow ? totalDocsRow.count : 0,
        total_storage_bytes: totalDocsRow ? totalDocsRow.total_size : 0,
        total_workspaces: totalWorkspacesRow ? totalWorkspacesRow.count : 0,
        total_notes: totalNotesRow ? totalNotesRow.count : 0,
        total_users: totalUsersRow ? totalUsersRow.count : 0
      },
      file_types: fileTypeBreakdown,
      workspace_stats: workspaceStats,
      top_keywords: topKeywords,
      recent_activities: recentActivities
    });
  } catch (err) {
    next(err);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const logs = await all(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const total = await get('SELECT COUNT(*) as count FROM activity_logs');

    res.json({
      success: true,
      total: total ? total.count : 0,
      logs
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardAnalytics,
  getActivityLogs
};
