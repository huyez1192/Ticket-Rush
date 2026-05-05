import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import {
  getMyActiveSeatLocks,
  lockSeatsForUser,
  releaseExpiredSeatLocks,
  releaseMySeatLock
} from "./seatLock.service.js";

export async function lockSeats(req, res, next) {
  try {
    const data = await lockSeatsForUser(req.params.eventId, req.user.id, req.body);
    sendSuccess(res, 200, "Seats locked successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function listMySeatLocks(req, res, next) {
  try {
    const data = await getMyActiveSeatLocks(req.params.eventId, req.user.id);
    sendSuccess(res, 200, "Seat locks fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function releaseSeatLock(req, res, next) {
  try {
    await releaseMySeatLock(req.params.eventId, req.params.seatId, req.user.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function releaseExpiredLocks(_req, res, next) {
  try {
    const data = await releaseExpiredSeatLocks();
    sendSuccess(res, 200, "Expired seat locks released successfully.", data);
  } catch (error) {
    next(error);
  }
}
