import { sendSuccess } from "../../common/responses/apiResponse.js";
import { changeMyPassword, getMyProfile, updateMyProfile } from "./user.service.js";

export async function getMe(req, res, next) {
  try {
    const data = await getMyProfile(req.user.id);
    sendSuccess(res, 200, "Profile fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const data = await updateMyProfile(req.user.id, req.body);
    sendSuccess(res, 200, "Profile updated successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const data = await changeMyPassword(req.user.id, req.body);
    sendSuccess(res, 200, "Password changed successfully.", data);
  } catch (error) {
    next(error);
  }
}
