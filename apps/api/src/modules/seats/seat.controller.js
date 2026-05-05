import { sendSuccess } from "../../common/responses/apiResponse.js";
import {
  getPublicSeatDetail,
  getPublicSeatMap,
  getPublicSeatMapChanges,
  getPublicSeatSectionDetail,
  getPublicSeatSections,
  getPublicSeats
} from "./seat.service.js";

export async function listSeatSections(req, res, next) {
  try {
    const data = await getPublicSeatSections(req.params.eventId);
    sendSuccess(res, 200, "Seat sections fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getSeatSectionDetail(req, res, next) {
  try {
    const data = await getPublicSeatSectionDetail(req.params.eventId, req.params.sectionId);
    sendSuccess(res, 200, "Seat section fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function listSeats(req, res, next) {
  try {
    const data = await getPublicSeats(req.params.eventId, req.query);
    sendSuccess(res, 200, "Seats fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getSeatDetail(req, res, next) {
  try {
    const data = await getPublicSeatDetail(req.params.eventId, req.params.seatId);
    sendSuccess(res, 200, "Seat fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getSeatMap(req, res, next) {
  try {
    const data = await getPublicSeatMap(req.params.eventId);
    sendSuccess(res, 200, "Seat map fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getSeatMapChanges(req, res, next) {
  try {
    const data = await getPublicSeatMapChanges(req.params.eventId, req.query);
    sendSuccess(res, 200, "Seat map changes fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}
