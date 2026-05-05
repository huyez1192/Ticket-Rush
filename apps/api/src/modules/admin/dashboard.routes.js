import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminGetDashboardEventDemographics,
  adminGetDashboardEventRevenue,
  adminGetDashboardEventSeatOccupancy,
  adminGetDashboardOverview
} from "./dashboard.controller.js";
import { eventIdParamsSchema, eventRevenueSchema } from "./dashboard.validation.js";

const router = Router();

router.get("/admin/dashboard/overview", authenticate, requireRole(ROLES.ADMIN), adminGetDashboardOverview);
router.get(
  "/admin/dashboard/events/:eventId/revenue",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(eventRevenueSchema),
  adminGetDashboardEventRevenue
);
router.get(
  "/admin/dashboard/events/:eventId/seat-occupancy",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(eventIdParamsSchema),
  adminGetDashboardEventSeatOccupancy
);
router.get(
  "/admin/dashboard/events/:eventId/demographics",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(eventIdParamsSchema),
  adminGetDashboardEventDemographics
);

export default router;

