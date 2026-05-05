import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  addEventImage,
  cancelEvent,
  closeEvent,
  createEvent,
  deleteEvent,
  deleteEventImage,
  getEventDetail,
  listEventImages,
  listEvents,
  openSellingEvent,
  publishEvent,
  updateEvent
} from "./event.controller.js";
import {
  createEventImageSchema,
  createEventSchema,
  eventIdParamsSchema,
  eventImageParamsSchema,
  listEventsSchema,
  updateEventSchema
} from "./event.validation.js";

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get("/", validate(listEventsSchema), listEvents);
router.post("/", ...adminOnly, validate(createEventSchema), createEvent);
router.get("/:eventId", validate(eventIdParamsSchema), getEventDetail);
router.put("/:eventId", ...adminOnly, validate(updateEventSchema), updateEvent);
router.delete("/:eventId", ...adminOnly, validate(eventIdParamsSchema), deleteEvent);
router.post("/:eventId/publish", ...adminOnly, validate(eventIdParamsSchema), publishEvent);
router.post("/:eventId/open-selling", ...adminOnly, validate(eventIdParamsSchema), openSellingEvent);
router.post("/:eventId/close", ...adminOnly, validate(eventIdParamsSchema), closeEvent);
router.post("/:eventId/cancel", ...adminOnly, validate(eventIdParamsSchema), cancelEvent);
router.get("/:eventId/images", validate(eventIdParamsSchema), listEventImages);
router.post("/:eventId/images", ...adminOnly, validate(createEventImageSchema), addEventImage);
router.delete("/:eventId/images/:id", ...adminOnly, validate(eventImageParamsSchema), deleteEventImage);

export default router;
