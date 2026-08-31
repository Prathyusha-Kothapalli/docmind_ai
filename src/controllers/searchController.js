const { all } = require('../config/database');

const fullTextSearch = async (req, res, next) => {
  try {
    const { q, workspace_id, file_type, tag } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, error: 'Search query parameter "q" is required.' });
    }

    const cleanQuery = q.trim();
    let results = [];

    // Attempt FTS5 search first
    try {
      let ftsSql = `
        SELECT d.id, d.title, d.original_name, d.file_type, d.file_size, d.workspace_id, d.reading_time_minutes, d.summary, d.created_at,
               w.name as workspace_name, w.color as workspace_color,
               snippet(documents_fts, 1, '<mark>', '</mark>', '...', 20) as matched_snippet
        FROM documents_fts fts
        JOIN documents d ON fts.rowid = d.id
        JOIN workspaces w ON d.workspace_id = w.id
        WHERE documents_fts MATCH ?
      `;
      const ftsParams = [cleanQuery];

      if (workspace_id) {
        ftsSql += ` AND d.workspace_id = ?`;
        ftsParams.push(workspace_id);
      }
      if (file_type) {
        ftsSql += ` AND d.file_type = ?`;
        ftsParams.push(file_type);
      }
      if (tag) {
        ftsSql += ` AND d.id IN (SELECT document_id FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE t.name = ?)`;
        ftsParams.push(tag);
      }

      ftsSql += ` ORDER BY rank LIMIT 25`;
      results = await all(ftsSql, ftsParams);
    } catch (ftsError) {
      // Fallback to LIKE query if FTS5 query syntax is invalid or throws
      let fallbackSql = `
        SELECT d.id, d.title, d.original_name, d.file_type, d.file_size, d.workspace_id, d.reading_time_minutes, d.summary, d.created_at, d.content_text,
               w.name as workspace_name, w.color as workspace_color
        FROM documents d
        JOIN workspaces w ON d.workspace_id = w.id
        WHERE (d.title LIKE ? OR d.content_text LIKE ? OR d.summary LIKE ?)
      `;
      const searchTerm = `%${cleanQuery}%`;
      const fallbackParams = [searchTerm, searchTerm, searchTerm];

      if (workspace_id) {
        fallbackSql += ` AND d.workspace_id = ?`;
        fallbackParams.push(workspace_id);
      }
      if (file_type) {
        fallbackSql += ` AND d.file_type = ?`;
        fallbackParams.push(file_type);
      }
      if (tag) {
        fallbackSql += ` AND d.id IN (SELECT document_id FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE t.name = ?)`;
        fallbackParams.push(tag);
      }

      fallbackSql += ` ORDER BY d.created_at DESC LIMIT 25`;
      results = await all(fallbackSql, fallbackParams);

      // Generate snippet manually
      results = results.map(doc => {
        let snippet = doc.summary || doc.content_text || '';
        const lowerContent = snippet.toLowerCase();
        const lowerQ = cleanQuery.toLowerCase();
        const matchIdx = lowerContent.indexOf(lowerQ);

        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(snippet.length, matchIdx + cleanQuery.length + 40);
          const sub = snippet.substring(start, end);
          snippet = `...${sub.replace(new RegExp(cleanQuery, 'gi'), match => `<mark>${match}</mark>`)}...`;
        } else {
          snippet = snippet.substring(0, 120) + '...';
        }

        doc.matched_snippet = snippet;
        delete doc.content_text;
        return doc;
      });
    }

    res.json({
      success: true,
      query: cleanQuery,
      total_matches: results.length,
      results
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  fullTextSearch
};
