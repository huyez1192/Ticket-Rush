import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";
import { getRequestBaseUrl } from "../../common/utils/localUpload.js";
import { changeMyPassword, getMyProfile, updateMyProfile, uploadMyAvatar } from "./user.service.js";

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

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError("Avatar image file is required.", 400);
    }

    const data = await uploadMyAvatar(req.user.id, req.file, getRequestBaseUrl(req));
    sendSuccess(res, 200, "Avatar uploaded successfully.", data);
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
