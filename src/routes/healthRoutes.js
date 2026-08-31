const express = require('express');
const router = express.Router();
const { ping, getDetailedHealth } = require('../controllers/healthController');

router.get('/ping', ping);
router.get('/detailed', getDetailedHealth);

module.exports = router;
