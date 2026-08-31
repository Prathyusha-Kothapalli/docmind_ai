const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  summarizeDocument,
  extractDocumentKeywords,
  getSimilarDocuments,
  analyzeText
} = require('../controllers/aiController');

router.use(authenticate);

router.post('/analyze', analyzeText);
router.get('/documents/:id/summary', summarizeDocument);
router.get('/documents/:id/keywords', extractDocumentKeywords);
router.get('/documents/:id/similar', getSimilarDocuments);

module.exports = router;
