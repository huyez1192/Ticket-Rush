import { sendSuccess } from "../../common/responses/apiResponse.js";
import {
  getDashboardEventDemographics,
  getDashboardEventRevenue,
  getDashboardEventSeatOccupancy,
  getDashboardOverview
} from "./dashboard.service.js";

export async function adminGetDashboardOverview(_req, res, next) {
  try {
    const data = await getDashboardOverview();
    sendSuccess(res, 200, "Dashboard overview fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetDashboardEventRevenue(req, res, next) {
  try {
    const data = await getDashboardEventRevenue(req.params.eventId, req.query);
    sendSuccess(res, 200, "Event revenue fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetDashboardEventSeatOccupancy(req, res, next) {
  try {
    const data = await getDashboardEventSeatOccupancy(req.params.eventId);
    sendSuccess(res, 200, "Event seat occupancy fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetDashboardEventDemographics(req, res, next) {
  try {
    const data = await getDashboardEventDemographics(req.params.eventId);
    sendSuccess(res, 200, "Event demographics fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

