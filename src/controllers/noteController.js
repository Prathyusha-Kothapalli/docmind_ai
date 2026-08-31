const { run, get, all } = require('../config/database');

const listNotes = async (req, res, next) => {
  try {
    const { document_id } = req.query;
    let query = `
      SELECT n.*, u.name as author_name, d.title as document_title
      FROM notes n
      JOIN users u ON n.user_id = u.id
      JOIN documents d ON n.document_id = d.id
    `;
    const params = [];

    if (document_id) {
      query += ` WHERE n.document_id = ?`;
      params.push(document_id);
    }

    query += ` ORDER BY n.created_at DESC`;

    const notes = await all(query, params);
    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { document_id, content, page_number, color } = req.body;

    if (!document_id || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Document ID and note content are required.' });
    }

    const doc = await get('SELECT title FROM documents WHERE id = ?', [document_id]);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const result = await run(
      'INSERT INTO notes (document_id, user_id, content, page_number, color) VALUES (?, ?, ?, ?, ?)',
      [document_id, req.user.id, content.trim(), page_number || 1, color || '#fef08a']
    );

    const newNote = await get(`
      SELECT n.*, u.name as author_name, d.title as document_title
      FROM notes n
      JOIN users u ON n.user_id = u.id
      JOIN documents d ON n.document_id = d.id
      WHERE n.id = ?
    `, [result.lastID]);

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'ADD_NOTE', 'note', result.lastID, `Added note to: ${doc.title}`]
    );

    res.status(201).json({ success: true, note: newNote });
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const { content, color } = req.body;

    const note = await get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    const updates = [];
    const params = [];

    if (content !== undefined) { updates.push('content = ?'); params.push(content.trim()); }
    if (color) { updates.push('color = ?'); params.push(color); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided for update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(noteId);

    await run(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await get('SELECT * FROM notes WHERE id = ?', [noteId]);

    res.json({ success: true, note: updated });
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const note = await get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    await run('DELETE FROM notes WHERE id = ?', [noteId]);
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const createHighlight = async (req, res, next) => {
  try {
    const { document_id, selected_text, note_text, color } = req.body;

    if (!document_id || !selected_text || !selected_text.trim()) {
      return res.status(400).json({ success: false, error: 'Document ID and selected text are required.' });
    }

    const result = await run(
      'INSERT INTO highlights (document_id, user_id, selected_text, note_text, color) VALUES (?, ?, ?, ?, ?)',
      [document_id, req.user.id, selected_text.trim(), note_text ? note_text.trim() : '', color || '#fef08a']
    );

    const newHighlight = await get('SELECT * FROM highlights WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, highlight: newHighlight });
  } catch (err) {
    next(err);
  }
};

const deleteHighlight = async (req, res, next) => {
  try {
    const highlightId = req.params.id;
    await run('DELETE FROM highlights WHERE id = ?', [highlightId]);
    res.json({ success: true, message: 'Highlight removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  createHighlight,
  deleteHighlight
};
