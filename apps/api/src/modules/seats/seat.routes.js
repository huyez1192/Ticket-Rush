import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  bulkUpdateSeatLayouts,
  createSeatSection,
  deleteSeatSection,
  generateSeats,
  getSeatDetail,
  getSeatMap,
  getSeatMapChanges,
  getSeatSectionDetail,
  listSeatSections,
  listSeats,
  updateSeatLayout,
  updateSeatMapLayout,
  updateSeatMapStage,
  updateSeatSection,
  updateSeatStatus
} from "./seat.controller.js";
import {
  createSeatSectionSchema,
  bulkUpdateSeatLayoutsSchema,
  eventIdParamsSchema,
  generateSeatsSchema,
  listSeatsSchema,
  seatMapChangesSchema,
  seatParamsSchema,
  sectionParamsSchema,
  updateSeatLayoutSchema,
  updateSeatMapLayoutSchema,
  updateStageSchema,
  updateSeatSectionSchema,
  updateSeatStatusSchema
} from "./seat.validation.js";

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get("/:eventId/sections", optionalAuthenticate, validate(eventIdParamsSchema), listSeatSections);
router.post("/:eventId/sections", ...adminOnly, validate(createSeatSectionSchema), createSeatSection);
router.get("/:eventId/sections/:sectionId", optionalAuthenticate, validate(sectionParamsSchema), getSeatSectionDetail);
router.put("/:eventId/sections/:sectionId", ...adminOnly, validate(updateSeatSectionSchema), updateSeatSection);
router.delete("/:eventId/sections/:sectionId", ...adminOnly, validate(sectionParamsSchema), deleteSeatSection);
router.post(
  "/:eventId/sections/:sectionId/generate-seats",
  ...adminOnly,
  validate(generateSeatsSchema),
  generateSeats
);
router.get("/:eventId/seat-map", optionalAuthenticate, validate(eventIdParamsSchema), getSeatMap);
router.put("/:eventId/seat-map/layout", ...adminOnly, validate(updateSeatMapLayoutSchema), updateSeatMapLayout);
router.patch("/:eventId/seat-map/stage", ...adminOnly, validate(updateStageSchema), updateSeatMapStage);
router.get("/:eventId/seat-map/changes", optionalAuthenticate, validate(seatMapChangesSchema), getSeatMapChanges);
router.get("/:eventId/seats", optionalAuthenticate, validate(listSeatsSchema), listSeats);
router.patch("/:eventId/seats/layout/bulk", ...adminOnly, validate(bulkUpdateSeatLayoutsSchema), bulkUpdateSeatLayouts);
router.get("/:eventId/seats/:seatId", optionalAuthenticate, validate(seatParamsSchema), getSeatDetail);
router.patch("/:eventId/seats/:seatId/layout", ...adminOnly, validate(updateSeatLayoutSchema), updateSeatLayout);
router.patch("/:eventId/seats/:seatId", ...adminOnly, validate(updateSeatStatusSchema), updateSeatStatus);

export default router;
