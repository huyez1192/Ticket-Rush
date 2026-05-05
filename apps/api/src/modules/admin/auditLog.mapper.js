function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapAuditLogToDto(auditLog) {
  const value = toPlainObject(auditLog);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    userId: value.userId?._id?.toString?.() || value.userId?.toString?.() || null,
    action: value.action,
    entityType: value.entityType,
    entityId: value.entityId?.toString?.(),
    metadata: value.metadata,
    createdAt: value.createdAt
  };
}

