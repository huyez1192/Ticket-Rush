import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import {
  createAdminSeatSection,
  deleteAdminSeatSection,
  generateAdminSeats,
  getPublicSeatDetail,
  getPublicSeatMap,
  getPublicSeatMapChanges,
  getPublicSeatSectionDetail,
  getPublicSeatSections,
  getPublicSeats,
  updateAdminSeatSection,
  updateAdminSeatStatus
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

export async function createSeatSection(req, res, next) {
  try {
    const data = await createAdminSeatSection(req.params.eventId, req.body);
    sendSuccess(res, 200, "Seat section created successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function updateSeatSection(req, res, next) {
  try {
    const data = await updateAdminSeatSection(req.params.eventId, req.params.sectionId, req.body);
    sendSuccess(res, 200, "Seat section updated successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function deleteSeatSection(req, res, next) {
  try {
    await deleteAdminSeatSection(req.params.eventId, req.params.sectionId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function generateSeats(req, res, next) {
  try {
    const data = await generateAdminSeats(req.params.eventId, req.params.sectionId, req.body);
    sendSuccess(res, 200, "Seats generated successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function updateSeatStatus(req, res, next) {
  try {
    const data = await updateAdminSeatStatus(req.params.eventId, req.params.seatId, req.body);
    sendSuccess(res, 200, "Seat status updated successfully.", data);
  } catch (error) {
    next(error);
  }
}
