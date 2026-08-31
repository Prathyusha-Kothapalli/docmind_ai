const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const {
  listDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  toggleBookmark,
  downloadDocument,
  exportDocument,
  batchExportDocuments
} = require('../controllers/documentController');

router.use(authenticate);

router.get('/', listDocuments);
router.post('/batch-export', batchExportDocuments);
router.get('/:id', getDocumentById);
router.post('/upload', upload.single('file'), uploadDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/bookmark', toggleBookmark);
router.get('/:id/download', downloadDocument);
router.get('/:id/export', exportDocument);

module.exports = router;
