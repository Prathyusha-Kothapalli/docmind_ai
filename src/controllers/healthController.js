const os = require('os');
const { get } = require('../config/database');

const ping = (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
};

const getDetailedHealth = async (req, res, next) => {
  try {
    const mem = process.memoryUsage();
    const docCountRow = await get('SELECT COUNT(*) as count FROM documents');
    const userCountRow = await get('SELECT COUNT(*) as count FROM users');
    const wsCountRow = await get('SELECT COUNT(*) as count FROM workspaces');

    const healthData = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024))
      },
      processMemory: {
        rssMB: Math.round(mem.rss / (1024 * 1024)),
        heapTotalMB: Math.round(mem.heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024))
      },
      database: {
        status: 'connected',
        type: 'SQLite3 FTS5',
        stats: {
          documentsCount: docCountRow ? docCountRow.count : 0,
          usersCount: userCountRow ? userCountRow.count : 0,
          workspacesCount: wsCountRow ? wsCountRow.count : 0
        }
      }
    };

    res.json({ success: true, health: healthData });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ping,
  getDetailedHealth
};
