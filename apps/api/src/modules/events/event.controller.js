import { sendSuccess } from "../../common/responses/apiResponse.js";
import { getPublicEventDetail, getPublicEventImages, getPublicEvents } from "./event.service.js";

export async function listEvents(req, res, next) {
  try {
    const data = await getPublicEvents(req.query);
    sendSuccess(res, 200, "Events fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getEventDetail(req, res, next) {
  try {
    const data = await getPublicEventDetail(req.params.eventId);
    sendSuccess(res, 200, "Event fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function listEventImages(req, res, next) {
  try {
    const data = await getPublicEventImages(req.params.eventId);
    sendSuccess(res, 200, "Event images fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}
