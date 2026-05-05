import { AuditLog } from "./auditLog.model.js";

function buildAuditLogFilter(filters = {}) {
  const query = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.from || filters.to) {
    query.createdAt = {};

    if (filters.from) {
      query.createdAt.$gte = filters.from;
    }

    if (filters.to) {
      query.createdAt.$lte = filters.to;
    }
  }

  return query;
}

export async function createAuditLog(auditLogData) {
  const auditLog = await AuditLog.create(auditLogData);
  return auditLog.toObject();
}

export async function tryCreateAuditLog(auditLogData) {
  try {
    return await createAuditLog(auditLogData);
  } catch (_error) {
    return null;
  }
}

export async function findAuditLogs(filters, pagination) {
  const query = buildAuditLogFilter(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pagination.limit).lean(),
    AuditLog.countDocuments(query)
  ]);

  return { items, total };
}

