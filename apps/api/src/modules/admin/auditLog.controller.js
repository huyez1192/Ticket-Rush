import { sendSuccess } from "../../common/responses/apiResponse.js";
import { listAuditLogs } from "./auditLog.service.js";

export async function adminListAuditLogs(req, res, next) {
  try {
    const data = await listAuditLogs(req.query);
    sendSuccess(res, 200, "Audit logs fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

