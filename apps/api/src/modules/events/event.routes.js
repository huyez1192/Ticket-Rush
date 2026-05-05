import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { getEventDetail, listEventImages, listEvents } from "./event.controller.js";
import { eventIdParamsSchema, listEventsSchema } from "./event.validation.js";

const router = Router();

router.get("/", validate(listEventsSchema), listEvents);
router.get("/:eventId", validate(eventIdParamsSchema), getEventDetail);
router.get("/:eventId/images", validate(eventIdParamsSchema), listEventImages);

export default router;
