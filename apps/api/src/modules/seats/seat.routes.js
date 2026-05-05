import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSeatSection,
  deleteSeatSection,
  generateSeats,
  getSeatDetail,
  getSeatMap,
  getSeatMapChanges,
  getSeatSectionDetail,
  listSeatSections,
  listSeats,
  updateSeatSection,
  updateSeatStatus
} from "./seat.controller.js";
import {
  createSeatSectionSchema,
  eventIdParamsSchema,
  generateSeatsSchema,
  listSeatsSchema,
  seatMapChangesSchema,
  seatParamsSchema,
  sectionParamsSchema,
  updateSeatSectionSchema,
  updateSeatStatusSchema
} from "./seat.validation.js";

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get("/:eventId/sections", validate(eventIdParamsSchema), listSeatSections);
router.post("/:eventId/sections", ...adminOnly, validate(createSeatSectionSchema), createSeatSection);
router.get("/:eventId/sections/:sectionId", validate(sectionParamsSchema), getSeatSectionDetail);
router.put("/:eventId/sections/:sectionId", ...adminOnly, validate(updateSeatSectionSchema), updateSeatSection);
router.delete("/:eventId/sections/:sectionId", ...adminOnly, validate(sectionParamsSchema), deleteSeatSection);
router.post(
  "/:eventId/sections/:sectionId/generate-seats",
  ...adminOnly,
  validate(generateSeatsSchema),
  generateSeats
);
router.get("/:eventId/seat-map", validate(eventIdParamsSchema), getSeatMap);
router.get("/:eventId/seat-map/changes", validate(seatMapChangesSchema), getSeatMapChanges);
router.get("/:eventId/seats", validate(listSeatsSchema), listSeats);
router.get("/:eventId/seats/:seatId", validate(seatParamsSchema), getSeatDetail);
router.patch("/:eventId/seats/:seatId", ...adminOnly, validate(updateSeatStatusSchema), updateSeatStatus);

export default router;
