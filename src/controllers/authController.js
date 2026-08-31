const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const result = await run(
      'INSERT INTO users (email, password_hash, name, role, theme_preference) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase().trim(), password_hash, name.trim(), userRole, 'dark']
    );

    const newUser = {
      id: result.lastID,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: userRole,
      theme_preference: 'dark'
    };

    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [newUser.id, 'REGISTER', 'user', newUser.id, `User registered: ${newUser.email}`]
    );

    res.status(201).json({
      success: true,
      token,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      theme_preference: user.theme_preference || 'dark'
    };

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'LOGIN', 'user', user.id, `User logged in: ${user.email}`]
    );

    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await get('SELECT id, email, name, role, theme_preference, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, theme_preference } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (theme_preference && ['dark', 'light'].includes(theme_preference)) {
      updates.push('theme_preference = ?');
      params.push(theme_preference);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.user.id);

    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedUser = await get('SELECT id, email, name, role, theme_preference, avatar_url FROM users WHERE id = ?', [req.user.id]);

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
