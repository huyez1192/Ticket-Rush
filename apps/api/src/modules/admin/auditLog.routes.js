import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { adminListAuditLogs } from "./auditLog.controller.js";
import { listAuditLogsSchema } from "./auditLog.validation.js";

const router = Router();

router.get("/admin/audit-logs", authenticate, requireRole(ROLES.ADMIN), validate(listAuditLogsSchema), adminListAuditLogs);

export default router;

