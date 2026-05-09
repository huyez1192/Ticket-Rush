import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminAdmitQueueBatch,
  adminListEventQueue,
  adminUpdateEventQueueConfig,
  getMyEventQueueEntry,
  getWaitingQueueEntry,
  joinEventWaitingQueue,
  joinWaitingQueue,
  leaveMyEventQueue,
  leaveWaitingQueue
} from "./waitingQueue.controller.js";
import {
  adminListQueueSchema,
  admitQueueBatchSchema,
  eventQueueParamsSchema,
  joinEventQueueSchema,
  joinQueueSchema,
  queueIdParamsSchema,
  updateEventQueueConfigSchema
} from "./waitingQueue.validation.js";

const router = Router();

router.post("/queue/join", authenticate, requireRole(ROLES.CUSTOMER), validate(joinQueueSchema), joinWaitingQueue);
router.get("/queue/:queueId", authenticate, requireRole(ROLES.CUSTOMER), validate(queueIdParamsSchema), getWaitingQueueEntry);
router.delete("/queue/:queueId", authenticate, requireRole(ROLES.CUSTOMER), validate(queueIdParamsSchema), leaveWaitingQueue);
router.post(
  "/events/:eventId/queue/join",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(joinEventQueueSchema),
  joinEventWaitingQueue
);
router.get(
  "/events/:eventId/queue/me",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(eventQueueParamsSchema),
  getMyEventQueueEntry
);
router.delete(
  "/events/:eventId/queue/me",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(eventQueueParamsSchema),
  leaveMyEventQueue
);
router.get(
  "/queue/events/:eventId/me",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(eventQueueParamsSchema),
  getMyEventQueueEntry
);
router.get(
  "/admin/events/:eventId/queue",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(adminListQueueSchema),
  adminListEventQueue
);
router.post(
  "/admin/events/:eventId/queue/admit-batch",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(admitQueueBatchSchema),
  adminAdmitQueueBatch
);
router.patch(
  "/admin/events/:eventId/queue/config",
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(updateEventQueueConfigSchema),
  adminUpdateEventQueueConfig
);

export default router;
