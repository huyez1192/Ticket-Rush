import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { listMySeatLocks, lockSeats, releaseExpiredLocks, releaseSeatLock } from "./seatLock.controller.js";
import { eventIdParamsSchema, lockSeatsSchema, seatLockSeatParamsSchema } from "./seatLock.validation.js";

const router = Router();

router.post("/events/:eventId/seat-locks", authenticate, requireRole(ROLES.CUSTOMER), validate(lockSeatsSchema), lockSeats);
router.get(
  "/events/:eventId/seat-locks",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(eventIdParamsSchema),
  listMySeatLocks
);
router.delete(
  "/events/:eventId/seat-locks/:seatId",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  validate(seatLockSeatParamsSchema),
  releaseSeatLock
);
router.post("/admin/seat-locks/release-expired", authenticate, requireRole(ROLES.ADMIN), releaseExpiredLocks);

export default router;
