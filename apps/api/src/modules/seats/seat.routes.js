import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getSeatDetail,
  getSeatMap,
  getSeatMapChanges,
  getSeatSectionDetail,
  listSeatSections,
  listSeats
} from "./seat.controller.js";
import {
  eventIdParamsSchema,
  listSeatsSchema,
  seatMapChangesSchema,
  seatParamsSchema,
  sectionParamsSchema
} from "./seat.validation.js";

const router = Router();

router.get("/:eventId/sections", validate(eventIdParamsSchema), listSeatSections);
router.get("/:eventId/sections/:sectionId", validate(sectionParamsSchema), getSeatSectionDetail);
router.get("/:eventId/seat-map", validate(eventIdParamsSchema), getSeatMap);
router.get("/:eventId/seat-map/changes", validate(seatMapChangesSchema), getSeatMapChanges);
router.get("/:eventId/seats", validate(listSeatsSchema), listSeats);
router.get("/:eventId/seats/:seatId", validate(seatParamsSchema), getSeatDetail);

export default router;
