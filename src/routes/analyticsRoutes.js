const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getDashboardAnalytics, getActivityLogs } = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/activity', getActivityLogs);

module.exports = router;
