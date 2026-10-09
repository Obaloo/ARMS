const AuditLog = require('../models/AuditLog');

const logAudit = async ({ actorId, action, entity, entityId, changes }) => {
  await AuditLog.create({
    actor: actorId,
    action,
    entity,
    entityId,
    changes,
  });
};

module.exports = { logAudit };
