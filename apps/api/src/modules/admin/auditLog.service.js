import { mapPagination } from "../bookings/order.mapper.js";
import { mapAuditLogToDto } from "./auditLog.mapper.js";
import { findAuditLogs } from "./auditLog.repository.js";

export async function listAuditLogs(query) {
  const pagination = {
    page: query.page,
    limit: query.limit
  };

  const { items, total } = await findAuditLogs(query, pagination);

  return {
    items: items.map((auditLog) => mapAuditLogToDto(auditLog)).filter(Boolean),
    pagination: mapPagination({ ...pagination, total })
  };
}

