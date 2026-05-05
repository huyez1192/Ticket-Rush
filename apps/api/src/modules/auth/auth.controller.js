import { sendSuccess } from "../../common/responses/apiResponse.js";
import { getCurrentUser, loginUser, logoutUser, registerCustomer } from "./auth.service.js";
import { mapUserToDto } from "../users/user.mapper.js";

export async function register(req, res, next) {
  try {
    const data = await registerCustomer(req.body);
    sendSuccess(res, 200, "Customer registered successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    sendSuccess(res, 200, "Login successful.", data);
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    sendSuccess(res, 200, "Current user fetched successfully.", mapUserToDto(user));
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res, next) {
  try {
    const data = logoutUser();
    sendSuccess(res, 200, "Logout successful.", data);
  } catch (error) {
    next(error);
  }
}
