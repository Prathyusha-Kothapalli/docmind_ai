const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { fullTextSearch } = require('../controllers/searchController');

router.use(authenticate);

router.get('/', fullTextSearch);

module.exports = router;
