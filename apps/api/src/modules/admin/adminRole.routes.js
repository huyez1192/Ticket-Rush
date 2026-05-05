import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { adminGetRole, adminListRoles } from "./adminRole.controller.js";
import { roleIdParamsSchema } from "./adminRole.validation.js";

const router = Router();

router.get("/admin/roles", authenticate, requireRole(ROLES.ADMIN), adminListRoles);
router.get("/admin/roles/:id", authenticate, requireRole(ROLES.ADMIN), validate(roleIdParamsSchema), adminGetRole);

export default router;

