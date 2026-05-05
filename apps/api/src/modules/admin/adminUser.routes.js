import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { adminAssignUserRoles, adminDeleteUser, adminGetUser, adminListUsers } from "./adminUser.controller.js";
import { assignRolesSchema, listUsersSchema, userIdParamsSchema } from "./adminUser.validation.js";

const router = Router();

router.get("/admin/users", authenticate, requireRole(ROLES.ADMIN), validate(listUsersSchema), adminListUsers);
router.get("/admin/users/:id", authenticate, requireRole(ROLES.ADMIN), validate(userIdParamsSchema), adminGetUser);
router.delete("/admin/users/:id", authenticate, requireRole(ROLES.ADMIN), validate(userIdParamsSchema), adminDeleteUser);
router.put(
  "/admin/users/:id/roles",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(assignRolesSchema),
  adminAssignUserRoles
);

export default router;

