const { run, get, all } = require('../config/database');

const listWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await all(`
      SELECT w.*, 
        u.name as creator_name,
        COUNT(d.id) as doc_count,
        COALESCE(SUM(d.file_size), 0) as total_storage_bytes
      FROM workspaces w
      LEFT JOIN users u ON w.created_by = u.id
      LEFT JOIN documents d ON d.workspace_id = w.id
      GROUP BY w.id
      ORDER BY w.created_at ASC
    `);

    res.json({ success: true, count: workspaces.length, workspaces });
  } catch (err) {
    next(err);
  }
};

const getWorkspaceById = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await get(`
      SELECT w.*, u.name as creator_name 
      FROM workspaces w 
      LEFT JOIN users u ON w.created_by = u.id 
      WHERE w.id = ?
    `, [workspaceId]);

    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found.' });
    }

    const documents = await all(`
      SELECT d.*, u.name as uploader_name
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.workspace_id = ?
      ORDER BY d.created_at DESC
    `, [workspaceId]);

    workspace.documents = documents;

    res.json({ success: true, workspace });
  } catch (err) {
    next(err);
  }
};

const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Workspace name is required.' });
    }

    const result = await run(
      'INSERT INTO workspaces (name, description, color, created_by) VALUES (?, ?, ?, ?)',
      [name.trim(), description ? description.trim() : '', color || '#4f46e5', req.user.id]
    );

    const newWorkspace = await get('SELECT * FROM workspaces WHERE id = ?', [result.lastID]);

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_WORKSPACE', 'workspace', result.lastID, `Created workspace: ${name}`]
    );

    res.status(201).json({ success: true, workspace: newWorkspace });
  } catch (err) {
    next(err);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const { name, description, color } = req.body;

    const workspace = await get('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found.' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description.trim()); }
    if (color) { updates.push('color = ?'); params.push(color); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided for update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(workspaceId);

    await run(`UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await get('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
    res.json({ success: true, workspace: updated });
  } catch (err) {
    next(err);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await get('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);

    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found.' });
    }

    await run('DELETE FROM workspaces WHERE id = ?', [workspaceId]);

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_WORKSPACE', 'workspace', workspaceId, `Deleted workspace: ${workspace.name}`]
    );

    res.json({ success: true, message: 'Workspace deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
};
