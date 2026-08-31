const { getAuditLogs, logAuditEvent } = require('../models/auditModel');

const fetchAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

    const logs = await getAuditLogs({ userId, limit, offset });
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

const createManualLog = async (req, res, next) => {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required for audit log entry.' });
    }

    await logAuditEvent({
      userId: req.user.id,
      action,
      entityType: entity_type,
      entityId: entity_id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details
    });

    res.status(201).json({ success: true, message: 'Audit log entry created.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  fetchAuditLogs,
  createManualLog
};
