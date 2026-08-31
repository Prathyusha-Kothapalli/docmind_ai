const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { all } = require('../config/database');

router.use(authenticate);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const users = await all('SELECT id, email, name, role, theme_preference, created_at FROM users ORDER BY id ASC');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
