const AuditLog = require("../models/AuditLog");

const redactMetadata = (value) => {
  if (Array.isArray(value)) return value.map(redactMetadata);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(password|token|secret|authorization|credential)/i.test(key))
      .map(([key, item]) => [key, redactMetadata(item)])
  );
};

const recordAuditLog = async ({ actor, action, entity, entityId, metadata = {} }) => {
  try {
    const safeMetadata = redactMetadata(metadata);
    await AuditLog.create({
      user: actor?.name || actor?.email || "System",
      userId: actor?._id || null,
      action,
      module: entity,
      entity,
      entityId: entityId ? String(entityId) : "",
      metadata: safeMetadata,
      details: Object.keys(safeMetadata).length
        ? JSON.stringify(safeMetadata)
        : "",
    });
  } catch (error) {
    console.error("Audit log write failed:", error.name || "Error");
  }
};

const getAuditLogs = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
  try {
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(),
    ]);
    return res.json({
      logs: logs.map((log) => ({
        ...log,
        details:
          log.details ||
          (log.metadata && Object.keys(log.metadata).length
            ? JSON.stringify(log.metadata)
            : ""),
      })),
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Audit log query failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to load audit logs." });
  }
};

module.exports = {
  getAuditLogs,
  recordAuditLog,
};
