const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const userRoutes = require('./src/routes/userRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handling Middleware
app.use(errorHandler);

let server;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('[DocMind DB] SQLite Database initialized successfully.');

    server = app.listen(PORT, () => {
      console.log(`[DocMind Server] Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[DocMind Error] Failed to start server:', err);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
