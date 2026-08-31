const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { fetchAuditLogs, createManualLog } = require('../controllers/auditController');

router.use(authenticate);

router.get('/', fetchAuditLogs);
router.post('/', createManualLog);

module.exports = router;
