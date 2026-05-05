import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminAdmitQueueBatch,
  adminListEventQueue,
  getMyEventQueueEntry,
  getWaitingQueueEntry,
  joinWaitingQueue,
  leaveWaitingQueue
} from "./waitingQueue.controller.js";
import {
  adminListQueueSchema,
  admitQueueBatchSchema,
  eventQueueParamsSchema,
  joinQueueSchema,
  queueIdParamsSchema
} from "./waitingQueue.validation.js";

const router = Router();

router.post("/queue/join", authenticate, requireRole(ROLES.CUSTOMER), validate(joinQueueSchema), joinWaitingQueue);
router.get("/queue/:queueId", authenticate, requireRole(ROLES.CUSTOMER), validate(queueIdParamsSchema), getWaitingQueueEntry);
router.delete("/queue/:queueId", authenticate, requireRole(ROLES.CUSTOMER), validate(queueIdParamsSchema), leaveWaitingQueue);
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

export default router;
