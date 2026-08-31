const { get, all, run } = require('../config/database');
const { generateSummary, extractKeywords, calculateReadingTime, findSimilarDocuments } = require('../services/aiService');

const summarizeDocument = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const { length = 3 } = req.query;

    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const summary = generateSummary(doc.content_text, parseInt(length));

    // Update document summary in DB
    await run('UPDATE documents SET summary = ? WHERE id = ?', [summary, docId]);

    res.json({
      success: true,
      document_id: docId,
      summary
    });
  } catch (err) {
    next(err);
  }
};

const extractDocumentKeywords = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const doc = await get('SELECT * FROM documents WHERE id = ?', [docId]);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const keywords = extractKeywords(doc.content_text, 10);
    res.json({ success: true, document_id: docId, keywords });
  } catch (err) {
    next(err);
  }
};

const getSimilarDocuments = async (req, res, next) => {
  try {
    const docId = req.params.id;
    const targetDoc = await get('SELECT id, title, original_name, file_type, workspace_id, content_text FROM documents WHERE id = ?', [docId]);

    if (!targetDoc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const allDocs = await all('SELECT id, title, original_name, file_type, workspace_id, content_text FROM documents WHERE id != ?', [docId]);
    const matches = findSimilarDocuments(targetDoc, allDocs, 5);

    res.json({ success: true, document_id: docId, matches });
  } catch (err) {
    next(err);
  }
};

const analyzeText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text input is required.' });
    }

    const summary = generateSummary(text, 3);
    const keywords = extractKeywords(text, 8);
    const reading_time = calculateReadingTime(text);

    res.json({
      success: true,
      summary,
      keywords,
      reading_time
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  summarizeDocument,
  extractDocumentKeywords,
  getSimilarDocuments,
  analyzeText
};
