const path = require('path');
const fs = require('fs');
const { run, get, all } = require('../config/database');
const { extractTextFromFile } = require('../services/documentService');
const { generateSummary, extractKeywords, calculateReadingTime, findSimilarDocuments } = require('../services/aiService');

const listDocuments = async (req, res, next) => {
  try {
    const { workspace_id, tag, favorite, search, sort = 'created_at', order = 'DESC' } = req.query;

    let query = `
      SELECT d.*, 
        w.name as workspace_name, 
        w.color as workspace_color,
        u.name as uploader_name,
        (SELECT COUNT(*) FROM notes WHERE document_id = d.id) as notes_count,
        (SELECT COUNT(*) FROM bookmarks WHERE document_id = d.id AND user_id = ?) as is_bookmarked
      FROM documents d
      JOIN workspaces w ON d.workspace_id = w.id
      JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [req.user.id];

    if (workspace_id) {
      query += ` AND d.workspace_id = ?`;
      params.push(workspace_id);
    }

    if (favorite === 'true') {
      query += ` AND (d.is_favorite = 1 OR d.id IN (SELECT document_id FROM bookmarks WHERE user_id = ?))`;
      params.push(req.user.id);
    }

    if (tag) {
      query += ` AND d.id IN (SELECT document_id FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE t.name = ?)`;
      params.push(tag);
    }

    if (search) {
      query += ` AND (d.title LIKE ? OR d.content_text LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const validSorts = ['created_at', 'title', 'file_size', 'reading_time_minutes'];
    const sortCol = validSorts.includes(sort) ? `d.${sort}` : 'd.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const docs = await all(query, params);

    // Fetch tags for each doc
    for (const doc of docs) {
      const tags = await all(
        `SELECT t.id, t.name, t.color FROM tags t JOIN document_tags dt ON t.id = dt.tag_id WHERE dt.document_id = ?`,
        [doc.id]
      );
      doc.tags = tags;
      const keywords = await all(`SELECT keyword, score FROM document_keywords WHERE document_id = ? LIMIT 5`, [doc.id]);
      doc.keywords = keywords;
    }

    res.json({ success: true, count: docs.length, documents: docs });
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const docId = req.params.id;

    const doc = await get(`
      SELECT d.*, 
        w.name as workspace_name, 
        w.color as workspace_color,
        u.name as uploader_name,
        (SELECT COUNT(*) FROM bookmarks WHERE document_id = d.id AND user_id = ?) as is_bookmarked
      FROM documents d
      JOIN workspaces w ON d.workspace_id = w.id
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [req.user.id, docId]);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const tags = await all(
      `SELECT t.id, t.name, t.color FROM tags t JOIN document_tags dt ON t.id = dt.tag_id WHERE dt.document_id = ?`,
      [docId]
    );
    const keywords = await all(`SELECT keyword, score FROM document_keywords WHERE document_id = ? ORDER BY score DESC`, [docId]);
    const notes = await all(`SELECT n.*, u.name as author_name FROM notes n JOIN users u ON n.user_id = u.id WHERE n.document_id = ? ORDER BY n.created_at DESC`, [docId]);
    const highlights = await all(`SELECT h.*, u.name as author_name FROM highlights h JOIN users u ON h.user_id = u.id WHERE h.document_id = ? ORDER BY h.created_at DESC`, [docId]);

    // Find similar documents
    const allDocs = await all(`SELECT id, title, original_name, file_type, workspace_id, content_text FROM documents WHERE id != ?`, [docId]);
    const similarDocs = findSimilarDocuments(doc, allDocs, 3);

    doc.tags = tags;
    doc.keywords = keywords;
    doc.notes = notes;
    doc.highlights = highlights;
    doc.similarDocuments = similarDocs;

    res.json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const { title, workspace_id, tags } = req.body;
    if (!workspace_id) {
      return res.status(400).json({ success: false, error: 'Workspace ID is required.' });
    }

    const workspace = await get('SELECT id FROM workspaces WHERE id = ?', [workspace_id]);
    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found.' });
    }

    const docTitle = title && title.trim() ? title.trim() : req.file.originalname;
    const filePath = req.file.path;
    const fileSize = req.file.size;
    const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    // Extract text content & compute local AI features
    const contentText = await extractTextFromFile(filePath, req.file.originalname);
    const summary = generateSummary(contentText, 3);
    const keywords = extractKeywords(contentText, 8);
    const readingTime = calculateReadingTime(contentText);

    const result = await run(
      `INSERT INTO documents (title, original_name, file_path, file_size, file_type, workspace_id, uploaded_by, reading_time_minutes, content_text, summary) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [docTitle, req.file.originalname, filePath, fileSize, fileType, workspace_id, req.user.id, readingTime, contentText, summary]
    );

    const docId = result.lastID;

    // Save keywords
    for (const kw of keywords) {
      await run('INSERT INTO document_keywords (document_id, keyword, score) VALUES (?, ?, ?)', [docId, kw.keyword, kw.score]);
    }

    // Save tags if provided
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tagName of tagList) {
        let tagObj = await get('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (!tagObj) {
          const newTag = await run('INSERT INTO tags (name) VALUES (?)', [tagName]);
          tagObj = { id: newTag.lastID };
        }
        await run('INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)', [docId, tagObj.id]);
      }
    }

    // Log Activity
    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPLOAD_DOCUMENT', 'document', docId, `Uploaded document: ${docTitle}`]
    );

    const createdDoc = await get('SELECT * FROM documents WHERE id = ?', [docId]);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully.',
      document: createdDoc
    });
  } catch (err) {
    next(err);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const { title, workspace_id, is_favorite, tags } = req.body;

    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (workspace_id !== undefined) {
      updates.push('workspace_id = ?');
      params.push(workspace_id);
    }
    if (is_favorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(is_favorite ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(docId);
      await run(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update tags if provided
    if (tags !== undefined) {
      await run('DELETE FROM document_tags WHERE document_id = ?', [docId]);
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tagName of tagList) {
        let tagObj = await get('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (!tagObj) {
          const newTag = await run('INSERT INTO tags (name) VALUES (?)', [tagName]);
          tagObj = { id: newTag.lastID };
        }
        await run('INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)', [docId, tagObj.id]);
      }
    }

    res.json({ success: true, message: 'Document updated successfully.' });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    // Delete file from disk if exists
    if (fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (e) {}
    }

    await run('DELETE FROM documents WHERE id = ?', [docId]);

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_DOCUMENT', 'document', docId, `Deleted document: ${doc.title}`]
    );

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const toggleBookmark = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id;

    const existing = await get('SELECT id FROM bookmarks WHERE user_id = ? AND document_id = ?', [userId, docId]);
    if (existing) {
      await run('DELETE FROM bookmarks WHERE user_id = ? AND document_id = ?', [userId, docId]);
      res.json({ success: true, bookmarked: false });
    } else {
      await run('INSERT INTO bookmarks (user_id, document_id) VALUES (?, ?)', [userId, docId]);
      res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    next(err);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    if (!fs.existsSync(doc.file_path)) {
      // If original file not found, return content as text file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.title}.txt"`);
      return res.send(doc.content_text || 'No file content');
    }

    res.download(doc.file_path, doc.original_name);
  } catch (err) {
    next(err);
  }
};

const exportDocument = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const format = (req.query.format || 'txt').toLowerCase();
    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const keywords = await all('SELECT keyword FROM document_keywords WHERE document_id = ?', [docId]);
    const kwList = keywords.map(k => k.keyword).join(', ');

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.title}_export.json"`);
      return res.json({
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        content: doc.content_text,
        keywords: kwList,
        readingTimeMinutes: doc.reading_time_minutes,
        createdAt: doc.created_at
      });
    } else if (format === 'md' || format === 'markdown') {
      const mdContent = `# ${doc.title}\n\n**Summary:** ${doc.summary}\n\n**Keywords:** ${kwList}\n\n---\n\n${doc.content_text}`;
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.title}_export.md"`);
      return res.send(mdContent);
    } else {
      const txtContent = `TITLE: ${doc.title}\nSUMMARY: ${doc.summary}\nKEYWORDS: ${kwList}\n\nCONTENT:\n${doc.content_text}`;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.title}_export.txt"`);
      return res.send(txtContent);
    }
  } catch (err) {
    next(err);
  }
};

const batchExportDocuments = async (req, res, next) => {
  try {
    const { document_ids, format = 'json' } = req.body;
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'document_ids array is required.' });
    }

    const placeholders = document_ids.map(() => '?').join(',');
    const docs = await all(`SELECT * FROM documents WHERE id IN (${placeholders})`, document_ids);

    const exports = docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      summary: doc.summary,
      reading_time_minutes: doc.reading_time_minutes,
      created_at: doc.created_at
    }));

    res.json({ success: true, count: exports.length, documents: exports });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  toggleBookmark,
  downloadDocument,
  exportDocument,
  batchExportDocuments
};
